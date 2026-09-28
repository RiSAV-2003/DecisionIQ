'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { 
  LayoutGrid, 
  Compass, 
  PlusCircle, 
  FolderKanban, 
  Bookmark, 
  BarChart3, 
  Layers, 
  Users, 
  Settings,
  Crown,
  ArrowRight
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { cn } from '@/lib/utils';

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const menuItems = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutGrid },
    { name: 'Explore', href: '/explore', icon: Compass },
    { name: 'New Decision', href: '/decision/new', icon: PlusCircle },
    { name: 'My Decisions', href: '/history', icon: FolderKanban },
    { name: 'Saved', href: '/saved', icon: Bookmark },
    { name: 'Insights', href: '/insights', icon: BarChart3 },
    { name: 'Use Cases', href: '/use-cases', icon: Layers },
    { name: 'Community', href: '/community', icon: Users },
    { name: 'Settings', href: '/settings', icon: Settings },
  ];

  return (
    <aside className="w-64 shrink-0 hidden lg:block glass-sidebar min-h-[calc(100vh-80px)] p-4 flex flex-col justify-between">
      {/* Navigation Menu */}
      <div className="space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'relative flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all group',
                isActive
                  ? 'text-cyan-300 font-semibold bg-cyan-500/15 border border-cyan-500/30 shadow-glow-cyan/20'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/40'
              )}
            >
              <Icon className={cn('w-5 h-5 transition-transform group-hover:scale-110', isActive ? 'text-cyan-400' : 'text-slate-400')} />
              <span>{item.name}</span>

              {isActive && (
                <motion.div
                  layoutId="sidebarActiveIndicator"
                  className="absolute right-2 w-1.5 h-6 bg-cyan-400 rounded-full"
                  transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                />
              )}
            </Link>
          );
        })}
      </div>

      {/* Bottom Pro Upgrade Card matching Reference */}
      <div className="mt-8 space-y-4">
        <div className="glass-panel p-4 rounded-2xl border border-amber-500/30 bg-gradient-to-b from-amber-500/10 to-transparent relative overflow-hidden">
          <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center mb-3">
            <Crown className="w-5 h-5 text-amber-400" />
          </div>
          <h4 className="text-sm font-heading font-bold text-white mb-1">
            Upgrade to Pro
          </h4>
          <p className="text-xs text-slate-400 mb-4 leading-relaxed">
            Get deeper insights, more research, and advanced tools.
          </p>
          <Button variant="primary" size="sm" className="w-full bg-gradient-to-r from-purple-600 to-cyan-500 text-white" rightIcon={<ArrowRight className="w-3.5 h-3.5" />}>
            Upgrade Now
          </Button>
        </div>

        {/* Handwritten Annotation matching Reference */}
        <div className="text-center px-2">
          <p className="handwritten-script text-xs">
            "Better Decisions A Brighter You."
          </p>
        </div>
      </div>
    </aside>
  );
};
