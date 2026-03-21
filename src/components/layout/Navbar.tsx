'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavItem {
  href: string;
  label: string;
  icon: string;
}

const mainNavItems: NavItem[] = [
  { href: '/', label: 'ראשי', icon: '🏠' },
  { href: '/schedule', label: 'לוח', icon: '📅' },
  { href: '/add', label: 'הוספה', icon: '➕' },
  { href: '/health', label: 'שינה', icon: '😴' },
];

const moreMenuItems: NavItem[] = [
  { href: '/summary', label: 'סיכום שבועי', icon: '📊' },
  { href: '/insights', label: 'תובנות', icon: '🧠' },
  { href: '/settings', label: 'הגדרות', icon: '⚙️' },
];

export default function Navbar() {
  const pathname = usePathname();
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const moreRef = useRef<HTMLDivElement>(null);

  // Close the "More" menu when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (moreRef.current && !moreRef.current.contains(event.target as Node)) {
        setIsMoreOpen(false);
      }
    }

    if (isMoreOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMoreOpen]);

  // Close the "More" menu on route change
  useEffect(() => {
    setIsMoreOpen(false);
  }, [pathname]);

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  const isMoreActive = moreMenuItems.some((item) => isActive(item.href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 shadow-[0_-2px_10px_rgba(0,0,0,0.06)]">
      <div className="flex items-end justify-around px-2 pt-1 pb-[env(safe-area-inset-bottom,8px)] max-w-lg mx-auto">
        {mainNavItems.map((item) => {
          const active = isActive(item.href);
          const isAddButton = item.href === '/add';

          if (isAddButton) {
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex flex-col items-center justify-center -mt-5 group"
              >
                <span
                  className="flex items-center justify-center w-14 h-14 rounded-full text-2xl text-white shadow-lg transition-transform duration-200 group-hover:scale-105 group-active:scale-95"
                  style={{
                    background: 'linear-gradient(135deg, #22c55e, #16a34a)',
                    boxShadow: '0 4px 14px rgba(34, 197, 94, 0.4)',
                  }}
                >
                  {item.icon}
                </span>
                <span className="text-[10px] mt-1 font-medium text-green-600">
                  {item.label}
                </span>
              </Link>
            );
          }

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-colors duration-200 ${
                active
                  ? 'text-green-600'
                  : 'text-gray-400 hover:text-gray-600'
              }`}
            >
              <span className={`text-xl transition-transform duration-200 ${active ? 'scale-110' : ''}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] mt-0.5 font-medium ${active ? 'font-semibold' : ''}`}>
                {item.label}
              </span>
              {active && (
                <span className="w-1 h-1 mt-0.5 rounded-full bg-green-500" />
              )}
            </Link>
          );
        })}

        {/* More button */}
        <div className="relative" ref={moreRef}>
          <button
            onClick={() => setIsMoreOpen((prev) => !prev)}
            className={`flex flex-col items-center justify-center py-1.5 px-3 rounded-lg transition-colors duration-200 ${
              isMoreActive || isMoreOpen
                ? 'text-green-600'
                : 'text-gray-400 hover:text-gray-600'
            }`}
          >
            <span className={`text-xl transition-transform duration-200 ${isMoreOpen ? 'scale-110' : ''}`}>
              ☰
            </span>
            <span className={`text-[10px] mt-0.5 font-medium ${isMoreActive ? 'font-semibold' : ''}`}>
              עוד
            </span>
            {isMoreActive && (
              <span className="w-1 h-1 mt-0.5 rounded-full bg-green-500" />
            )}
          </button>

          {/* More dropdown (opens upward) */}
          {isMoreOpen && (
            <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 bg-white rounded-xl shadow-lg border border-gray-100 py-2 min-w-[160px] animate-in fade-in slide-in-from-bottom-2 duration-200">
              {moreMenuItems.map((item) => {
                const active = isActive(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors duration-150 hover:bg-gray-50 ${
                      active
                        ? 'text-green-600 font-semibold bg-green-50/50'
                        : 'text-gray-700'
                    }`}
                  >
                    <span className="text-lg">{item.icon}</span>
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
