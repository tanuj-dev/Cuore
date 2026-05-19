import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  Animated,
  Easing,
  FlatList,
  Keyboard,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { useSelector } from 'react-redux';
import { useAIAssistant } from './AIAssistantContext';
import { getThemeColors } from '../../theme/colors';

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────
function formatTime(date) {
  if (!date) return '';
  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Renders **bold** markdown inline
function RichText({ text, style }) {
  const parts = String(text).split(/(\*\*[^*]+\*\*)/g);
  return (
    <Text style={style}>
      {parts.map((part, i) =>
        part.startsWith('**') && part.endsWith('**') ? (
          <Text key={i} style={[style, { fontWeight: '700' }]}>
            {part.slice(2, -2)}
          </Text>
        ) : (
          <Text key={i}>{part}</Text>
        ),
      )}
    </Text>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Typing indicator  ·  ·  ·  with label
// ─────────────────────────────────────────────────────────────────────────────
function TypingIndicator({ colors }) {
  const dots = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  useEffect(() => {
    const anims = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 180),
          Animated.timing(dot, { toValue: 1, duration: 380, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 380, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(260),
        ]),
      ),
    );
    Animated.parallel(anims).start();
    return () => anims.forEach(a => a.stop());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={typingS.row}>
      <View style={[typingS.avatar, { backgroundColor: '#6D28D9' }]}>
        <Text style={typingS.avatarLetter}>C</Text>
      </View>
      <View style={[typingS.bubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
        <Text style={[typingS.label, { color: colors.subText }]}>Cuore AI is thinking</Text>
        <View style={typingS.dotsRow}>
          {dots.map((dot, i) => (
            <Animated.View
              key={i}
              style={[
                typingS.dot,
                {
                  backgroundColor: colors.primary,
                  transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -4] }) }],
                },
              ]}
            />
          ))}
        </View>
      </View>
    </View>
  );
}

