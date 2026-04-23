# Bandage — Production Web Codebase

실제 개발용으로 HTML / CSS / JavaScript로 분리된 Bandage 웹 프로덕션 스타터입니다.

## 구조

```
dist/
├── index.html              # 진입점
├── css/
│   ├── tokens.css          # 디자인 토큰 (색상, 간격, 타이포)
│   ├── base.css            # 리셋 + 베이스 스타일
│   ├── layout.css          # 쉘, 사이드바, 마스터-디테일 레이아웃
│   ├── components.css      # 버튼, 입력, 카드, 모달 등 공통 UI
│   └── screens.css         # 화면 전용 스타일
└── js/
    ├── main.js             # 부트스트랩 + 라우터 마운트
    ├── core.js             # h(), Store, Router, cx()
    ├── icons.js            # SVG 아이콘 라이브러리
    ├── components.js       # Button, Field, Modal, Toast 등
    ├── data.js             # 목업 데이터 (API 연결 시 교체)
    ├── shell.js            # Sidebar, TopBar
    └── screens/
        ├── auth.js         # 로그인 / 회원가입 / 비밀번호 변경
        ├── home.js         # 홈 대시보드 + 마이페이지
        ├── band.js         # 밴드 목록 / 상세 / 생성
        ├── practice.js     # 합주 목록 / 상세 / 생성
        └── performance.js  # 공연 목록 / 상세 / 생성
```

## 실행

정적 서버에서 바로 구동됩니다 (ES 모듈 사용).

```bash
cd dist && python3 -m http.server 8000
# 또는 npx serve dist
```

그 후 `http://localhost:8000/` 접속.

## 주요 구현

- **Zero-dependency** — 빌드 단계 없이 ES 모듈로 바로 실행
- **Tiny framework** — `h()` 하이퍼스크립트 + `Store` 구독 + `Router` 스택
- **Master-detail 레이아웃** — 데스크톱 최적화된 좌측 목록 / 우측 상세
- **디자인 토큰** — `tokens.css`에서 색상·간격·타이포 중앙 관리
- **상태 지속** — `localStorage`에 최근 네비게이션 저장

## API 연결

`js/data.js`의 목업 배열을 실제 `fetch()` 기반 모듈로 교체하세요. 화면 컴포넌트는 동일한 함수 시그니처를 따르면 즉시 연동됩니다.
