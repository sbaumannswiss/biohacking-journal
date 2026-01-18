'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Send, Loader2, Target, Check, FlaskConical, Camera, Sparkles } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { useAnonymousUser } from '@/hooks/useAnonymousUser';
import { cn } from '@/lib/utils';
import { parseQuestFromMessage, CreateQuestInput } from '@/lib/agent/questService';
import { parseSupplementFromMessage, ParsedSupplementSuggestion } from '@/lib/agent/supplementService';
import { ScanModal } from '@/components/ui/ScanModal';
import { addToStack } from '@/lib/supabaseService';
import { useHelix } from '@/components/coach';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  quest?: CreateQuestInput; // Parsed quest from message
  questActivated?: boolean; // Whether quest was activated
  supplement?: ParsedSupplementSuggestion; // Parsed supplement suggestion
  supplementSubmitted?: boolean; // Whether supplement was submitted
}

export function FloatingChat() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPulse, setShowPulse] = useState(true);
  const [showScanModal, setShowScanModal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { userId } = useAnonymousUser();
  const { helixMood } = useHelix();

  // Hide on onboarding page
  const isOnboarding = pathname === '/onboarding';

  // DNA Helix animation speed based on mood
  const helixSpeed = helixMood === 'excited' ? 1.5 : 
                     helixMood === 'happy' ? 2.5 : 
                     helixMood === 'thinking' ? 5 : 
                     helixMood === 'sad' ? 8 : 3.5;

  // Scroll to show new message - aber nur wenn User schon unten war
  useEffect(() => {
    // Nur scrollen wenn die letzte Nachricht vom Assistant ist (neue Antwort)
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === 'user') {
      // Bei User-Nachricht: sanft nach unten scrollen
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    // Bei Assistant-Nachricht: NICHT automatisch scrollen - User soll von oben lesen
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 300);
      setShowPulse(false);
    }
  }, [isOpen]);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([{
        id: 'welcome',
        role: 'assistant',
        content: 'Hey! Ich bin Helix, dein Bio-Coach. Wie kann ich dir helfen?',
      }]);
    }
  }, [isOpen, messages.length]);

  // Hide on onboarding page (after all hooks)
  if (isOnboarding) {
    return null;
  }

  const sendMessage = async () => {
    if (!input.trim() || isLoading || !userId) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          userId,
          conversationHistory: messages.filter(m => m.id !== 'welcome').map(m => ({
            role: m.role,
            content: m.content,
          })),
        }),
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error);
      }

      // Parse quest from response if present
      const parsedQuest = parseQuestFromMessage(data.response);
      
      // Parse supplement suggestion from response if present
      const parsedSupplement = parseSupplementFromMessage(data.response);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        quest: parsedQuest || undefined,
        questActivated: false,
        supplement: parsedSupplement || undefined,
        supplementSubmitted: false,
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `Ups, da ist was schiefgelaufen! 😅 ${error.message || 'Versuch es nochmal.'}`,
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const activateQuest = async (messageId: string, quest: CreateQuestInput) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/quests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, quest }),
      });

      const data = await response.json();

      if (data.success) {
        // Mark quest as activated in the message
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, questActivated: true } : m
        ));

        // Add confirmation message
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `✅ **Quest aktiviert!**\n\n"${quest.title}" wurde zu deinen Quests hinzugefügt. Schau im Quest-Menü auf dem Dashboard nach! 🎯`,
        }]);

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Ups, die Quest konnte nicht aktiviert werden. ${error.message || 'Versuch es nochmal!'} 😅`,
      }]);
    }
  };

  const submitSupplementSuggestion = async (messageId: string, supplement: ParsedSupplementSuggestion) => {
    if (!userId) return;

    try {
      const response = await fetch('/api/supplements/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, supplement }),
      });

      const data = await response.json();

      if (data.success) {
        // Mark supplement as submitted in the message
        setMessages(prev => prev.map(m => 
          m.id === messageId ? { ...m, supplementSubmitted: true } : m
        ));

        // Add confirmation message
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: `**Supplement eingereicht!**\n\n"${supplement.name}" wurde erfolgreich vorgeschlagen.\n\nEs wird geprüft und dann zur Library hinzugefügt. Du bekommst eine Benachrichtigung, sobald es verfügbar ist.`,
        }]);

        // Haptic feedback
        if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
      } else {
        throw new Error(data.error);
      }
    } catch (error: any) {
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'assistant',
        content: `Ups, das Supplement konnte nicht eingereicht werden. ${error.message || 'Versuch es nochmal!'} 😅`,
      }]);
    }
  };

  return (
    <>
      {/* Floating Helix Button - Top Right */}
      <motion.button
        data-tour-id="helix-chat"
        onClick={() => setIsOpen(!isOpen)}
        className="fixed z-50 w-12 h-12 rounded-full cursor-pointer"
        style={{ 
          top: 'calc(env(safe-area-inset-top, 0px) + 12px)',
          right: '16px',
        }}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
      >
        <AnimatePresence mode="wait">
          {isOpen ? (
            <motion.div
              key="close"
              initial={{ rotate: -90, opacity: 0, scale: 0.8 }}
              animate={{ rotate: 0, opacity: 1, scale: 1 }}
              exit={{ rotate: 90, opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
              className="w-full h-full rounded-full bg-white/10 border border-white/20 flex items-center justify-center text-white"
            >
              <X size={24} />
            </motion.div>
          ) : (
            <motion.div
              key="helix"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="relative w-full h-full"
            >
              
              {/* Glass Container with DNA */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-[#0B0B10] to-[#1a1a2e] border border-white/20 overflow-hidden shadow-2xl">
                <svg viewBox="0 0 50 50" className="w-full h-full p-1.5">
                  <defs>
                    <linearGradient id="chatGrad1" x1="0%" y1="0%" x2="100%" y2="100%">
                      <stop offset="0%" stopColor="#D2FF00" />
                      <stop offset="100%" stopColor="#00FFAA" />
                    </linearGradient>
                    <linearGradient id="chatGrad2" x1="100%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#00BFFF" />
                      <stop offset="100%" stopColor="#00FFAA" />
                    </linearGradient>
                  </defs>
                  
                  {/* DNA Strand 1 */}
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const y = 8 + (i * 34 / 5);
                    const phase = i * (Math.PI / 2);
                    return (
                      <motion.circle
                        key={`s1-${i}`}
                        r="2.5"
                        fill="url(#chatGrad1)"
                        cy={y}
                        initial={{ cx: 25 + Math.sin(phase) * 12, opacity: 0.6 }}
                        animate={{
                          cx: [
                            25 + Math.sin(phase) * 12,
                            25 + Math.sin(phase + Math.PI / 2) * 12,
                            25 + Math.sin(phase + Math.PI) * 12,
                            25 + Math.sin(phase + Math.PI * 1.5) * 12,
                            25 + Math.sin(phase + Math.PI * 2) * 12,
                          ],
                          opacity: [
                            Math.cos(phase) > 0 ? 1 : 0.4,
                            Math.cos(phase + Math.PI / 2) > 0 ? 1 : 0.4,
                            Math.cos(phase + Math.PI) > 0 ? 1 : 0.4,
                            Math.cos(phase + Math.PI * 1.5) > 0 ? 1 : 0.4,
                            Math.cos(phase + Math.PI * 2) > 0 ? 1 : 0.4,
                          ],
                        }}
                        transition={{ duration: helixSpeed, repeat: Infinity, ease: "linear" }}
                      />
                    );
                  })}
                  
                  {/* DNA Strand 2 */}
                  {[0, 1, 2, 3, 4, 5].map((i) => {
                    const y = 8 + (i * 34 / 5);
                    const phase = i * (Math.PI / 2) + Math.PI;
                    return (
                      <motion.circle
                        key={`s2-${i}`}
                        r="2.5"
                        fill="url(#chatGrad2)"
                        cy={y}
                        initial={{ cx: 25 + Math.sin(phase) * 12, opacity: 0.6 }}
                        animate={{
                          cx: [
                            25 + Math.sin(phase) * 12,
                            25 + Math.sin(phase + Math.PI / 2) * 12,
                            25 + Math.sin(phase + Math.PI) * 12,
                            25 + Math.sin(phase + Math.PI * 1.5) * 12,
                            25 + Math.sin(phase + Math.PI * 2) * 12,
                          ],
                          opacity: [
                            Math.cos(phase) > 0 ? 1 : 0.4,
                            Math.cos(phase + Math.PI / 2) > 0 ? 1 : 0.4,
                            Math.cos(phase + Math.PI) > 0 ? 1 : 0.4,
                            Math.cos(phase + Math.PI * 1.5) > 0 ? 1 : 0.4,
                            Math.cos(phase + Math.PI * 2) > 0 ? 1 : 0.4,
                          ],
                        }}
                        transition={{ duration: helixSpeed, repeat: Infinity, ease: "linear" }}
                      />
                    );
                  })}
                </svg>
              </div>

            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>

      {/* Backdrop - Klick außerhalb schließt Chat */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="fixed inset-0 z-30 bg-black/20 backdrop-blur-[2px]"
          />
        )}
      </AnimatePresence>

      {/* Chat Window - Opens below button */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: 'spring', stiffness: 400, damping: 30 }}
            className="fixed z-40 glass-panel border border-white/10 rounded-2xl shadow-2xl overflow-hidden flex flex-col"
            style={{
              top: 'calc(env(safe-area-inset-top, 0px) + 70px)',
              right: '16px',
              width: 'calc(100% - 32px)',
              maxWidth: '360px',
              height: '55vh',
              maxHeight: '450px',
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-white/10 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary">
                <Sparkles size={20} />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Helix</h3>
                <p className="text-xs text-muted-foreground">Dein Bio-Coach</p>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    "flex flex-col",
                    message.role === 'user' ? 'items-end' : 'items-start'
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] px-4 py-3 rounded-2xl text-sm leading-relaxed",
                      message.role === 'user'
                        ? 'bg-primary text-primary-foreground rounded-br-md'
                        : 'bg-white/10 text-foreground rounded-bl-md'
                    )}
                  >
                    {message.content.split('\n').map((line, i) => (
                      <span key={i}>
                        {line}
                        {i < message.content.split('\n').length - 1 && <br />}
                      </span>
                    ))}
                  </div>

                  {/* Quest Aktivieren Button */}
                  {message.quest && !message.questActivated && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      onClick={() => activateQuest(message.id, message.quest!)}
                      className="mt-2 flex items-center gap-2 px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 rounded-xl text-purple-400 text-sm font-medium transition-colors"
                    >
                      <Target size={16} />
                      Quest aktivieren
                    </motion.button>
                  )}

                  {/* Quest Aktiviert Badge */}
                  {message.quest && message.questActivated && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-2 flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm font-medium"
                    >
                      <Check size={16} />
                      Quest aktiviert!
                    </motion.div>
                  )}

                  {/* Supplement Einreichen Button */}
                  {message.supplement && !message.supplementSubmitted && (
                    <motion.button
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.3 }}
                      onClick={() => submitSupplementSuggestion(message.id, message.supplement!)}
                      className="mt-2 flex items-center gap-2 px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/30 rounded-xl text-cyan-400 text-sm font-medium transition-colors"
                    >
                      <FlaskConical size={16} />
                      Zur Library hinzufügen
                    </motion.button>
                  )}

                  {/* Supplement Eingereicht Badge */}
                  {message.supplement && message.supplementSubmitted && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="mt-2 flex items-center gap-2 px-4 py-2 bg-green-500/20 border border-green-500/30 rounded-xl text-green-400 text-sm font-medium"
                    >
                      <Check size={16} />
                      Eingereicht!
                    </motion.div>
                  )}
                </motion.div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="flex justify-start"
                >
                  <div className="bg-white/10 px-4 py-3 rounded-2xl rounded-bl-md">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </motion.div>
              )}

              <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-white/10">
              <div className="flex gap-2">
                {/* Camera Button */}
                <motion.button
                  onClick={() => setShowScanModal(true)}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className="w-12 h-12 rounded-xl flex items-center justify-center bg-cyan-500/20 text-cyan-400 hover:bg-cyan-500/30 transition-colors"
                  title="Supplement scannen"
                >
                  <Camera size={20} />
                </motion.button>
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Schreib mir..."
                  disabled={isLoading}
                  className="flex-1 px-4 py-3 bg-white/5 border border-white/10 rounded-xl text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50 focus:ring-1 focus:ring-primary/30 transition-all disabled:opacity-50"
                />
                <motion.button
                  onClick={sendMessage}
                  disabled={!input.trim() || isLoading}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center transition-colors",
                    input.trim() && !isLoading
                      ? "bg-primary text-primary-foreground"
                      : "bg-white/10 text-muted-foreground"
                  )}
                >
                  {isLoading ? (
                    <Loader2 size={20} className="animate-spin" />
                  ) : (
                    <Send size={20} />
                  )}
                </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Scan Modal */}
      <ScanModal
        isOpen={showScanModal}
        onClose={() => setShowScanModal(false)}
        userId={userId || undefined}
        onAddToStack={async (supplementId, dosage) => {
          if (!userId) return;
          try {
            const result = await addToStack(userId, supplementId, dosage);
            if (result.success) {
              const stackName = result.stackName || 'Stack';
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `**Supplement hinzugefügt**\n\nDas Supplement wurde zum **${stackName}** hinzugefügt.`,
              }]);
              if (navigator.vibrate) navigator.vibrate([50, 30, 50]);
            } else {
              setMessages(prev => [...prev, {
                id: Date.now().toString(),
                role: 'assistant',
                content: `Fehler: ${result.error || 'Konnte nicht hinzugefügt werden'}`,
              }]);
            }
          } catch (error) {
            console.error('Error adding from scan:', error);
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              role: 'assistant',
              content: `Fehler beim Hinzufügen. Bitte erneut versuchen.`,
            }]);
          }
        }}
      />
    </>
  );
}

