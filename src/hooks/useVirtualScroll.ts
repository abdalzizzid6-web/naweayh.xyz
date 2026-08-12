import React, { useState, useEffect, useRef } from 'react';

interface UseVirtualScrollOptions {
  itemCount: number;
  itemHeight: number;
  containerHeight: number;
  overscan?: number;
}

export function useVirtualScroll({
  itemCount,
  itemHeight,
  containerHeight,
  overscan = 3,
}: UseVirtualScrollOptions) {
  const [scrollTop, setScrollTop] = useState(0);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const startIndex = Math.max(0, Math.floor(scrollTop / itemHeight) - overscan);
  const endIndex = Math.min(
    itemCount - 1,
    Math.floor((scrollTop + containerHeight) / itemHeight) + overscan
  );

  const totalHeight = itemCount * itemHeight;
  const offsetY = startIndex * itemHeight;

  const onScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  return {
    containerRef,
    startIndex,
    endIndex,
    totalHeight,
    offsetY,
    onScroll,
    visibleRange: [startIndex, endIndex],
  };
}
