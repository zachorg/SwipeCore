import { useRef } from 'react';

export function SponsoredCard() {
  const containerRef = useRef<HTMLDivElement | null>(null);

  return (
    <div ref={containerRef} className="relative block w-full h-full" data-swipe-card="true" />
  );
}


