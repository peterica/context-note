'use client';

import { useState, useRef, useCallback } from 'react';

interface TooltipProps {
  text: string;
  children: React.ReactNode;
  position?: 'top' | 'bottom';
  delay?: number;
}

export default function Tooltip({ text, children, position = 'bottom', delay = 400 }: TooltipProps) {
  const [visible, setVisible] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const show = useCallback(() => {
    timerRef.current = setTimeout(() => setVisible(true), delay);
  }, [delay]);

  const hide = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    setVisible(false);
  }, []);

  const posClass = position === 'top'
    ? 'bottom-full mb-1.5 left-1/2 -translate-x-1/2'
    : 'top-full mt-1.5 left-1/2 -translate-x-1/2';

  return (
    <span className="relative inline-flex" onMouseEnter={show} onMouseLeave={hide}>
      {children}
      {visible && (
        <span
          className={`absolute z-50 whitespace-nowrap px-2 py-1 text-[10px] rounded bg-gray-800 text-gray-200 border border-border shadow-lg pointer-events-none ${posClass}`}
        >
          {text}
        </span>
      )}
    </span>
  );
}
