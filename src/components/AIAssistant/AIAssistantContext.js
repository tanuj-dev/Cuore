import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import EncryptedStorage from 'react-native-encrypted-storage';
import { processMessage, executeNavigation } from './AIService';
import { getCurrentRoute } from '../../utilities/NavigationService';

const AI_ENABLED_KEY = 'cuore_ai_assistant_enabled';

const AIAssistantContext = createContext(null);

// ─── Helpers ────────────────────────────────────────────────────────────────
function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function buildWelcome(firstName) {
  const greeting = getTimeGreeting();
  const name = firstName ? `, ${firstName}` : '';
  return {
    id: 'welcome',
    role: 'assistant',
    text: `${greeting}${name}! 🫀 I'm your Cuore AI assistant.\n\nI can navigate you to any screen, explain your heart score, track your nutrition & fitness, and answer questions about your cardiac health.\n\nWhat would you like to know?`,
    timestamp: new Date(),
    suggestions: ['❤️ Heart Score', '🥗 Nutrition', '💪 Fitness', '🧠 Mental Health'],
  };
}

// Screen name → readable label for nav confirmation bubble
const SCREEN_LABELS = {
  Today: 'Today Dashboard',
  Explore: 'Explore',
  Trend: 'Trends',
  Notes: 'Notes',
  Profile: 'Profile',
  Score: 'Heart Score',
  Health: 'Health',
  Nutrition: 'Nutrition',
  Fitness: 'Fitness',
  Mind: 'Mental Health',
  Tobacco: 'Tobacco Tracker',
  HealthRecords: 'Health Records',
  EditProfile: 'Edit Profile',
  Support: 'Support',
  CuoreKnowledge: 'Knowledge Base',
  Predict: 'Predict',
  Checkout: 'Checkout',
  MealBuilder: 'Meal Builder',
  Recipe: 'Recipes',
};

function getScreenLabel(nav) {
  if (!nav) return 'the screen';
  const key = typeof nav === 'string' ? nav : nav?.screen ?? nav?.parent;
  return SCREEN_LABELS[key] ?? key;
}

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));

// ─── Provider ────────────────────────────────────────────────────────────────
export function AIAssistantProvider({ children }) {
  const firstName = useSelector(state => {
    const name =
      state?.profile?.data?.data?.user?.name ||
      state?.auth?.name ||
      state?.auth?.user?.name ||
      null;
    return name ? name.split(' ')[0] : null;
  });

  const [isEnabled, setIsEnabled] = useState(true);
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState(() => [buildWelcome(null)]);
  const [isTyping, setIsTyping] = useState(false);
  const messageIdRef = useRef(1);
  const welcomeUpdated = useRef(false);

  // Load persisted enabled state on mount
  useEffect(() => {
    EncryptedStorage.getItem(AI_ENABLED_KEY)
      .then(val => { if (val !== null) setIsEnabled(val === 'true'); })
      .catch(() => {});
  }, []);

  const toggleEnabled = useCallback(() => {
    setIsEnabled(prev => {
      const next = !prev;
      EncryptedStorage.setItem(AI_ENABLED_KEY, String(next)).catch(() => {});
      if (!next) setIsOpen(false); // close chat if disabling
      return next;
    });
  }, []);

  // Personalize welcome message once the user name loads
  useEffect(() => {
    if (firstName && !welcomeUpdated.current) {
      welcomeUpdated.current = true;
      setMessages(prev =>
        prev[0]?.id === 'welcome' ? [buildWelcome(firstName), ...prev.slice(1)] : prev,
      );
    }
  }, [firstName]);

  const nextId = useCallback(() => {
    messageIdRef.current += 1;
    return `msg-${messageIdRef.current}`;
  }, []);

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen(prev => !prev), []);

  const sendMessage = useCallback(async text => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // 1. Add user bubble
    setMessages(prev => [...prev, { id: nextId(), role: 'user', text: trimmed, timestamp: new Date() }]);

    // 2. Show typing indicator with a natural delay
    setIsTyping(true);
    await delay(700 + Math.random() * 700);

    const currentScreen = getCurrentRoute();
    const result = processMessage(trimmed, currentScreen);
    setIsTyping(false);

    if (!result) return;

    // 3. Add assistant reply (no suggestion chips when navigating — nav bubble shows instead)
    setMessages(prev => [
      ...prev,
      {
        id: nextId(),
        role: 'assistant',
        text: result.text,
        timestamp: new Date(),
        suggestions: result.navigate ? [] : (result.suggestions ?? []),
      },
    ]);

    // 4. If navigating: show green nav-confirmation bubble, then navigate + close
    if (result.navigate) {
      await delay(320);
      setMessages(prev => [
        ...prev,
        {
          id: nextId(),
          role: 'nav',
          text: `Opening **${getScreenLabel(result.navigate)}** for you ✓`,
          timestamp: new Date(),
        },
      ]);
      executeNavigation(result.navigate, 700);
      setTimeout(() => setIsOpen(false), 1100);
    }
  }, [nextId]);

  const clearHistory = useCallback(() => {
    welcomeUpdated.current = false;
    setMessages([buildWelcome(firstName)]);
  }, [firstName]);

  return (
    <AIAssistantContext.Provider
      value={{ isEnabled, toggleEnabled, isOpen, openChat, closeChat, toggleChat, messages, isTyping, sendMessage, clearHistory }}
    >
      {children}
    </AIAssistantContext.Provider>
  );
}

export function useAIAssistant() {
  const ctx = useContext(AIAssistantContext);
  if (!ctx) throw new Error('useAIAssistant must be used inside AIAssistantProvider');
  return ctx;
}
