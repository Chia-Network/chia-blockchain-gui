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
    <div className={`border border-gray-200 dark:border-gray-700 rounded-lg align-start ${className}`}>
      <details className="group" open={defaultOpen}>
        <summary className="flex items-center justify-between p-4 cursor-pointer list-none">
          <span className="text-gray-500 dark:text-gray-400">{title}</span>
          <svg
            className="w-4 h-4 transition-transform group-open:rotate-180"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </summary>
        <div className="p-4 pt-0">{children}</div>
      </details>
    </div>
  );
}