const typingS = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-end', marginLeft: 12, marginVertical: 6 },
  avatar: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginRight: 8 },
  avatarLetter: { color: '#FFF', fontWeight: '800', fontSize: 12 },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  label: { fontSize: 12, fontStyle: 'italic' },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dot: { width: 6, height: 6, borderRadius: 3 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Suggestion chips (horizontal scroll after assistant messages)
// ─────────────────────────────────────────────────────────────────────────────
function SuggestionChips({ suggestions, onPress, colors }) {
  if (!suggestions?.length) return null;
  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={chipS.row}>
      {suggestions.map((s, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onPress(s)}
          activeOpacity={0.72}
          style={[chipS.chip, { backgroundColor: colors.surface, borderColor: colors.primary }]}
        >
          <Text style={[chipS.text, { color: colors.primary }]}>{s}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const chipS = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 2, gap: 8 },
  chip: { borderWidth: 1.5, borderRadius: 20, paddingHorizontal: 13, paddingVertical: 6 },
  text: { fontSize: 12.5, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Quick-actions grid (shown when only the welcome message exists)
// ─────────────────────────────────────────────────────────────────────────────
const QUICK_GRID = [
  { emoji: '❤️', label: 'Heart Score', query: 'heart score' },
  { emoji: '📊', label: 'My Trends', query: 'trends' },
  { emoji: '🥗', label: 'Nutrition', query: 'nutrition' },
  { emoji: '💪', label: 'Fitness', query: 'fitness' },
  { emoji: '🧠', label: 'Mental Health', query: 'mind' },
  { emoji: '📝', label: 'My Notes', query: 'notes' },
];

function QuickActionsGrid({ onPress, colors, isDark }) {
  return (
    <View style={gridS.wrapper}>
      <Text style={[gridS.title, { color: colors.subText }]}>Quick actions</Text>
      <View style={gridS.grid}>
        {QUICK_GRID.map((item, i) => (
          <TouchableOpacity
            key={i}
            onPress={() => onPress(item.query)}
            activeOpacity={0.75}
            style={[
              gridS.card,
              {
                backgroundColor: isDark ? '#1F2937' : '#F0F5FF',
                borderColor: isDark ? '#334155' : '#DBEAFE',
              },
            ]}
          >
            <Text style={gridS.cardEmoji}>{item.emoji}</Text>
            <Text style={[gridS.cardLabel, { color: colors.text }]}>{item.label}</Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const gridS = StyleSheet.create({
  wrapper: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 4 },
  title: { fontSize: 11, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 8, marginLeft: 2 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  card: {
    width: '47%',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  cardEmoji: { fontSize: 18 },
  cardLabel: { fontSize: 13, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────────────────────
// Individual message bubble
// ─────────────────────────────────────────────────────────────────────────────
function MessageBubble({ message, colors, isDark, onSuggestionPress }) {
  const isUser = message.role === 'user';
  const isNav = message.role === 'nav';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isUser ? 16 : -8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 280, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 140, friction: 11 }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (isNav) {
    return (
      <Animated.View style={[{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }, navS.wrapper]}>
        <LinearGradient
          colors={['#059669', '#10B981']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={navS.bubble}
        >
          <Text style={navS.icon}>✦</Text>
          <RichText text={message.text} style={navS.text} />
        </LinearGradient>
        <Text style={[navS.time, { color: colors.subText }]}>{formatTime(message.timestamp)}</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View
      style={[
        msgS.wrapper,
        isUser ? msgS.userWrapper : msgS.assistantWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {/* Assistant avatar */}
      {!isUser && (
        <LinearGradient
          colors={['#4F46E5', '#6D28D9']}
          style={msgS.avatar}
        >
          <Text style={msgS.avatarText}>C</Text>
        </LinearGradient>
      )}

      <View style={msgS.bubbleCol}>
        {isUser ? (
          <LinearGradient
            colors={['#1D6FE8', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[msgS.bubble, msgS.userBubble]}
          >
            <Text style={[msgS.text, { color: '#FFFFFF' }]}>{message.text}</Text>
          </LinearGradient>
        ) : (
          <View
            style={[
              msgS.bubble,
              msgS.assistantBubble,
              {
                backgroundColor: isDark ? '#1E293B' : '#F8FAFF',
                borderColor: isDark ? '#334155' : '#E0E7FF',
                shadowColor: isDark ? '#000' : '#6366F1',
              },
            ]}
          >
            <RichText text={message.text} style={[msgS.text, { color: colors.text }]} />
          </View>
        )}

        {/* Timestamp */}
        <Text style={[msgS.timestamp, { color: colors.subText, alignSelf: isUser ? 'flex-end' : 'flex-start' }]}>
          {formatTime(message.timestamp)}
        </Text>

        {/* Suggestion chips */}
        {!isUser && message.suggestions?.length > 0 && (
          <SuggestionChips suggestions={message.suggestions} onPress={onSuggestionPress} colors={colors} />
        )}
      </View>
    </Animated.View>
  );
}

const navS = StyleSheet.create({
  wrapper: { marginHorizontal: 16, marginVertical: 6, alignItems: 'flex-start' },
  bubble: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 14,
  },
  icon: { color: '#FFFFFF', fontSize: 13 },
  text: { color: '#FFFFFF', fontSize: 13.5, fontWeight: '600', flex: 1 },
  time: { fontSize: 10, marginTop: 3, marginLeft: 2 },
});

const msgS = StyleSheet.create({
  wrapper: { flexDirection: 'row', marginVertical: 4, paddingHorizontal: 12 },
  userWrapper: { justifyContent: 'flex-end' },
  assistantWrapper: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  avatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    alignSelf: 'flex-end',
    marginBottom: 16,
  },
  avatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 12 },
  bubbleCol: { maxWidth: '80%' },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { borderTopRightRadius: 4 },
  assistantBubble: {
    borderTopLeftRadius: 4,
    borderWidth: 1,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 2,
  },
  text: { fontSize: 15, lineHeight: 22 },
  timestamp: { fontSize: 10, marginTop: 3, marginHorizontal: 2, opacity: 0.7 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Input bar
// ─────────────────────────────────────────────────────────────────────────────
function InputBar({ value, onChangeText, onSend, colors, isDark }) {
  const [focused, setFocused] = useState(false);
  const canSend = value.trim().length > 0;

  return (
    <View
      style={[
        inputS.wrapper,
        { backgroundColor: isDark ? '#111827' : '#F8FAFC', borderTopColor: colors.border },
      ]}
    >
      {/* Text input */}
      <View
        style={[
          inputS.inputWrap,
          {
            backgroundColor: isDark ? '#1F2937' : '#FFFFFF',
            borderColor: focused ? colors.primary : colors.border,
          },
        ]}
      >
        <TextInput
          style={[inputS.input, { color: colors.text }]}
          value={value}
          onChangeText={onChangeText}
          placeholder="Ask me anything..."
          placeholderTextColor={colors.subText}
          multiline
          maxLength={500}
          onSubmitEditing={onSend}
          returnKeyType="send"
          blurOnSubmit
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
      </View>

      {/* Send button */}
      <TouchableOpacity onPress={onSend} disabled={!canSend} activeOpacity={0.8}>
        <LinearGradient
          colors={canSend ? ['#1D6FE8', '#4F46E5'] : [colors.border, colors.border]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={inputS.sendBtn}
        >
          <Text style={[inputS.sendIcon, { opacity: canSend ? 1 : 0.5 }]}>↑</Text>
        </LinearGradient>
      </TouchableOpacity>
    </View>
  );
}

const inputS = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  inputWrap: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: Platform.OS === 'ios' ? 9 : 6,
    maxHeight: 100,
  },
  input: { fontSize: 15, lineHeight: 20 },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#4F46E5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  sendIcon: { color: '#FFFFFF', fontSize: 19, fontWeight: '800', marginTop: -2 },
});

// ─────────────────────────────────────────────────────────────────────────────
// Main panel
// ─────────────────────────────────────────────────────────────────────────────
export default function AIAssistantChat() {
  const { isOpen, closeChat, messages, isTyping, sendMessage, clearHistory } = useAIAssistant();
  const themeMode = useSelector(state => state.theme?.mode ?? 'light');
  const colors = getThemeColors(themeMode);
  const isDark = themeMode === 'dark';

  const [inputText, setInputText] = useState('');
  const [keyboardInset, setKeyboardInset] = useState(0);
  const flatListRef = useRef(null);

  // Panel slide-up animation (non-native value drives panel outer position)
  const slideAnim = useRef(new Animated.Value(700)).current;
  // Backdrop fade
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Keyboard handling — plain state avoids native/JS driver conflicts
  useEffect(() => {
    const showEvt = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvt = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';
    const showSub = Keyboard.addListener(showEvt, e => setKeyboardInset(e.endCoordinates?.height ?? 0));
    const hideSub = Keyboard.addListener(hideEvt, () => setKeyboardInset(0));
    return () => { showSub.remove(); hideSub.remove(); };
  }, []);

  // Open/close animation
  useEffect(() => {
    if (isOpen) {
      Animated.parallel([
        Animated.spring(slideAnim, { toValue: 0, useNativeDriver: false, tension: 60, friction: 11 }),
        Animated.timing(backdropAnim, { toValue: 1, duration: 280, useNativeDriver: false }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, { toValue: 700, duration: 240, easing: Easing.in(Easing.ease), useNativeDriver: false }),
        Animated.timing(backdropAnim, { toValue: 0, duration: 200, useNativeDriver: false }),
      ]).start();
    }
  }, [isOpen, slideAnim, backdropAnim]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen, scrollToBottom]);

  const handleSend = useCallback(() => {
    const t = inputText.trim();
    if (!t) return;
    setInputText('');
    sendMessage(t);
  }, [inputText, sendMessage]);

  const handleSuggestion = useCallback(s => {
    // Strip leading emoji + space for cleaner intent matching
    const cleaned = s.replace(/^[\u{1F000}-\u{1FFFF}☀-➿]\s*/u, '').trim();
    sendMessage(cleaned);
  }, [sendMessage]);

  const showQuickGrid = messages.length === 1 && messages[0]?.id === 'welcome';

  if (!isOpen) return null;

  return (
    <Modal visible={isOpen} transparent animationType="none" onRequestClose={closeChat} statusBarTranslucent>
      <View style={{ flex: 1 }}>

        {/* ── Backdrop ──────────────────────────────────────────── */}
        <Animated.View style={[panelS.backdrop, { opacity: backdropAnim }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => { Keyboard.dismiss(); closeChat(); }} activeOpacity={1} />
        </Animated.View>

        {/* ── Panel ─────────────────────────────────────────────── */}
        <Animated.View
          style={[
            panelS.panel,
            {
              bottom: keyboardInset,
              transform: [{ translateY: slideAnim }],
              backgroundColor: isDark ? '#0D1117' : '#FFFFFF',
            },
          ]}
        >
          {/* Drag handle */}
          <View style={panelS.dragWrap}>
            <View style={[panelS.dragHandle, { backgroundColor: isDark ? '#374151' : '#CBD5E1' }]} />
          </View>

          {/* ── Header ──────────────────────────────────────────── */}
          <LinearGradient
            colors={isDark ? ['#1E1B4B', '#1e3a8a'] : ['#1D6FE8', '#4F46E5']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={panelS.header}
          >
            {/* Avatar + title */}
            <View style={panelS.headerLeft}>
              <LinearGradient colors={['rgba(255,255,255,0.25)', 'rgba(255,255,255,0.1)']} style={panelS.headerAvatar}>
                <Text style={panelS.headerAvatarText}>✦</Text>
              </LinearGradient>
              <View>
                <Text style={panelS.headerTitle}>Cuore AI</Text>
                <View style={panelS.statusRow}>
                  <View style={panelS.statusDot} />
                  <Text style={panelS.statusText}>Online · Ready to help</Text>
                </View>
              </View>
            </View>

            {/* Actions */}
            <View style={panelS.headerRight}>
              <TouchableOpacity onPress={clearHistory} style={panelS.headerPill} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={panelS.headerPillText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => { Keyboard.dismiss(); closeChat(); }} style={panelS.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={panelS.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* ── Messages ────────────────────────────────────────── */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={useCallback(({ item }) => (
              <MessageBubble
                message={item}
                colors={colors}
                isDark={isDark}
                onSuggestionPress={handleSuggestion}
              />
            ), [colors, isDark, handleSuggestion])}
            contentContainerStyle={panelS.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            ListFooterComponent={
              <>
                {isTyping && <TypingIndicator colors={colors} />}
                {showQuickGrid && !isTyping && (
                  <QuickActionsGrid onPress={sendMessage} colors={colors} isDark={isDark} />
                )}
              </>
            }
          />

          {/* ── Input bar ───────────────────────────────────────── */}
          <InputBar
            value={inputText}
            onChangeText={setInputText}
            onSend={handleSend}
            colors={colors}
            isDark={isDark}
          />

          {/* Footer */}
          <Text style={[panelS.footer, { color: colors.subText }]}>
            Powered by Cuore Intelligence
          </Text>
        </Animated.View>

      </View>
    </Modal>
  );
}

const panelS = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  panel: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: '82%',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.25,
    shadowRadius: 24,
    elevation: 30,
  },
  dragWrap: { alignItems: 'center', paddingTop: 10, paddingBottom: 2 },
  dragHandle: { width: 38, height: 4, borderRadius: 2 },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 13,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 11 },
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.35)',
  },
  headerAvatarText: { color: '#FFFFFF', fontSize: 18 },
  headerTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  statusDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#34D399' },
  statusText: { color: 'rgba(255,255,255,0.75)', fontSize: 11 },
  headerRight: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerPill: {
    paddingHorizontal: 11,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.15)',
  },
  headerPillText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(255,255,255,0.18)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  // Messages
  messageList: { paddingVertical: 10, paddingBottom: 6 },
  // Footer
  footer: { textAlign: 'center', fontSize: 10, paddingVertical: 5 },
});
