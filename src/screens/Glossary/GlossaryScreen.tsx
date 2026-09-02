import { GlossaryList } from './GlossaryList';

export function GlossaryScreen() {
  return (
    <div className="animate-rise mx-auto max-w-3xl">
      <p className="mb-5 text-sm leading-relaxed text-ink-muted">
        Trading jargon is mostly ordinary ideas wearing a suit. Every term here is written the way you
        would explain it to a friend, with the catch that matters underneath.
      </p>
      <GlossaryList />
    </div>
  );
}
