'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2, Save, LogOut, Crown, Check, AlertTriangle, Sparkles, ExternalLink, Key } from 'lucide-react';
import { AppShell } from '@/components/layout/AppShell';
import { Sidebar } from '@/components/layout/Sidebar';
import { ProtectedRoute } from '@/components/auth/ProtectedRoute';
import { useAuth } from '@/components/auth/AuthProvider';
import { api } from '@/services/api';
import type { Preferences, SubscriptionInfo } from '@/lib/api-types';
import { cn } from '@/lib/utils';

const INTERESTS = ['education', 'career', 'finance', 'lifestyle', 'business', 'technology', 'products', 'travel'];
const PRIORITIES = ['budget', 'performance', 'reliability', 'growth', 'learning', 'risk_tolerance', 'location', 'time'];
const PRIORITY_LABELS: Record<string, string> = {
  budget: 'Budget', performance: 'Performance', reliability: 'Reliability', growth: 'Growth',
  learning: 'Learning', risk_tolerance: 'Risk tolerance', location: 'Location', time: 'Time',
};

export default function SettingsPage() {
  return (
    <ProtectedRoute>
      <SettingsContent />
    </ProtectedRoute>
  );
}

function SettingsContent() {
  const { user, refreshUser, logout } = useAuth();
  const router = useRouter();
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [prefs, setPrefs] = useState<Preferences | null>(null);
  const [geminiApiKey, setGeminiApiKey] = useState('');
  const [aiModel, setAiModel] = useState('gemini-1.5-flash');
  const [subscription, setSubscription] = useState<SubscriptionInfo | null>(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrefs, setSavingPrefs] = useState(false);
  const [savingAi, setSavingAi] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [upgrading, setUpgrading] = useState(false);

  useEffect(() => {
    api
      .getPreferences()
      .then((p) => {
        setPrefs(p);
        if (p.extra?.gemini_api_key) setGeminiApiKey(String(p.extra.gemini_api_key));
        if (p.extra?.ai_model) setAiModel(String(p.extra.ai_model));
      })
      .catch(() => undefined);
    api
      .getSubscription()
      .then(setSubscription)
      .catch(() => undefined);
  }, []);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  const saveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    try {
      await api.updateMe({ full_name: fullName });
      await refreshUser();
      setToast('Profile updated ✓');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not update profile.');
    } finally {
      setSavingProfile(false);
    }
  };

  const toggle = (list: string[], value: string) =>
    list.includes(value) ? list.filter((v) => v !== value) : [...list, value];

  const savePrefs = async () => {
    if (!prefs) return;
    setSavingPrefs(true);
    try {
      const updated = await api.updatePreferences(prefs);
      setPrefs(updated);
      setToast('Preferences saved ✓ — future analyses are now tuned to you.');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Could not save preferences.');
    } finally {
      setSavingPrefs(false);
    }
  };

  const upgrade = async () => {
    setUpgrading(true);
    try {
      await api.upgradePlan('pro');
      const sub = await api.getSubscription();
      setSubscription(sub);
      await refreshUser();
      setToast('You\u2019re on Pro now — deeper research unlocked (checkout staged in this demo).');
    } catch (err) {
      setToast(err instanceof Error ? err.message : 'Upgrade failed.');
    } finally {
      setUpgrading(false);
    }
  };

  const plan = subscription?.plan || user?.plan || 'free';

  return (
    <AppShell wide>
      <div className="grid lg:grid-cols-[240px_1fr] gap-6">
        <Sidebar />

        <div className="min-w-0 space-y-6 max-w-3xl">
          <section>
            <p className="eyebrow mb-2">SETTINGS</p>
            <h1 className="section-title text-2xl sm:text-3xl text-white">Account & Preferences</h1>
            <p className="text-sm text-slate-400 mt-1">Your profile, personalization and plan.</p>
          </section>

          {toast && (
            <div className="text-xs text-cyan-200 bg-cyan-500/10 border border-cyan-500/30 rounded-xl px-4 py-3 flex items-center gap-2">
              <Check className="w-4 h-4 text-cyan-400" /> {toast}
            </div>
          )}

          {/* Profile */}
          <section className="glass-card p-6">
            <h2 className="section-title text-lg text-white mb-5">Profile</h2>
            <form onSubmit={saveProfile} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Full name</label>
                <input value={fullName} onChange={(e) => setFullName(e.target.value)} className="glass-input" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Email</label>
                <input value={user?.email || ''} disabled className="glass-input opacity-60" />
              </div>
              <button type="submit" disabled={savingProfile} className="btn btn-primary px-6 py-2.5 text-xs disabled:opacity-60">
                {savingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Profile
              </button>
            </form>
          </section>

          {/* AI & Real-World Data Provider (Google Gemini) */}
          <section className="glass-card p-6 border-cyan-500/25">
            <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
              <div>
                <h2 className="section-title text-lg text-white flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-cyan-400" /> AI & Real-World Data Provider
                </h2>
                <p className="text-xs text-slate-400 mt-1">
                  Local mock data is completely deleted. Decisions are researched live with real facts and AI reasoning.
                </p>
              </div>
              <span
                className={cn(
                  'px-3 py-1 rounded-full text-[11px] font-semibold flex items-center gap-1.5 border',
                  geminiApiKey.trim()
                    ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                    : 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30'
                )}
              >
                <span
                  className={cn(
                    'w-2 h-2 rounded-full',
                    geminiApiKey.trim() ? 'bg-emerald-400 animate-pulse' : 'bg-cyan-400'
                  )}
                />
                {geminiApiKey.trim() ? 'Google Gemini AI Active' : 'Keyless Live Search Active'}
              </span>
            </div>

            <div className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-semibold text-slate-300">Google Gemini API Key (Free Tier)</label>
                  <a
                    href="https://aistudio.google.com/app/apikey"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-cyan-400 hover:text-cyan-300 inline-flex items-center gap-1 text-[11px]"
                  >
                    Get free key at Google AI Studio <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                <div className="relative">
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    placeholder="AIzaSy... (leave blank to run in keyless live research mode)"
                    value={geminiApiKey}
                    onChange={(e) => setGeminiApiKey(e.target.value)}
                    className="glass-input pl-9"
                  />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Google provides free API keys with 15 requests/min and 1,500 requests/day at no cost.
                </p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">Model</label>
                <select
                  value={aiModel}
                  onChange={(e) => setAiModel(e.target.value)}
                  className="glass-input bg-slate-900/95 text-white"
                >
                  <option value="gemini-1.5-flash">Gemini 1.5 Flash (Fast, Highly Accurate & Free)</option>
                  <option value="gemini-2.0-flash">Gemini 2.0 Flash (Next-Gen Multimodal & Free)</option>
                  <option value="gemini-1.5-pro">Gemini 1.5 Pro (Deep Multimodal Reasoning)</option>
                </select>
              </div>

              <button
                type="button"
                onClick={async () => {
                  if (!prefs) return;
                  setSavingAi(true);
                  try {
                    const updatedExtra = {
                      ...(prefs.extra || {}),
                      gemini_api_key: geminiApiKey.trim(),
                      ai_model: aiModel,
                    };
                    const updated = await api.updatePreferences({
                      ...prefs,
                      extra: updatedExtra,
                    });
                    setPrefs(updated);
                    setToast('AI & Real Data settings saved ✓');
                  } catch (err) {
                    setToast(err instanceof Error ? err.message : 'Could not save AI settings.');
                  } finally {
                    setSavingAi(false);
                  }
                }}
                disabled={savingAi}
                className="btn btn-primary px-6 py-2.5 text-xs disabled:opacity-60 flex items-center gap-2"
              >
                {savingAi ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                Save AI Settings
              </button>
            </div>
          </section>

          {/* Preferences */}
          {prefs && (
            <section className="glass-card p-6">
              <h2 className="section-title text-lg text-white mb-5">Decision Preferences</h2>
              <div className="space-y-6">
                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-3">Decision interests</p>
                  <div className="flex flex-wrap gap-2">
                    {INTERESTS.map((k) => (
                      <button
                        key={k}
                        onClick={() => setPrefs({ ...prefs, decision_interests: toggle(prefs.decision_interests, k) })}
                        className={cn('chip !py-2 capitalize', prefs.decision_interests.includes(k) && 'chip-active')}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-3">Priorities</p>
                  <div className="flex flex-wrap gap-2">
                    {PRIORITIES.map((p) => (
                      <button
                        key={p}
                        onClick={() => setPrefs({ ...prefs, priorities: toggle(prefs.priorities, p) })}
                        className={cn('chip !py-2', prefs.priorities.includes(p) && 'chip-active')}
                      >
                        {PRIORITY_LABELS[p]}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-3">
                    Budget sensitivity: <span className="text-cyan-300">{['Very price-conscious', 'Price-conscious', 'Balanced', 'Quality-first', 'Quality over cost'][prefs.budget_sensitivity - 1]}</span>
                  </p>
                  <input
                    type="range"
                    min={1}
                    max={5}
                    value={prefs.budget_sensitivity}
                    onChange={(e) => setPrefs({ ...prefs, budget_sensitivity: Number(e.target.value) })}
                    className="w-full accent-cyan-400"
                  />
                </div>

                <div>
                  <p className="text-xs font-semibold text-slate-300 mb-3">Research depth</p>
                  <div className="grid grid-cols-3 gap-2">
                    {['quick', 'standard', 'deep'].map((k) => (
                      <button
                        key={k}
                        onClick={() => setPrefs({ ...prefs, research_depth: k })}
                        className={cn('rounded-xl border p-3 text-center text-sm font-bold capitalize transition-all', prefs.research_depth === k ? 'border-cyan-400/60 bg-cyan-500/10 text-cyan-300' : 'border-slate-700 bg-slate-900/40 text-slate-400')}
                      >
                        {k}
                      </button>
                    ))}
                  </div>
                </div>

                <button onClick={savePrefs} disabled={savingPrefs} className="btn btn-primary px-6 py-2.5 text-xs disabled:opacity-60">
                  {savingPrefs ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />} Save Preferences
                </button>
              </div>
            </section>
          )}

          {/* Subscription */}
          <section className="glass-card p-6 border-purple-500/25">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="section-title text-lg text-white flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-400" /> Your Plan
                </h2>
                <p className="text-sm text-slate-400 mt-1 capitalize">
                  Currently on <span className="text-white font-semibold">{plan}</span>
                  {subscription && ` · ${subscription.limits.monthly_decisions} decisions/mo`}
                </p>
              </div>
              {plan === 'free' && (
                <button onClick={upgrade} disabled={upgrading} className="btn btn-primary px-6 py-2.5 text-xs disabled:opacity-60">
                  {upgrading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Crown className="w-3.5 h-3.5" />} Upgrade to Pro
                </button>
              )}
            </div>
            {plan === 'free' && (
              <p className="text-[11px] text-slate-500 mt-4">
                Pro unlocks deeper research (more queries, more sources per query) and advanced insights.
              </p>
            )}
          </section>

          {/* Danger zone */}
          <section className="glass-card p-6 border-rose-500/20">
            <h2 className="section-title text-lg text-rose-300 flex items-center gap-2 mb-4">
              <AlertTriangle className="w-4 h-4" /> Session
            </h2>
            <button
              onClick={() => {
                logout();
                router.push('/');
              }}
              className="btn px-6 py-2.5 text-xs !bg-rose-600/20 !text-rose-300 border border-rose-500/40 hover:!bg-rose-600/40"
            >
              <LogOut className="w-3.5 h-3.5" /> Sign out
            </button>
          </section>
        </div>
      </div>
    </AppShell>
  );
}