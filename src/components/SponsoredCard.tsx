import { useEffect, useRef, useState } from 'react';
import { Capacitor } from '@capacitor/core';
// @ts-ignore: plugin provides global namespace
import { AdmobNativeAdvanced } from '@brandonknudsen/admob-native-advanced';

export function SponsoredCard() {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [ad, setAd] = useState<any | null>(null);

  useEffect(() => {
    const isNative = Capacitor.getPlatform() !== 'web';
    if (!isNative) return;
    let mounted = true;
    const load = async () => {
      try {
        // Prefer env unit; fallback to Google test Native Advanced unit
        const adUnitId = (import.meta as any)?.env?.VITE_ADMOB_NATIVE_AD_UNIT_ID_ANDROID || 'ca-app-pub-3940256099942544/2247696110';
        const res = await (AdmobNativeAdvanced as any).loadNativeAd?.({ adId: adUnitId, isTesting: true, adsCount: 1 });
        const ads = res?.ads || [];
        if (mounted && ads.length > 0) setAd(ads[0]);
      } catch (_) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  return (
    <div ref={containerRef} className="relative block w-full h-full" data-swipe-card="true">
      {ad && (
        <div className="absolute inset-0">
          {ad.cover && (
            <img src={ad.cover} alt="ad" className="absolute inset-0 w-full h-full object-cover" />
          )}
          <div className="absolute bottom-0 left-0 right-0 bg-white/95 p-4">
            <div className="text-xs uppercase text-gray-600">Sponsored</div>
            {ad.headline && <div className="text-base font-semibold text-gray-900 line-clamp-1">{ad.headline}</div>}
            {ad.body && <div className="text-sm text-gray-700 line-clamp-2">{ad.body}</div>}
            {ad.cta && (
              <div className="mt-3">
                <a
                  href={ad.clickUrl || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-purple-600 text-white px-3 py-1.5 rounded-lg text-sm"
                >
                  {ad.cta}
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}


