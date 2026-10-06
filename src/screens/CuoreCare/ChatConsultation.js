import React, { useRef, useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Keyboard,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ChevronLeft, Send, AlertCircle } from 'lucide-react-native';

import { CC } from './ccTheme';
import { fmtTime } from './ccFormat';
import { useZimChat } from './useZimChat';

const F = CC.fonts;

export default function ChatConsultation({
  appID,
  userId,
  userName,
  zimToken,
  peerId,
  doctorName,
  onLeave,
  onRenewToken,
}) {
  const listRef = useRef(null);
  const [draft, setDraft] = useState('');
  const { messages, connected, error, send } = useZimChat({
    appID,
    userId,
    userName,
    token: zimToken,
    peerId,
    onRenewToken,
  });

  const onSend = useCallback(() => {
    const t = draft.trim();
    if (!t) return;
    setDraft('');
    send(t);
  }, [draft, send]);

  // Keep the newest messages visible when the keyboard opens.
  useEffect(() => {
    const sub = Keyboard.addListener('keyboardDidShow', () => {
      requestAnimationFrame(() => listRef.current?.scrollToEnd({ animated: true }));
    });
    return () => sub.remove();
  }, []);

  const renderItem = ({ item }) => (
    <View style={[styles.bubbleRow, item.mine ? styles.rowMine : styles.rowTheirs]}>
      <View style={[styles.bubble, item.mine ? styles.bubbleMine : styles.bubbleTheirs]}>
        <Text style={[styles.bubbleText, item.mine && styles.bubbleTextMine]}>{item.message}</Text>
        <View style={styles.metaRow}>
          {item.failed && <AlertCircle size={11} color={item.mine ? '#FECACA' : CC.danger} />}
          <Text style={[styles.time, item.mine && styles.timeMine]}>
            {item.pending ? 'Sending…' : item.failed ? 'Failed' : fmtTime(item.timestamp)}
          </Text>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {/* One KeyboardAvoidingView spans the whole screen (below the safe-area top) so the
          composer is lifted above the keyboard on both platforms. iOS pads; Android shrinks
          the frame (the app runs with adjustResize + edge-to-edge disabled). */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onLeave} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <ChevronLeft size={24} color={CC.text} />
          </TouchableOpacity>
          <View style={styles.headerMid}>
            <Text style={styles.headerTitle} numberOfLines={1}>
              {doctorName || 'CuoreCare doctor'}
            </Text>
            <View style={styles.presenceRow}>
              <View style={[styles.dot, { backgroundColor: connected ? CC.success : CC.muted }]} />
              <Text style={styles.presenceText}>{connected ? 'Connected' : 'Connecting…'}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={onLeave} style={styles.leaveBtn}>
            <Text style={styles.leaveText}>Leave</Text>
          </TouchableOpacity>
        </View>

        {error ? (
          <View style={styles.errorBar}>
            <AlertCircle size={14} color={CC.danger} />
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {messages.length === 0 && !error ? (
          <View style={styles.emptyChat}>
            {connected ? (
              <Text style={styles.emptyChatText}>
                You are connected. Send a message to start the consultation.
              </Text>
            ) : (
              <ActivityIndicator color={CC.primary} />
            )}
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={m => m.key}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => listRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Type a message"
            placeholderTextColor={CC.muted}
            value={draft}
            onChangeText={setDraft}
            multiline
            onSubmitEditing={onSend}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !draft.trim() && styles.sendBtnDisabled]}
            onPress={onSend}
            disabled={!draft.trim()}
          >
            <Send size={20} color={CC.white} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: CC.surface },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    backgroundColor: CC.white,
    borderBottomWidth: 1,
    borderBottomColor: CC.border,
  },
  headerMid: { flex: 1, marginLeft: 10 },
  headerTitle: { fontFamily: F.PoppinsSemiBold, fontSize: 15, color: CC.text },
  presenceRow: { flexDirection: 'row', alignItems: 'center', marginTop: 2 },
  dot: { width: 7, height: 7, borderRadius: 4, marginRight: 6 },
  presenceText: { fontFamily: F.PoppinsRegular, fontSize: 11.5, color: CC.subText },
  leaveBtn: { backgroundColor: CC.dangerSoft, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  leaveText: { fontFamily: F.PoppinsMedium, fontSize: 12.5, color: CC.danger },

  errorBar: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: CC.dangerSoft,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  errorText: { fontFamily: F.PoppinsRegular, fontSize: 12, color: CC.danger, marginLeft: 8, flex: 1 },

  emptyChat: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyChatText: {
    fontFamily: F.PoppinsRegular,
    fontSize: 13,
    color: CC.subText,
    textAlign: 'center',
    lineHeight: 20,
  },
  listContent: { padding: 14, paddingBottom: 8 },
  bubbleRow: { marginBottom: 8, flexDirection: 'row' },
  rowMine: { justifyContent: 'flex-end' },
  rowTheirs: { justifyContent: 'flex-start' },
  bubble: { maxWidth: '80%', borderRadius: 16, paddingHorizontal: 13, paddingVertical: 9 },
  bubbleMine: { backgroundColor: CC.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: CC.white, borderWidth: 1, borderColor: CC.border, borderBottomLeftRadius: 4 },
  bubbleText: { fontFamily: F.PoppinsRegular, fontSize: 14, color: CC.text, lineHeight: 20 },
  bubbleTextMine: { color: CC.white },
  metaRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', marginTop: 3, gap: 4 },
  time: { fontFamily: F.PoppinsRegular, fontSize: 10, color: CC.muted },
  timeMine: { color: '#C7DBF5' },

  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: CC.white,
    borderTopWidth: 1,
    borderTopColor: CC.border,
  },
  input: {
    flex: 1,
    maxHeight: 110,
    backgroundColor: CC.surface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 6,
    fontFamily: F.PoppinsRegular,
    fontSize: 14,
    color: CC.text,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: CC.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  sendBtnDisabled: { backgroundColor: CC.muted },
});
