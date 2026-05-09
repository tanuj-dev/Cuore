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

// ─────────────────────────────────────────────────────────────
// Typing indicator: three animated dots
// ─────────────────────────────────────────────────────────────
function TypingIndicator({ colors }) {
  const dots = [useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current, useRef(new Animated.Value(0)).current];

  useEffect(() => {
    const animations = dots.map((dot, i) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(i * 160),
          Animated.timing(dot, { toValue: 1, duration: 360, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.timing(dot, { toValue: 0, duration: 360, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
          Animated.delay(320),
        ]),
      ),
    );
    Animated.parallel(animations).start();
    return () => animations.forEach(a => a.stop());
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={[typingStyles.bubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
      <View style={typingStyles.dotsRow}>
        {dots.map((dot, i) => (
          <Animated.View
            key={i}
            style={[
              typingStyles.dot,
              { backgroundColor: colors.primary, transform: [{ translateY: dot.interpolate({ inputRange: [0, 1], outputRange: [0, -5] }) }] },
            ]}
          />
        ))}
      </View>
    </View>
  );
}

const typingStyles = StyleSheet.create({
  bubble: {
    alignSelf: 'flex-start',
    marginLeft: 12,
    marginVertical: 4,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 18,
    borderTopLeftRadius: 4,
    borderWidth: 1,
  },
  dotsRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  dot: { width: 7, height: 7, borderRadius: 3.5 },
});

// ─────────────────────────────────────────────────────────────
// Quick suggestion chips
// ─────────────────────────────────────────────────────────────
function SuggestionChips({ suggestions, onPress, colors }) {
  if (!suggestions?.length) return null;
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={chipStyles.row}
    >
      {suggestions.map((s, i) => (
        <TouchableOpacity
          key={i}
          onPress={() => onPress(s)}
          style={[chipStyles.chip, { borderColor: colors.primary, backgroundColor: colors.surface }]}
          activeOpacity={0.7}
        >
          <Text style={[chipStyles.chipText, { color: colors.primary }]}>{s}</Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );
}

const chipStyles = StyleSheet.create({
  row: { paddingHorizontal: 12, paddingVertical: 6, gap: 8 },
  chip: {
    borderWidth: 1.5,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 7,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
});

// ─────────────────────────────────────────────────────────────
// Individual message bubble
// ─────────────────────────────────────────────────────────────
function MessageBubble({ message, colors, onSuggestionPress }) {
  const isUser = message.role === 'user';

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(12)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, useNativeDriver: true, tension: 120, friction: 10 }),
    ]).start();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Render markdown-lite: bold **text** rendering
  const renderText = (text) => {
    const parts = text.split(/(\*\*[^*]+\*\*)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return (
          <Text key={i} style={{ fontWeight: '700', color: isUser ? '#FFFFFF' : colors.text }}>
            {part.slice(2, -2)}
          </Text>
        );
      }
      return (
        <Text key={i} style={{ color: isUser ? '#FFFFFF' : colors.text }}>
          {part}
        </Text>
      );
    });
  };

  return (
    <Animated.View
      style={[
        msgStyles.wrapper,
        isUser ? msgStyles.userWrapper : msgStyles.assistantWrapper,
        { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      {!isUser && (
        <View style={[msgStyles.avatar, { backgroundColor: colors.primary }]}>
          <Text style={msgStyles.avatarText}>C</Text>
        </View>
      )}
      <View style={{ maxWidth: '78%' }}>
        {isUser ? (
          <LinearGradient
            colors={['#1D6FE8', '#0F3F8C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={[msgStyles.bubble, msgStyles.userBubble]}
          >
            <Text style={[msgStyles.text, { color: '#FFFFFF' }]}>{message.text}</Text>
          </LinearGradient>
        ) : (
          <View style={[msgStyles.bubble, msgStyles.assistantBubble, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            <Text style={[msgStyles.text, { color: colors.text }]}>{renderText(message.text)}</Text>
          </View>
        )}

        {/* Suggestion chips after assistant messages */}
        {!isUser && message.suggestions?.length > 0 && (
          <SuggestionChips
            suggestions={message.suggestions}
            onPress={onSuggestionPress}
            colors={colors}
          />
        )}
      </View>
    </Animated.View>
  );
}

const msgStyles = StyleSheet.create({
  wrapper: { flexDirection: 'row', marginVertical: 5, paddingHorizontal: 12 },
  userWrapper: { justifyContent: 'flex-end' },
  assistantWrapper: { justifyContent: 'flex-start', alignItems: 'flex-end' },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
    marginBottom: 2,
    alignSelf: 'flex-end',
  },
  avatarText: { color: '#FFFFFF', fontWeight: '700', fontSize: 13 },
  bubble: { borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  userBubble: { borderTopRightRadius: 4 },
  assistantBubble: { borderTopLeftRadius: 4, borderWidth: 1 },
  text: { fontSize: 15, lineHeight: 22 },
});

// ─────────────────────────────────────────────────────────────
// Main chat panel
// ─────────────────────────────────────────────────────────────
export default function AIAssistantChat() {
  const { isOpen, closeChat, messages, isTyping, sendMessage, clearHistory } = useAIAssistant();
  const themeMode = useSelector(state => state.theme?.mode ?? 'light');
  const colors = getThemeColors(themeMode);
  const isDark = themeMode === 'dark';

  const [inputText, setInputText] = useState('');
  const flatListRef = useRef(null);
  /** Plain number — never use Animated for keyboard inset (avoids native/JS driver conflicts with slideAnim). */
  const [keyboardInset, setKeyboardInset] = useState(0);

  // Slide-up animation for the panel
  const slideAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = e => {
      setKeyboardInset(e.endCoordinates?.height ?? 0);
    };
    const onHide = () => {
      setKeyboardInset(0);
    };

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 65,
        friction: 11,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 220,
        easing: Easing.in(Easing.ease),
        useNativeDriver: true,
      }).start();
    }
  }, [isOpen, slideAnim]);

  const translateY = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [700, 0] });
  const backdropOpacity = slideAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 1] });

  const scrollToBottom = useCallback(() => {
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 80);
  }, []);

  useEffect(() => {
    if (isOpen) scrollToBottom();
  }, [messages, isTyping, isOpen, scrollToBottom]);

  const handleSend = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;
    setInputText('');
    sendMessage(text);
  }, [inputText, sendMessage]);

  const handleSuggestion = useCallback((suggestion) => {
    // Strip emoji prefix for cleaner query
    const cleaned = suggestion.replace(/^[\u{1F000}-\u{1FFFF}☀-⟿]\s*/u, '').trim();
    sendMessage(cleaned);
  }, [sendMessage]);

  if (!isOpen) return null;

  return (
    <Modal
      visible={isOpen}
      transparent
      animationType="none"
      onRequestClose={closeChat}
      statusBarTranslucent
    >
      <View style={{ flex: 1 }}>
        {/* Backdrop */}
        <Animated.View style={[panelStyles.backdrop, { opacity: backdropOpacity }]}>
          <TouchableOpacity style={{ flex: 1 }} onPress={() => { Keyboard.dismiss(); closeChat(); }} activeOpacity={1} />
        </Animated.View>

        {/* Panel: outer View uses numeric keyboard inset only; inner Animated.View = slide (native driver). */}
        <View
          style={[
            panelStyles.panel,
            {
              backgroundColor: isDark ? '#0F172A' : '#FFFFFF',
              bottom: keyboardInset,
              paddingBottom: Platform.OS === 'ios' ? 20 : 8,
            },
          ]}
        >
          <Animated.View
            style={[
              panelStyles.panelInner,
              { transform: [{ translateY }] },
            ]}
          >
          {/* Header */}
          <LinearGradient
            colors={isDark ? ['#1E3A6E', '#0F2447'] : ['#1D6FE8', '#0F3F8C']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={panelStyles.header}
          >
            <View style={panelStyles.headerLeft}>
              <View style={panelStyles.headerAvatar}>
                <Text style={panelStyles.headerAvatarText}>C</Text>
              </View>
              <View>
                <Text style={panelStyles.headerTitle}>Cuore AI</Text>
                <View style={panelStyles.onlineRow}>
                  <View style={panelStyles.onlineDot} />
                  <Text style={panelStyles.onlineText}>Online • Always here to help</Text>
                </View>
              </View>
            </View>
            <View style={panelStyles.headerActions}>
              <TouchableOpacity onPress={clearHistory} style={panelStyles.headerBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={panelStyles.headerBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={closeChat} style={panelStyles.closeBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <Text style={panelStyles.closeBtnText}>✕</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {/* Message list */}
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item.id}
            renderItem={({ item }) => (
              <MessageBubble
                message={item}
                colors={colors}
                onSuggestionPress={handleSuggestion}
              />
            )}
            contentContainerStyle={panelStyles.messageList}
            showsVerticalScrollIndicator={false}
            onContentSizeChange={scrollToBottom}
            ListFooterComponent={isTyping ? <TypingIndicator colors={colors} /> : null}
          />

          {/* Input bar */}
          <View
            style={[
              panelStyles.inputBar,
              {
                backgroundColor: isDark ? '#1F2937' : '#F8FAFC',
                borderTopColor: colors.border,
              },
            ]}
          >
            <TextInput
              style={[
                panelStyles.input,
                {
                  backgroundColor: isDark ? '#374151' : '#FFFFFF',
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={inputText}
              onChangeText={setInputText}
              placeholder="Ask me anything about Cuore..."
              placeholderTextColor={colors.subText}
              multiline
              maxLength={500}
              onSubmitEditing={handleSend}
              returnKeyType="send"
              blurOnSubmit
            />
            <TouchableOpacity
              onPress={handleSend}
              disabled={!inputText.trim()}
              style={[panelStyles.sendBtn, { opacity: inputText.trim() ? 1 : 0.4 }]}
              activeOpacity={0.75}
            >
              <LinearGradient
                colors={['#1D6FE8', '#0F3F8C']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={panelStyles.sendGradient}
              >
                <Text style={panelStyles.sendIcon}>↑</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          <Text style={[panelStyles.footer, { color: colors.subText }]}>
            Powered by Cuore Intelligence
          </Text>
          </Animated.View>
        </View>
      </View>
    </Modal>
  );
}

const PANEL_HEIGHT = '75%';

const panelStyles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  panel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: PANEL_HEIGHT,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.2,
    shadowRadius: 20,
    elevation: 25,
  },
  panelInner: {
    flex: 1,
    overflow: 'hidden',
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  headerAvatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(255,255,255,0.4)',
  },
  headerAvatarText: { color: '#FFFFFF', fontWeight: '800', fontSize: 16 },
  headerTitle: { color: '#FFFFFF', fontWeight: '700', fontSize: 16, letterSpacing: 0.2 },
  onlineRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 2 },
  onlineDot: { width: 7, height: 7, borderRadius: 3.5, backgroundColor: '#34D399' },
  onlineText: { color: 'rgba(255,255,255,0.8)', fontSize: 11 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.15)' },
  headerBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '600' },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center' },
  closeBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
  // Messages
  messageList: { paddingVertical: 12, paddingBottom: 4 },
  // Input bar
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  input: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: Platform.OS === 'ios' ? 10 : 8,
    fontSize: 15,
    maxHeight: 100,
    lineHeight: 20,
  },
  sendBtn: { marginBottom: 2 },
  sendGradient: {
    width: 42,
    height: 42,
    borderRadius: 21,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#11418A',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 6,
  },
  sendIcon: { color: '#FFFFFF', fontSize: 18, fontWeight: '700', marginTop: -1 },
  footer: { textAlign: 'center', fontSize: 10, paddingBottom: 6, paddingTop: 2 },
});
