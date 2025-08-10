import { Button } from "./ui/button";
import { useEffect, useRef } from 'react';
import { NativeAds, isAndroid } from '@/utils/nativeAds';

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/800x1200.png?text=Sponsored+Ad";

interface SponsoredCardProps {
  onContinue?: () => void;
  href?: string;
}

export function SponsoredCard({ onContinue }: SponsoredCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isAndroid()) return;
    const el = containerRef.current;
    if (!el) return;

    const adUnitId = import.meta.env.VITE_ADMOB_NATIVE_AD_UNIT_ID_ANDROID || 'ca-app-pub-3940256099942544/2247696110';

    const updatePosition = async () => {
      if (!el) return;
      // Align to the actual swipe card container instead of inner content,
      // so the native overlay exactly matches position and size
      const rect = el.closest('[data-swipe-card="true"]')?.getBoundingClientRect() || el.getBoundingClientRect();
      const x = rect.left + window.scrollX;
      const y = rect.top + window.scrollY;
      const width = rect.width;
      const height = rect.height;
      try {
        await NativeAds.attach({ x, y, width, height });
        console.log('[NativeAds] Attached at', { x, y, width, height });
      } catch (e) {
        console.warn('[NativeAds] Attach failed', e);
      }
    };

    const loadAndAttach = async () => {
      try {
        console.log('[NativeAds] Loading native ad', { adUnitId });
        await NativeAds.load({ adUnitId });
        console.log('[NativeAds] Loaded successfully');
        await updatePosition();
      } catch (e) {
        console.warn('[NativeAds] Load failed', e);
      }
    };

    loadAndAttach();

    const onScroll = () => updatePosition();
    const onResize = () => updatePosition();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onResize);
    const observer = new ResizeObserver(() => updatePosition());
    observer.observe(document.body);

    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', onResize);
      observer.disconnect();
      NativeAds.detach().catch(() => {});
    };
  }, []);

  return (
    <div ref={containerRef} className="relative block w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-purple-200/30 ring-1 ring-purple-100/50" data-swipe-card="true">
      <img
        src={PLACEHOLDER_IMAGE}
        alt="Sponsored"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-6 text-gray-800 border-t border-purple-200/50 shadow-lg">
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Sponsored</div>
        <div className="h-4 bg-gray-200 rounded w-3/4 mb-2" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        {onContinue && (
          <div className="mt-4 flex justify-end">
            <Button variant="outline" onClick={onContinue}>
              Continue
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}


