'use client';

import { useCallback, useRef, useState, type RefObject } from 'react';

export type ExportFormat = 'png' | 'jpeg';

export interface UseScheduleExportResult<T extends HTMLElement> {
  ref: RefObject<T | null>;
  exporting: boolean;
  exportImage: (filename: string, format: ExportFormat) => Promise<void>;
}

/**
 * 시간표 영역을 PNG/JPEG 으로 내보내기.
 * 화질 보강:
 *  - devicePixelRatio 기반 2x 캡처 (window.devicePixelRatio || 2)
 *  - PNG 무손실, JPEG quality 0.97
 *  - cacheBust 로 stale 폰트/이미지 회피
 */
export function useScheduleExport<T extends HTMLElement>(): UseScheduleExportResult<T> {
  const ref = useRef<T | null>(null);
  const [exporting, setExporting] = useState(false);

  const exportImage = useCallback(async (filename: string, format: ExportFormat) => {
    if (!ref.current) return;
    setExporting(true);
    try {
      const { default: domtoimage } = await import('dom-to-image-more');
      const node = ref.current;
      const rect = node.getBoundingClientRect();
      const scale =
        typeof window !== 'undefined' && window.devicePixelRatio ? window.devicePixelRatio * 2 : 2;
      const baseOpts = {
        bgcolor: '#0d0d12',
        cacheBust: true,
        width: rect.width * scale,
        height: rect.height * scale,
        style: {
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
          width: `${rect.width}px`,
          height: `${rect.height}px`,
        },
      };
      const dataUrl =
        format === 'png'
          ? await domtoimage.toPng(node, baseOpts)
          : await domtoimage.toJpeg(node, { ...baseOpts, quality: 0.97 });
      const link = document.createElement('a');
      link.download = `${filename}.${format === 'png' ? 'png' : 'jpg'}`;
      link.href = dataUrl;
      link.click();
    } finally {
      setExporting(false);
    }
  }, []);

  return { ref, exporting, exportImage };
}
