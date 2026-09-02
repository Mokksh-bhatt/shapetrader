import { useMemo, useState } from 'react';
import { Search } from 'lucide-react';
import { GLOSSARY, type GlossaryCategory } from '@/data/glossary/terms';
import { Pill } from '@/components/ui/Card';
import { cn } from '@/lib/cn';

const CATEGORIES: GlossaryCategory[] = ['Charts', 'Orders', 'Risk', 'Market'];

export function GlossaryList({ initialQuery = '', dense = false }: { initialQuery?: string; dense?: boolean }) {
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState<GlossaryCategory | 'All'>('All');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return GLOSSARY.filter((t) => {
      const matchesCategory = category === 'All' || t.category === category;
      const matchesQuery =
        !q ||
        t.term.toLowerCase().includes(q) ||
        t.plain.toLowerCase().includes(q) ||
        (t.detail ?? '').toLowerCase().includes(q);
      return matchesCategory && matchesQuery;
    });
  }, [query, category]);

  return (
    <div className="flex min-h-0 flex-col gap-4">
      <div className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-ink-dim" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search terms — try 'stop loss'"
          className="h-10 w-full rounded-lg border border-line bg-surface-2 pl-9 pr-3 text-sm text-ink placeholder:text-ink-dim focus:border-brand/60 focus:outline-none"
        />
      </div>

      <div className="flex flex-wrap gap-1.5">
        {(['All', ...CATEGORIES] as const).map((c) => (
          <button
            key={c}
            onClick={() => setCategory(c)}
            className={cn(
              'rounded-full border px-3 py-1 text-[11px] font-medium transition',
              category === c
                ? 'border-brand/50 bg-brand/15 text-brand'
                : 'border-line bg-surface-2 text-ink-muted hover:text-ink',
            )}
          >
            {c}
          </button>
        ))}
      </div>

      <div className={cn('min-h-0 flex-1 space-y-2.5 overflow-y-auto pr-1', dense && 'text-[13px]')}>
        {results.map((t) => (
          <div key={t.id} className="rounded-xl border border-line bg-surface p-3.5">
            <div className="flex items-center justify-between gap-3">
              <h3 className="text-[13px] font-semibold text-ink">{t.term}</h3>
              <Pill>{t.category}</Pill>
            </div>
            <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-muted">{t.plain}</p>
            {t.detail ? (
              <p className="mt-2 border-l-2 border-line-strong pl-2.5 text-[12px] leading-relaxed text-ink-dim">
                {t.detail}
              </p>
            ) : null}
          </div>
        ))}
        {results.length === 0 ? (
          <p className="py-8 text-center text-sm text-ink-dim">No terms match “{query}”.</p>
        ) : null}
      </div>
    </div>
  );
}
