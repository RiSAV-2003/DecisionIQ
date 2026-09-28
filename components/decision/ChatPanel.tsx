'use client';

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Sparkles, AlertTriangle, MessageSquare } from 'lucide-react';
import type { DecisionDetail, Message } from '@/lib/api-types';
import { api } from '@/services/api';
import { RobotAssistant } from '@/components/ui/RobotAssistant';

const QUICK_PROMPTS = [
  'Why did you recommend this option?',
  'Compare the top two options only',
  'What is the biggest trade-off/risk?',
  'What if my budget is tighter?',
  'Show all evaluated options',
];

export function ChatPanel({
  decision,
  onDecisionUpdate,
}: {
  decision: DecisionDetail;
  onDecisionUpdate: (next: DecisionDetail) => void;
}) {
  const [messages, setMessages] = useState<Message[]>(decision.messages || []);
  const [input, setInput] = useState('');
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages(decision.messages || []);
  }, [decision.id, decision.messages]);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, sending]);

  const send = async (text: string) => {
    const message = text.trim();
    if (!message || sending) return;
    setInput('');
    setSending(true);
    setError(null);
    setMessages((prev) => [
      ...prev,
      { id: `tmp-${Date.now()}`, role: 'user', content: message, changed_recommendation: false, created_at: new Date().toISOString() },
    ]);
    try {
      const res = await api.followUp(decision.id, message);
      setMessages(res.decision.messages || []);
      onDecisionUpdate(res.decision);
      if (res.changed_recommendation) {
        setError('The recommendation changed after your follow-up — rankings have been updated above.');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Follow-up failed — try again.');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="glass-card flex flex-col h-[580px] overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-cyan-500/15 bg-slate-900/40">
        <div className="flex items-center gap-3">
          <RobotAssistant size="sm" pose="widget" className="scale-75 -my-2" />
          <div>
            <h3 className="text-sm font-heading font-bold text-white flex items-center gap-2">
              DecisionIQ Assistant <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            </h3>
            <p className="text-[11px] text-slate-400">Context-aware conversational analysis · Real-time re-scoring</p>
          </div>
        </div>
        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold font-mono bg-cyan-500/10 text-cyan-300 border border-cyan-500/20">
          Interactive
        </span>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
        {messages.length === 0 && (
          <div className="text-center py-6 space-y-3">
            <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 mx-auto flex items-center justify-center">
              <MessageSquare className="w-5 h-5" />
            </div>
            <p className="text-xs text-slate-300 font-medium">Ask any question or test alternative constraints:</p>
            <div className="flex flex-wrap justify-center gap-2 max-w-md mx-auto">
              {QUICK_PROMPTS.map((q) => (
                <button
                  key={q}
                  onClick={() => send(q)}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-slate-900/80 border border-slate-700/70 text-slate-300 hover:text-cyan-200 hover:border-cyan-500/40 hover:bg-slate-800 transition-all"
                >
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        <AnimatePresence initial={false}>
          {messages.map((m) => (
            <motion.div
              key={m.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[85%] px-4 py-3 rounded-2xl text-xs sm:text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === 'user'
                    ? 'bg-gradient-to-r from-purple-600/70 to-blue-600/60 text-white border border-purple-400/30 rounded-br-sm shadow-md'
                    : 'bg-slate-900/80 border border-cyan-500/25 text-slate-200 rounded-bl-sm shadow-md'
                }`}
              >
                {m.content}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {sending && (
          <div className="flex items-center gap-2 text-xs text-slate-400 p-2">
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:150ms]" />
            <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse [animation-delay:300ms]" />
            <span className="ml-1 text-cyan-300">DecisionIQ is analyzing your scenario…</span>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 text-xs text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-xl px-3 py-2.5">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Quick Prompts Bar (when messages exist) */}
      {messages.length > 0 && (
        <div className="px-5 py-2 bg-slate-950/60 border-t border-slate-800/80 flex items-center gap-2 overflow-x-auto">
          <span className="text-[10px] text-slate-500 shrink-0">Quick prompts:</span>
          {QUICK_PROMPTS.slice(0, 3).map((q) => (
            <button
              key={q}
              onClick={() => send(q)}
              disabled={sending}
              className="text-[11px] text-slate-400 hover:text-cyan-300 bg-slate-900/60 border border-slate-800 rounded-lg px-2.5 py-1 whitespace-nowrap transition-colors"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="p-4 border-t border-cyan-500/15 bg-slate-900/40">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            send(input);
          }}
          className="flex items-center gap-2 glass-input !rounded-full pr-1.5"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about trade-offs, test lower budget, or re-weight..."
            className="flex-1 bg-transparent text-xs sm:text-sm text-white placeholder-slate-400 focus:outline-none px-3 py-2"
            aria-label="Ask DecisionIQ"
          />
          <button
            type="submit"
            disabled={sending || !input.trim()}
            aria-label="Send"
            className="w-9 h-9 shrink-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center hover:scale-105 transition-transform disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_0_12px_rgba(34,211,238,0.4)]"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}