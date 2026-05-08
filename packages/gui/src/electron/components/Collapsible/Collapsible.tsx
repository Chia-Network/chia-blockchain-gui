import React, { type ReactNode } from 'react';

export type CollapsibleProps = {
  title: string;
  children: ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export default function Collapsible(props: CollapsibleProps) {
  const { title, children, defaultOpen = false, className = '' } = props;

  return (
    <div className={`rounded-xl border border-chia-border bg-chia-card overflow-hidden ${className}`}>
      <details className="group" open={defaultOpen}>
        <summary className="flex items-center justify-between gap-3 px-5 py-3.5 cursor-pointer list-none select-none hover:bg-chia-card-elevated transition-colors">
          <span className="text-xs font-semibold uppercase tracking-wider text-chia-text-muted">{title}</span>
          <svg
            className="w-4 h-4 text-chia-text-secondary transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="px-5 pb-4 pt-3.5 border-t border-chia-border">{children}</div>
      </details>
    </div>
  );
}
