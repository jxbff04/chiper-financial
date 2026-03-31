// components/TickerInput.tsx
// The ticker search bar — triggers the research pipeline

'use client';

import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';

interface TickerInputProps {
  onSearch: (ticker: string) => void;
  isLoading: boolean;
}

export default function TickerInput({ onSearch, isLoading }: TickerInputProps) {
  const [value, setValue] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const ticker = value.trim().toUpperCase();
    if (ticker) onSearch(ticker);
  }

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <div className="relative flex-1">
        <Search
          size={14}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"
        />
        <Input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          placeholder="Enter ticker symbol — AAPL, NVDA, MSFT..."
          className="pl-8 bg-secondary border-border font-mono text-sm uppercase placeholder:normal-case placeholder:text-muted-foreground focus:border-emerald-700 focus:ring-emerald-900"
          disabled={isLoading}
        />
      </div>
      <Button
        type="submit"
        disabled={isLoading || !value.trim()}
        className="bg-emerald-800 hover:bg-emerald-700 text-white font-bold tracking-wider px-6"
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin mr-2" />
            ANALYZING
          </>
        ) : (
          'RUN ANALYSIS'
        )}
      </Button>
    </form>
  );
}