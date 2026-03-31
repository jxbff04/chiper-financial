'use client';

// components/TerminalHeader.tsx
// Bloomberg-style top bar: logo + nav tabs + live clock + status strip

import { useState, useEffect } from 'react';
import { Activity, Wifi, Clock, ChevronRight } from 'lucide-react';

interface TerminalHeaderProps {
  activeSection: 'research' | 'compare';
  onSectionChange: (s: 'research' | 'compare') => void;
}

// Fake ticker tape data — replace with real API later
const TAPE_ITEMS = [
  { ticker: 'SPX',  price: '5,482.87', change: '+0.34%', up: true  },
  { ticker: 'NDX',  price: '19,341.20', change: '+0.61%', up: true  },
  { ticker: 'DJI',  price: '40,003.59', change: '+0.12%', up: true  },
  { ticker: 'VIX',  price: '14.23',    change: '-3.41%', up: false },
  { ticker: 'GLD',  price: '2,312.40', change: '+0.08%', up: true  },
  { ticker: 'BTC',  price: '67,840',   change: '+1.22%', up: true  },
  { ticker: 'DXY',  price: '104.32',   change: '-0.19%', up: false },
  { ticker: 'OIL',  price: '78.44',    change: '-0.55%', up: false },
  { ticker: 'TNX',  price: '4.312',    change: '+0.03%', up: true  },
  { ticker: 'AAPL', price: '189.30',   change: '+0.44%', up: true  },
  { ticker: 'NVDA', price: '875.40',   change: '+2.11%', up: true  },
  { ticker: 'MSFT', price: '415.20',   change: '+0.29%', up: true  },
  { ticker: 'TSLA', price: '174.80',   change: '-1.32%', up: false },
];

function LiveClock() {
  const [time, setTime] = useState('');
  const [date, setDate] = useState('');

  useEffect(() => {
    function update() {
      const now = new Date();
      setTime(now.toLocaleTimeString('en-US', {
        hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false
      }));
      setDate(now.toLocaleDateString('en-US', {
        weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
      }).toUpperCase());
    }
    update();
    const id = setInterval(update, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-center gap-2 text-right">
      <Clock size={10} className="text-[oklch(0.72_0.18_88)]" />
      <div>
        <div className="font-mono text-[11px] font-semibold text-[oklch(0.72_0.18_88)] tabular-nums">
          {time} <span className="text-[9px] font-normal text-[oklch(0.48_0_0)]">EST</span>
        </div>
        <div className="text-[8px] text-[oklch(0.40_0_0)] tracking-wider">{date}</div>
      </div>
    </div>
  );
}

function StatusDot({ ok = true }: { ok?: boolean }) {
  return (
    <span className="relative flex h-1.5 w-1.5">
      {ok && (
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[oklch(0.70_0.17_142)] opacity-60" />
      )}
      <span
        className={`relative inline-flex rounded-full h-1.5 w-1.5 ${
          ok ? 'bg-[oklch(0.70_0.17_142)]' : 'bg-[oklch(0.60_0.22_25)]'
        }`}
      />
    </span>
  );
}

const TABS = [
  { id: 'research', label: 'RESEARCH', shortcut: 'F1' },
  { id: 'compare',  label: 'COMPARE',  shortcut: 'F2' },
] as const;

export default function TerminalHeader({ activeSection, onSectionChange }: TerminalHeaderProps) {
  return (
    <header className="sticky top-0 z-50 bg-[oklch(0.055_0_0)] border-b border-[oklch(0.16_0_0)]">

      {/* ── Top strip: branding + clock + status ── */}
      <div
        className="flex items-center justify-between px-3 py-1.5 border-b border-[oklch(0.13_0_0)]"
        style={{ background: 'oklch(0.075 0 0)' }}
      >
        {/* Brand */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-1.5">
            <div
              className="w-4 h-4 flex items-center justify-center rounded-sm"
              style={{ background: 'oklch(0.72 0.18 88)', color: 'oklch(0.06 0 0)' }}
            >
              <Activity size={10} strokeWidth={2.5} />
            </div>
            <span
              className="text-[11px] font-bold tracking-[0.18em] uppercase"
              style={{ color: 'oklch(0.72 0.18 88)' }}
            >
              TERMINAL
            </span>
          </div>
          <ChevronRight size={10} className="text-[oklch(0.28_0_0)]" />
          <span className="text-[10px] text-[oklch(0.48_0_0)] tracking-widest">
            INSTITUTIONAL RESEARCH SYSTEM
          </span>
        </div>

        {/* Right: status + clock */}
        <div className="flex items-center gap-4">
          {/* API Status */}
          <div className="hidden sm:flex items-center gap-3 text-[9px] text-[oklch(0.40_0_0)]">
            <span className="flex items-center gap-1.5">
              <StatusDot ok />
              <span>FINNHUB</span>
            </span>
            <span className="flex items-center gap-1.5">
              <StatusDot ok />
              <span>ALPHA VANTAGE</span>
            </span>
            <span className="flex items-center gap-1.5">
              <StatusDot ok />
              <span>GEMINI AI</span>
            </span>
            <span className="flex items-center gap-1.5">
              <Wifi size={8} className="text-[oklch(0.70_0.17_142)]" />
              <span className="text-[oklch(0.70_0.17_142)]">LIVE</span>
            </span>
          </div>
          <LiveClock />
        </div>
      </div>

      {/* ── Nav tabs ── */}
      <div className="flex items-center px-3 gap-0 border-b border-[oklch(0.13_0_0)]">
        {TABS.map((tab) => {
          const isActive = activeSection === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => onSectionChange(tab.id)}
              className="relative flex items-center gap-2 px-4 py-2 text-[10px] font-bold tracking-widest transition-colors"
              style={{
                color: isActive
                  ? 'oklch(0.06 0 0)'
                  : 'oklch(0.45 0 0)',
                background: isActive
                  ? 'oklch(0.72 0.18 88)'
                  : 'transparent',
                borderRight: '1px solid oklch(0.13 0 0)',
              }}
            >
              <span className="text-[8px] opacity-60">{tab.shortcut}</span>
              {tab.label}
            </button>
          );
        })}

        {/* Right filler */}
        <div className="flex-1" />
        <span className="text-[8px] text-[oklch(0.28_0_0)] pr-2 tracking-widest hidden md:block">
          NOT FINANCIAL ADVICE · AI-GENERATED RESEARCH
        </span>
      </div>

      {/* ── Ticker tape ── */}
      <div
        className="overflow-hidden py-1 border-b border-[oklch(0.12_0_0)]"
        style={{ background: 'oklch(0.068 0 0)' }}
      >
        <div className="ticker-tape">
          {/* Duplicate array for seamless loop */}
          {[...TAPE_ITEMS, ...TAPE_ITEMS].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 text-[9px]">
              <span className="font-bold text-[oklch(0.72_0.18_88)] tracking-wider">
                {item.ticker}
              </span>
              <span className="text-[oklch(0.75_0_0)] tabular-nums">{item.price}</span>
              <span
                className="tabular-nums font-semibold"
                style={{ color: item.up ? 'oklch(0.70 0.17 142)' : 'oklch(0.60 0.22 25)' }}
              >
                {item.change}
              </span>
              <span className="text-[oklch(0.22_0_0)] mx-2">│</span>
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
