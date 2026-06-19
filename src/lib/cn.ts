import { clsx, type ClassValue } from 'clsx';
import { extendTailwindMerge } from 'tailwind-merge';

const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      // globals.css --text-* 커스텀 폰트 크기 토큰 등록
      'font-size': [
        { text: ['micro', 'caption', 'body', 'subtitle', 'title', 'title-lg', 'display'] },
      ],
      // globals.css --color-* 커스텀 색상 토큰 등록 (text-* 색상 유틸리티)
      'text-color': [
        {
          text: [
            'foreground',
            'foreground-sub',
            'foreground-muted',
            'accent',
            'accent-hi',
            'brand',
            'nav-active',
            'success',
            'warn',
            'danger',
            'amber',
            'blue',
            'role-leader',
            'role-admin',
            'role-member',
          ],
        },
      ],
    },
  },
});

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
