"use client";

import { useEffect } from "react";

type AdSize = "leaderboard" | "banner" | "rectangle" | "mobile" | "skyscraper";

interface AdBannerProps {
  slot: string;
  size: AdSize;
  className?: string;
}

const sizeMap: Record<AdSize, { width: number; height: number; maxW: string }> = {
  leaderboard: { width: 728, height: 90, maxW: "max-w-[728px]" },
  banner: { width: 468, height: 60, maxW: "max-w-[468px]" },
  rectangle: { width: 336, height: 280, maxW: "max-w-[336px]" },
  mobile: { width: 320, height: 50, maxW: "max-w-[320px]" },
  skyscraper: { width: 160, height: 600, maxW: "max-w-[160px]" },
};

export function AdBanner({ slot, size, className = "" }: AdBannerProps) {
  const { width, height, maxW } = sizeMap[size];

  useEffect(() => {
    try {
      // @ts-expect-error adsbygoogle is injected by Google
      (window.adsbygoogle = window.adsbygoogle || []).push({});
    } catch (e) {
      console.error("AdSense error:", e);
    }
  }, []);

  return (
    <div className={`flex justify-center my-4 ${className}`}>
      <div
        className={`${maxW} w-full overflow-hidden rounded-lg bg-white/5 border border-white/10`}
      >
        <ins
          className="adsbygoogle"
          style={{ display: "block", width: "100%", height: `${height}px` }}
          data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
          data-ad-slot={slot}
          data-ad-format="auto"
          data-full-width-responsive="true"
        />
      </div>
    </div>
  );
}

/**
 * Placeholder banner shown when AdSense is not yet configured.
 * Displays a "Your Ad Here" message to indicate where ads will appear.
 */
export function AdPlaceholder({ size, className = "" }: { size: AdSize; className?: string }) {
  const { height, maxW } = sizeMap[size];

  return (
    <div className={`flex justify-center my-4 ${className}`}>
      <div
        className={`${maxW} w-full flex items-center justify-center rounded-lg border border-dashed border-white/20 bg-white/[0.03] text-white/20 text-xs`}
        style={{ minHeight: `${Math.min(height, 90)}px` }}
      >
        <span className="flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m6-6H6" />
          </svg>
          Advertisement
        </span>
      </div>
    </div>
  );
}
