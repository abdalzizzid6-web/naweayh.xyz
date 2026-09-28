import React from 'react';

export type AdPlacement = 'top-leaderboard' | 'in-article' | 'sidebar' | 'bottom-article' | 'mobile-banner';

interface AdSlotProps {
  placement: AdPlacement;
  slotId?: string;
  className?: string;
}

/**
 * Standard AdSlot Component for Commercial News Platform
 * AdSense / IAB Compliant:
 * - Clear "إعلان" (Advertisement) disclosure
 * - Reserved dimensions to prevent Cumulative Layout Shift (CLS)
 * - Safe margins to prevent accidental clicks
 * - No deceptive borders, mock data, or fake clicks
 */
export const AdSlot: React.FC<AdSlotProps> = ({
  placement,
  slotId,
  className = '',
}) => {
  // Placement styling & aspect ratio reservations
  let containerStyles = '';
  let slotLabel = 'إعلان';

  switch (placement) {
    case 'top-leaderboard':
      containerStyles = 'min-h-[60px] sm:min-h-[90px] max-w-5xl my-4';
      break;
    case 'in-article':
      containerStyles = 'min-h-[250px] max-w-xl my-6';
      break;
    case 'sidebar':
      containerStyles = 'min-h-[250px] w-full my-4';
      break;
    case 'bottom-article':
      containerStyles = 'min-h-[90px] sm:min-h-[120px] max-w-4xl my-8';
      break;
    case 'mobile-banner':
      containerStyles = 'min-h-[50px] w-full my-2 sm:hidden';
      break;
    default:
      containerStyles = 'min-h-[100px] my-4';
  }

  return (
    <div
      role="region"
      aria-label="مساحة إعلانية"
      dir="rtl"
      className={`mx-auto w-full flex flex-col items-center justify-center select-none ${containerStyles} ${className}`}
    >
      {/* Standard Google Policy Disclaimer Label */}
      <div className="w-full flex items-center justify-center gap-2 mb-1.5">
        <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
        <span className="text-[10px] tracking-wider text-slate-400 dark:text-slate-500 font-medium uppercase">
          {slotLabel}
        </span>
        <span className="h-px flex-1 bg-slate-100 dark:bg-slate-800" />
      </div>

      {/* Reserved Ad Container (Clean, lightweight placeholder ready for script injection) */}
      <div className="w-full flex-1 rounded-xl border border-dashed border-slate-200/80 dark:border-slate-800/80 bg-slate-50/60 dark:bg-slate-900/40 p-4 flex flex-col items-center justify-center text-center transition-colors">
        <span className="text-xs text-slate-400 dark:text-slate-500 font-sans">
          مساحة إعلانية معتمدة — متوافقة مع معايير Google AdSense
        </span>
        {slotId && (
          <span className="text-[10px] font-mono text-slate-400 mt-1">
            Slot: {slotId}
          </span>
        )}
      </div>
    </div>
  );
};
