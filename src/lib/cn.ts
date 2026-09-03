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
            'lime',
            'teal',
            'sky',
            'violet',
            'purple',
            'pink',
            'role-leader',
            'role-admin',
            'role-member',
          ],
        },
      ],
      // globals.css --color-* 커스텀 색상 토큰 등록 (border-* 색상 유틸리티) — 이게 없으면
      // tailwind-merge가 예: border-accent 와 border-foreground 를 같은 그룹(border-color)으로
      // 인식하지 못해 충돌 제거를 안 해주고 둘 다 클래스 문자열에 남는다. 이러면 나중에 쓴
      // 클래스로 덮어쓰려 해도 실제로 어느 게 이기는지는 컴파일된 CSS 순서에 달려서, 의도한
      // 색으로 안 바뀌는 채로 남는 경우가 있었다(탭 활성 밑줄을 accent→foreground로 덮어쓰려
      // 했는데 계속 주황색으로 보이던 버그).
      'border-color': [
        {
          border: [
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
            'lime',
            'teal',
            'sky',
            'violet',
            'purple',
            'pink',
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
