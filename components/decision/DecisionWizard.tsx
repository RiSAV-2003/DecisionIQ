'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowUp, ArrowRight, AudioWaveform, AlertTriangle, Loader2, Sparkles, Key, Check, ExternalLink, X } from 'lucide-react';
import { api } from '@/services/api';
import { useAuth } from '@/components/auth/AuthProvider';
import { RobotAssistant } from '@/components/ui/RobotAssistant';
import { AnalysisProgress } from '@/components/decision/AnalysisProgress';
import type { ClarifyingQuestion, DecisionDetail } from '@/lib/api-types';
import { cn } from '@/lib/utils';

const SAMPLE_QUESTIONS = [
  'Which laptop should I buy under ₹70,000 for coding and AI?',
  'Should I pursue a Master\u2019s in Germany or stay in India?',
  'Which job offer should I accept?',
  'Which city is better to live in: Pune or Bangalore?',
  'Where should I invest ₹5,00,000?',
];

export function DecisionWizard({ initialQuery = '' }: { initialQuery?: string }) {
  const router = useRouter();
  const { user } = useAuth();
  const [query, setQuery] = useState(initialQuery);
  const [step, setStep] = useState<'input' | 'questions' | 'progress'>('input');
  const [decision, setDecision] = useState<DecisionDetail | null>(null);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [keyModalOpen, setKeyModalOpen] = useState(false);
  const [inputKey, setInputKey] = useState('');
  const [savingKey, setSavingKey] = useState(false);
  const [keyToast, setKeyToast] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      api.getPreferences().then((p) => {
        if (p.extra?.gemini_api_key) {
          setHasGeminiKey(true);
          setInputKey(String(p.extra.gemini_api_key));
        }
      }).catch(() => undefined);
    }
  }, [user]);

  const handleSaveKey = async () => {
    if (!inputKey.trim()) return;
    setSavingKey(true);
    try {
      const p = await api.getPreferences();
      await api.updatePreferences({
        ...p,
        extra: {
          ...(p.extra || {}),
          gemini_api_key: inputKey.trim(),
        },
      });
      setHasGeminiKey(true);
      setKeyToast('Google Gemini AI key connected successfully!');
      setTimeout(() => {
        setKeyModalOpen(false);
        setKeyToast(null);
      }, 1400);
    } catch {
      setKeyToast('Failed to save API key. Please check your network.');
    } finally {
      setSavingKey(false);
    }
  };

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  const startPolling = useCallback(
    (id: string) => {
      if (pollRef.current) clearInterval(pollRef.current);
      pollRef.current = setInterval(async () => {
        try {
          const d = await api.getDecision(id);
          setDecision(d);
          if (d.status === 'completed') {
            if (pollRef.current) clearInterval(pollRef.current);
            setTimeout(() => router.push(`/decision/${d.id}`), 900);
          } else if (d.status === 'failed') {
            if (pollRef.current) clearInterval(pollRef.current);
            setError(d.error || 'Analysis failed. Please try again.');
            setStep('input');
          }
        } catch {
          // transient — keep polling
        }
      }, 1200);
    },
    [router],
  );

  const submitQuery = async (q: string) => {
    const prompt = q.trim();
    if (!prompt || submitting) return;
    if (!user) {
      router.push(`/login?next=${encodeURIComponent(`/decision/new?q=${encodeURIComponent(prompt)}`)}`);
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const d = await api.createDecision({ raw_prompt: prompt });
      setDecision(d);
      if (d.clarifying_questions.some((cq) => cq.required)) {
        setStep('questions');
      } else if (d.status === 'analyzing') {
        setStep('progress');
        startPolling(d.id);
      } else {
        setStep('progress');
        startPolling(d.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setSubmitting(false);
    }
  };

  const submitAnswers = async () => {
    if (!decision || submitting) return;
    const required = decision.clarifying_questions.filter((q) => q.required);
    if (required.some((q) => !(answers[q.key] || '').trim())) {
      setError('Please answer the required questions so I can analyze accurately.');
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const d = await api.submitAnswers(decision.id, answers);
      setDecision(d);
      if (d.clarifying_questions.some((cq) => cq.required)) {
        setStep('questions');
      } else if (d.status === 'analyzing' || d.status === 'completed') {
        setStep('progress');
        startPolling(d.id);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not submit your answers.');
    } finally {
      setSubmitting(false);
    }
  };

  const questions = decision?.clarifying_questions ?? [];

  return (
    <div className="w-full flex flex-col items-center">
      <AnimatePresence mode="wait">
        {step === 'input' && (
          <motion.div
            key="input"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-3xl"
          >
            <div className="flex justify-center mb-8">
              <RobotAssistant size="lg" pose="floating" />
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                submitQuery(query);
              }}
              className="relative"
            >
              <div className="glass-panel p-2 pl-5 rounded-full border border-cyan-500/30 flex items-center gap-3 shadow-glow-cyan/30 bg-slate-900/80 backdrop-blur-xl focus-within:border-cyan-400/70 focus-within:shadow-[0_0_30px_-6px_rgba(34,211,238,0.5)] transition-all">
                <AudioWaveform className="w-5 h-5 text-cyan-400 animate-pulse shrink-0" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="What are you trying to decide?"
                  className="bg-transparent flex-1 text-sm text-white placeholder-slate-400 focus:outline-none py-2"
                  aria-label="What are you trying to decide?"
                />
                <button
                  type="submit"
                  disabled={submitting || !query.trim()}
                  aria-label="Analyze decision"
                  className="w-11 h-11 shrink-0 rounded-full bg-gradient-to-r from-cyan-400 to-blue-600 text-slate-950 flex items-center justify-center hover:scale-105 transition-transform shadow-glow-cyan/50 disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowUp className="w-5 h-5 stroke-[2.5]" />}
                </button>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-2 mt-4">
              {SAMPLE_QUESTIONS.map((q) => (
                <button key={q} onClick={() => submitQuery(q)} className="chip">
                  {q}
                </button>
              ))}
            </div>

            {/* AI Status Indicator */}
            <div className="flex items-center justify-center gap-2.5 mt-4 text-[11px]">
              <span className={cn(
                "inline-flex items-center gap-1.5 px-3 py-1 rounded-full border transition-all",
                hasGeminiKey
                  ? "bg-emerald-500/10 text-emerald-300 border-emerald-500/30"
                  : "bg-cyan-500/10 text-cyan-300 border-cyan-500/20"
              )}>
                <Sparkles className={cn("w-3.5 h-3.5", hasGeminiKey ? "text-emerald-400 animate-pulse" : "text-cyan-400")} />
                {hasGeminiKey ? "Google Gemini AI Active" : "Keyless Dynamic Research Mode"}
              </span>
              <button
                type="button"
                onClick={() => {
                  if (!user) {
                    router.push('/login?next=/');
                  } else {
                    setKeyModalOpen(true);
                  }
                }}
                className="text-slate-400 hover:text-cyan-300 underline transition-colors"
              >
                {hasGeminiKey ? "Change AI Key" : "Connect Free Gemini Key"}
              </button>
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3 max-w-xl mx-auto">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </motion.div>
        )}

        {step === 'questions' && decision && (
          <motion.div
            key="questions"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -16 }}
            className="w-full max-w-2xl"
          >
            <div className="flex items-center gap-4 mb-6">
              <RobotAssistant size="sm" pose="widget" className="shrink-0" />
              <div>
                <h2 className="section-title text-2xl text-white">
                  A few quick questions
                </h2>
                <p className="text-sm text-slate-400 mt-1">
                  I only ask what materially changes the analysis of: &ldquo;{decision.raw_prompt}&rdquo;
                </p>
              </div>
            </div>

            <div className="space-y-5">
              {questions.map((q) => (
                <QuestionField
                  key={q.key}
                  question={q}
                  value={answers[q.key] ?? ''}
                  onChange={(v) => setAnswers((prev) => ({ ...prev, [q.key]: v }))}
                />
              ))}
            </div>

            {error && (
              <div className="mt-4 flex items-start gap-2 text-xs text-rose-300 bg-rose-500/10 border border-rose-500/30 rounded-xl px-4 py-3">
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <button
              onClick={submitAnswers}
              disabled={submitting}
              className="btn btn-primary mt-6 w-full py-3.5 text-sm"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <>Start the analysis <ArrowRight className="w-4 h-4" /></>}
            </button>
            <p className="text-[11px] text-slate-500 text-center mt-3">
              Optional questions can be skipped — I&rsquo;ll use sensible defaults.
            </p>
          </motion.div>
        )}

        {step === 'progress' && decision && (
          <motion.div
            key="progress"
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-2xl flex flex-col items-center"
          >
            <div className="mb-6 text-center">
              <p className="eyebrow mb-2">DECISION IN PROGRESS</p>
              <h2 className="section-title text-2xl text-white leading-snug">
                &ldquo;{decision.raw_prompt}&rdquo;
              </h2>
            </div>
            <AnalysisProgress stages={decision.stages} />
            <p className="handwritten-script text-sm mt-6 text-slate-400">
              Researching real sources. Verifying evidence. Building your clarity.
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Gemini API Key Connect Modal */}
      <AnimatePresence>
        {keyModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-card max-w-md w-full p-6 border-cyan-500/30 shadow-2xl relative"
            >
              <button
                onClick={() => setKeyModalOpen(false)}
                className="absolute top-4 right-4 text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-center gap-2.5 mb-2">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center text-slate-950">
                  <Key className="w-4 h-4" />
                </div>
                <h3 className="section-title text-lg text-white">Connect Google Gemini AI</h3>
              </div>

              <p className="text-xs text-slate-300 mb-4 leading-relaxed">
                Connect your free Google AI Studio key to unlock dynamic reasoning, custom criteria generation, and conversational trade-off synthesis.
              </p>

              {keyToast && (
                <div className="mb-4 text-xs text-cyan-200 bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-3 py-2 flex items-center gap-2">
                  <Check className="w-3.5 h-3.5 text-cyan-400" /> {keyToast}
                </div>
              )}

              <div className="space-y-3 mb-5">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Google Gemini API Key</span>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 font-medium"
                  >
                    Get Free Key <ExternalLink className="w-3 h-3" />
                  </a>
                </div>

                <input
                  type="password"
                  value={inputKey}
                  onChange={(e) => setInputKey(e.target.value)}
                  placeholder="AIzaSy..."
                  className="glass-input text-xs font-mono"
                />

                <p className="text-[10px] text-slate-500">
                  Google provides free API keys with 1,500 free requests per day. Your key is stored securely in your private preferences.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setKeyModalOpen(false)}
                  className="btn btn-secondary px-4 py-2 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={savingKey || !inputKey.trim()}
                  onClick={handleSaveKey}
                  className="btn btn-primary px-5 py-2 text-xs flex items-center gap-1.5 disabled:opacity-50"
                >
                  {savingKey ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  Save & Connect
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

function QuestionField({
  question,
  value,
  onChange,
}: {
  question: ClarifyingQuestion;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="glass-card p-5">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-semibold text-slate-100">
          {question.label}
          {question.required ? (
            <span className="text-cyan-400 ml-1">*</span>
          ) : (
            <span className="text-[10px] text-slate-500 ml-2 font-normal">optional</span>
          )}
        </label>
      </div>
      {question.help && <p className="text-[11px] text-slate-500 mb-3">{question.help}</p>}

      {question.type === 'chips' ? (
        <div className="flex flex-wrap gap-2">
          {question.options.map((opt) => (
            <button
              key={opt}
              type="button"
              onClick={() => onChange(value === opt ? '' : opt)}
              className={cn('chip', value === opt && 'chip-active')}
            >
              {opt}
            </button>
          ))}
        </div>
      ) : (
        <input
          type={question.type === 'number' ? 'number' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={question.placeholder || ''}
          className="glass-input"
          aria-label={question.label}
        />
      )}
    </div>
  );
}