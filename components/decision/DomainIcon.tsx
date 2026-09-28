'use client';

import React from 'react';
import {
  GraduationCap,
  Briefcase,
  TrendingUp,
  Compass,
  Heart,
  Rocket,
  Cpu,
  ShoppingBag,
  Sparkles,
  type LucideIcon,
} from 'lucide-react';

export const DOMAIN_META: Record<string, { icon: LucideIcon; label: string; gradient: string }> = {
  education: { icon: GraduationCap, label: 'Education', gradient: 'from-purple-500 to-violet-600' },
  career: { icon: Briefcase, label: 'Career', gradient: 'from-blue-500 to-indigo-600' },
  finance: { icon: TrendingUp, label: 'Finance', gradient: 'from-emerald-400 to-teal-600' },
  travel: { icon: Compass, label: 'Travel', gradient: 'from-pink-500 to-rose-600' },
  lifestyle: { icon: Heart, label: 'Lifestyle', gradient: 'from-cyan-400 to-sky-600' },
  business: { icon: Rocket, label: 'Business', gradient: 'from-amber-500 to-orange-600' },
  technology: { icon: Cpu, label: 'Technology', gradient: 'from-fuchsia-500 to-purple-600' },
  products: { icon: ShoppingBag, label: 'Products', gradient: 'from-cyan-500 to-blue-600' },
  other: { icon: Sparkles, label: 'Decision', gradient: 'from-indigo-500 to-purple-600' },
};

export function DomainIcon({ domain, className = 'w-5 h-5' }: { domain: string; className?: string }) {
  const meta = DOMAIN_META[domain] || DOMAIN_META.other;
  const Icon = meta.icon;
  return <Icon className={className} />;
}

export function DomainBadge({ domain, className = '' }: { domain: string; className?: string }) {
  const meta = DOMAIN_META[domain] || DOMAIN_META.other;
  const Icon = meta.icon;
  return (
    <span
      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider border bg-gradient-to-r ${meta.gradient} border-white/10 text-white shadow-glow-cyan/20 ${className}`}
    >
      <Icon className="w-3.5 h-3.5" />
      {meta.label}
    </span>
  );
}