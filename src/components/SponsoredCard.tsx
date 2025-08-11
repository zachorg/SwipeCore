import { Button } from "./ui/button";
import { useEffect, useRef } from 'react';
import { NativeAds, isAndroid, getAndroidTestNativeAdUnitId, isNativeAdsTestMode, getMockNativeAd } from '@/utils/nativeAds';

const PLACEHOLDER_IMAGE =
  "https://via.placeholder.com/800x1200.png?text=Sponsored+Ad";

interface SponsoredCardProps {
  onContinue?: () => void;
  href?: string;
}

export function SponsoredCard({ onContinue }: SponsoredCardProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mock = getMockNativeAd();

  useEffect(() => {
    if (!isAndroid()) return;
    const el = containerRef.current;
    if (!el) return;

    const adUnitId = (
      import.meta.env.VITE_ADMOB_NATIVE_AD_UNIT_ID_ANDROID ||
      getAndroidTestNativeAdUnitId()
    );

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
        const testMode = isNativeAdsTestMode();
        if (testMode) {
          console.log('[NativeAds] Test mode enabled - skipping native load, using mock overlay');
          return;
        }
        const isTestUnit = adUnitId === getAndroidTestNativeAdUnitId();
        console.log('[NativeAds] Loading native ad', { adUnitId, isTestUnit });
        await NativeAds.load({ adUnitId });
        console.log('[NativeAds] Loaded successfully', { adUnitId, isTestUnit });
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
    <div
      ref={containerRef}
      className="relative block w-full h-full bg-white rounded-3xl overflow-hidden shadow-2xl border border-purple-200/30 ring-1 ring-purple-100/50"
      data-swipe-card="true"
    >
      <img
        src={mock.imageUrl || PLACEHOLDER_IMAGE}
        alt="Sponsored"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 bg-white/95 backdrop-blur-md p-6 text-gray-800 border-t border-purple-200/50 shadow-lg">
        <div className="text-xs uppercase tracking-wide text-gray-500 mb-2">Sponsored</div>
        <div className="text-base font-semibold text-gray-900 mb-1 line-clamp-1">
          {mock.headline}
        </div>
        <div className="text-sm text-gray-600 line-clamp-2">
          {mock.body}
        </div>
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


