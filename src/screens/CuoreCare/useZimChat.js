import { useEffect, useRef, useState, useCallback } from 'react';
import ZIM from 'zego-zim-react-native';

// ZIM RN enums (verified against zego-zim-react-native@2.28 d.ts).
const CONVERSATION_PEER = 0; // ZIMConversationType.Peer
const MESSAGE_TEXT = 1; // ZIMMessageType.Text
const PRIORITY_LOW = 1; // ZIMMessagePriority.Low

const toItem = (mine, m) => ({
  key: String(m?.messageID || m?.localMessageID || `m_${m?.timestamp || Date.now()}_${Math.random()}`),
  mine,
  message: m?.message || '',
  timestamp: Number(m?.timestamp) || Date.now(),
  pending: false,
  failed: false,
});

/**
 * Minimal, fail-soft ZIM 1-to-1 chat for a CuoreCare consultation (patient side).
 *
 * Identity + auth come from the backend `join` response: userID `u_<patientId>` + the
 * empty-payload `zimToken`. Peer is `d_<doctorId>`, the exact id the doctor portal logs in
 * with. Conversation id for a peer chat === the peer's userID.
 *
 * ZIM allows only ONE instance process-wide; we reuse getInstance() if something already
 * created it. Nothing here throws upward — any failure surfaces via `error` so the call
 * screen degrades gracefully instead of crashing.
 */
export function useZimChat({ appID, userId, userName, token, peerId, onRenewToken, enabled = true }) {
  const [messages, setMessages] = useState([]);
  const [connected, setConnected] = useState(false);
  const [error, setError] = useState(null);
  const zimRef = useRef(null);
  const cancelledRef = useRef(false);

  const merge = useCallback(items => {
    setMessages(prev => {
      const seen = new Set(prev.map(m => m.key));
      const add = items.filter(m => !seen.has(m.key));
      if (add.length === 0) return prev;
      return [...prev, ...add].sort((a, b) => a.timestamp - b.timestamp);
    });
  }, []);

  useEffect(() => {
    if (!enabled || !appID || !userId || !token || !peerId) return undefined;
    cancelledRef.current = false;

    (async () => {
      try {
        // appSign is a required field on native even for token auth — pass it empty; the
        // per-user `token` from the backend join response is what actually authenticates.
        const zim = ZIM.getInstance() || ZIM.create({ appID, appSign: '' });
        if (!zim) {
          setError('Chat is unavailable right now.');
          return;
        }
        zimRef.current = zim;

        // on() overwrites the previous listener for a given event (per ZIM docs), so
        // re-registering on remount is safe and never stacks handlers.
        zim.on('peerMessageReceived', (_z, data) => {
          if (cancelledRef.current) return;
          /* `fromConversationID` is where the sender is — top level on the event.
           * `info` is a ZIMMessageReceivedInfo (offline flag, receipt status) and
           * has no conversationID at all, so reading it gave undefined, which
           * never equals peerId: EVERY incoming message was silently dropped.
           * Sending worked throughout, which is what made it look like the
           * doctor's replies were not arriving at all. */
          const from = data?.fromConversationID ?? data?.info?.conversationID;
          if (from !== peerId) return;
          merge((data.messageList || []).map(m => toItem(false, m)));
        });
        zim.on('tokenWillExpire', async () => {
          try {
            const fresh = await onRenewToken?.();
            if (fresh) await zim.renewToken(fresh);
          } catch (_) {}
        });

        await zim.login(userId, { userName: userName || userId, token, isOfflineLogin: false });
        if (cancelledRef.current) return;
        setConnected(true);

        const res = await zim.queryHistoryMessage(peerId, CONVERSATION_PEER, {
          count: 30,
          reverse: false,
        });
        if (cancelledRef.current) return;
        merge((res?.messageList || []).map(m => toItem(m.senderUserID === userId, m)));
      } catch (e) {
        if (!cancelledRef.current) setError(e?.message || 'Could not connect to chat.');
      }
    })();

    return () => {
      cancelledRef.current = true;
      try {
        zimRef.current?.logout();
      } catch (_) {}
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, appID, userId, token, peerId]);

  const send = useCallback(
    async text => {
      const body = String(text || '').trim();
      const zim = zimRef.current;
      if (!zim || !body) return;
      const optimisticKey = `local-${Date.now()}`;
      setMessages(prev => [
        ...prev,
        { key: optimisticKey, mine: true, message: body, timestamp: Date.now(), pending: true, failed: false },
      ]);
      try {
        const res = await zim.sendMessage(
          { type: MESSAGE_TEXT, message: body },
          peerId,
          CONVERSATION_PEER,
          { priority: PRIORITY_LOW },
        );
        const confirmed = toItem(true, res?.message);
        setMessages(prev => prev.map(m => (m.key === optimisticKey ? confirmed : m)));
      } catch (e) {
        setMessages(prev =>
          prev.map(m => (m.key === optimisticKey ? { ...m, pending: false, failed: true } : m)),
        );
      }
    },
    [peerId],
  );

  return { messages, connected, error, send };
}

export default useZimChat;
