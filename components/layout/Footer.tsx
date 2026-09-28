'use client';

import React from 'react';
import Link from 'next/link';
import { Brain, Github, Twitter, Linkedin, Youtube } from 'lucide-react';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      { label: 'Explore', href: '/explore' },
      { label: 'How It Works', href: '/how-it-works' },
      { label: 'Use Cases', href: '/use-cases' },
      { label: 'Pricing', href: '/pricing' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Our Mission', href: '/about' },
      { label: 'Community', href: '/community' },
      { label: 'Contact', href: '/about' },
    ],
  },
  {
    title: 'Resources',
    links: [
      { label: 'Decision Library', href: '/explore' },
      { label: 'Insights', href: '/insights' },
      { label: 'Get Started', href: '/get-started' },
      { label: 'Login', href: '/login' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="relative border-t border-cyan-500/15 bg-slate-950/60 backdrop-blur-xl">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-cyan-400/40 to-transparent" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          <div className="col-span-2 space-y-4">
            <Link href="/" className="flex items-center gap-3 group">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-0.5 shadow-glow-cyan/40 group-hover:scale-105 transition-transform">
                <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
                  <Brain className="w-6 h-6 text-cyan-400" />
                </div>
              </div>
              <div className="flex flex-col">
                <span className="text-lg font-heading font-extrabold text-white">
                  Decision<span className="text-cyan-400">IQ</span>
                </span>
                <span className="text-[10px] text-slate-400 tracking-wide">Research less. Decide better.</span>
              </div>
            </Link>
            <p className="text-xs text-slate-400 max-w-xs leading-relaxed">
              An AI decision intelligence platform that researches, verifies, compares and explains
              your options — for any decision in life.
            </p>
            <div className="flex items-center gap-2">
              {[
                { icon: Twitter, label: 'Twitter' },
                { icon: Github, label: 'GitHub' },
                { icon: Linkedin, label: 'LinkedIn' },
                { icon: Youtube, label: 'YouTube' },
              ].map(({ icon: Icon, label }) => (
                <button
                  key={label}
                  aria-label={label}
                  className="p-2 rounded-lg text-slate-400 hover:text-cyan-400 hover:bg-cyan-500/10 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </button>
              ))}
            </div>
          </div>

          {COLUMNS.map((col) => (
            <div key={col.title}>
              <h4 className="text-xs font-semibold tracking-widest uppercase text-slate-300 mb-4">{col.title}</h4>
              <ul className="space-y-2.5">
                {col.links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="text-xs text-slate-400 hover:text-cyan-300 transition-colors">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-slate-800/60 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-[11px] text-slate-500">
            © {new Date().getFullYear()} DecisionIQ. Research less. Decide better.
          </p>
          <p className="handwritten-script text-xs text-slate-400">
            &ldquo;Good decisions build a better you.&rdquo;
          </p>
        </div>
      </div>
    </footer>
  );
}