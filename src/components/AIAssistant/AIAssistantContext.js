import React, { createContext, useCallback, useContext, useRef, useState } from 'react';
import { processMessage, executeNavigation } from './AIService';
import { getCurrentRoute } from '../../utilities/NavigationService';

const AIAssistantContext = createContext(null);

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  text: "Hi! I'm your Cuore AI assistant. 🫀 I know which screen you're on (when you're signed in), can open nested pages like **Renew Subscription** or **Support**, and won't send you in circles if you're already there.\n\nWhat would you like to know?",
  timestamp: new Date(),
  suggestions: ['📍 Where am I?', '❤️ Heart Score', '🥗 Nutrition', '💳 Renew subscription'],
};

export function AIAssistantProvider({ children }) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [isTyping, setIsTyping] = useState(false);
  const messageIdRef = useRef(1);

  const nextId = () => {
    messageIdRef.current += 1;
    return `msg-${messageIdRef.current}`;
  };

  const openChat = useCallback(() => setIsOpen(true), []);
  const closeChat = useCallback(() => setIsOpen(false), []);
  const toggleChat = useCallback(() => setIsOpen(prev => !prev), []);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed) return;

    // Append user message
    const userMsg = { id: nextId(), role: 'user', text: trimmed, timestamp: new Date() };
    setMessages(prev => [...prev, userMsg]);

    // Show typing indicator
    setIsTyping(true);

    // Simulate thinking delay (feels more natural)
    const thinkTime = 600 + Math.random() * 800;
    await delay(thinkTime);

    // Get current screen for context-aware responses
    const currentScreen = getCurrentRoute();
    const result = processMessage(trimmed, currentScreen);

    setIsTyping(false);

    if (result) {
      const assistantMsg = {
        id: nextId(),
        role: 'assistant',
        text: result.text,
        timestamp: new Date(),
        suggestions: result.suggestions ?? [],
      };
      setMessages(prev => [...prev, assistantMsg]);

      // Navigate if the response includes an action
      if (result.navigate) {
        executeNavigation(result.navigate);
      }
    }
  }, []);

  const clearHistory = useCallback(() => {
    setMessages([WELCOME_MESSAGE]);
  }, []);

  return (
    <AIAssistantContext.Provider
      value={{ isOpen, openChat, closeChat, toggleChat, messages, isTyping, sendMessage, clearHistory }}
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

const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
