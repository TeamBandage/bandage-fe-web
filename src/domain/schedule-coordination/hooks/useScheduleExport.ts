'use client';

import { useCallback, useRef, useState, type RefObject } from 'react';

export interface UseScheduleExportResult<T extends HTMLElement> {
  ref: RefObject<T | null>;
  exporting: boolean;
  exportJpeg: (filename: string) => Promise<void>;
}

/**
 * Task 11 — 시간표 영역을 JPEG 으로 내보내기.
 * dom-to-image-more 사용. 폰트/색상은 inline computed style 로 캡처.
 */
export function useScheduleExport<T extends HTMLElement>(): UseScheduleExportResult<T> {
  const ref = useRef<T | null>(null);
  const [exporting, setExporting] = useState(false);

  const exportJpeg = useCallback(async (filename: string) => {
    if (!ref.current) return;
    setExporting(true);
    try {
      const { default: domtoimage } = await import('dom-to-image-more');
      const node = ref.current;
      const dataUrl = await domtoimage.toJpeg(node, {
        quality: 0.95,
        bgcolor: '#0d0d12',
        cacheBust: true,
      });
      const link = document.createElement('a');
      link.download = `${filename}.jpg`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  }, []);

  return { ref, exporting, exportJpeg };
}
