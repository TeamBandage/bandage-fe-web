# Bandage 피그마 Export 패키지

`Bandage Web.html` 프로토타입을 피그마로 가져오기 위한 3종 자료 묶음.

## 📦 포함 항목

```
figma-export/
├── bandage-tokens.json          # 디자인 토큰 (색/타이포/스페이싱)
├── Bandage-Web-Standalone.html  # 외부 의존성 인라인된 단일 HTML
├── screens/                     # 주요 화면 1920x1080 PNG
│   ├── 01-login.png
│   ├── 02-home.png
│   ├── 03-band.png
│   ├── 04-practice.png
│   ├── 05-performance.png
│   ├── 06-mypage.png
│   ├── 07-band-detail.png
│   └── 08-join.png
└── README.md
```

---

## 1️⃣ 디자인 토큰 — `bandage-tokens.json`

**Figma Tokens / Tokens Studio 플러그인** 호환 형식.

### 가져오기 방법
1. 피그마에서 **Tokens Studio for Figma** 플러그인 설치
2. 플러그인 열기 → ⚙️ Settings → **Tools → Load from file/folder/preset**
3. `bandage-tokens.json` 선택
4. 프로젝트 별 적용: 우측 상단 메뉴 → **Apply to selection / page**

### 토큰 구조
- `color` — 23개 (배경/서피스/텍스트/액센트 블루/세만틱/역할)
- `radius` — 5단계 (sm/md/lg/xl/pill)
- `spacing` — 9단계 (4 ~ 48px)
- `typography` — 폰트 패밀리, 가중치 6단계, 크기 8단계
- `shadow` — 3단계 (sm/md/lg)
- `layout` — 사이드바/리스트 패널 너비

---

## 2️⃣ Standalone HTML — `Bandage-Web-Standalone.html`

모든 외부 의존성(React, Babel, 폰트, JSX 모듈)이 인라인된 **단일 파일**.

### html.to.design 플러그인으로 가져오기
1. 피그마에서 **html.to.design** 플러그인 설치 (무료/유료 플랜 있음)
2. 플러그인 열기 → **Import from URL** 또는 **Upload HTML file**
3. `Bandage-Web-Standalone.html` 업로드
4. 프레임 단위로 자동 변환됨 (텍스트/이미지/오토레이아웃 보존)

### 대안: Builder.io Figma Importer / Anima
- HTML 파일을 직접 import 가능한 다른 플러그인들과도 호환

---

## 3️⃣ 스크린 PNG — `screens/`

8개 핵심 화면을 1920×1080 (실제 캡처 비율) 고화질 PNG로 추출.

### 사용법
- **레퍼런스 임포트**: 피그마 캔버스에 드래그&드롭 → 디자인 가이드로 활용
- **컴포넌트 추적**: 각 PNG 위에 새 프레임을 겹쳐 컴포넌트 재구성
- **공유용**: 디자인 리뷰/피드백 자료로 사용

### 화면 목록
| 파일 | 화면 |
|------|------|
| 01-login.png | 로그인 (좌측 브랜드 패널 + 우측 폼) |
| 02-home.png | 홈 대시보드 (통계 카드 + 그리드) |
| 03-band.png | 밴드 목록/상세 (마스터-디테일) |
| 04-practice.png | 합주 목록/상세 |
| 05-performance.png | 공연 목록/상세 |
| 06-mypage.png | 마이페이지 |
| 07-band-detail.png | 밴드 상세 화면 |
| 08-join.png | 회원가입 |

---

## 추천 워크플로우

1. **토큰 먼저** — `bandage-tokens.json`을 Tokens Studio로 임포트하여 색/타이포 변수 세팅
2. **HTML 임포트** — `Bandage-Web-Standalone.html`을 html.to.design으로 변환 → 베이스 프레임 생성
3. **PNG로 보강** — 자동 변환에서 누락된 영역은 PNG 레퍼런스로 수동 재구성
4. **컴포넌트화** — 사이드바, 카드, 버튼 등을 피그마 컴포넌트로 승격

---

## 참고

- **HTML→Figma 자동 변환의 한계**: 인터랙션, JS state, 애니메이션은 변환되지 않습니다. 정적 레이아웃만 추출됩니다.
- **폰트**: Noto Sans KR이 피그마에 설치되어 있어야 정확히 렌더됩니다.
- **다크 테마 보존**: 배경/카드 색상은 토큰 적용 후에도 유지되도록 PNG와 HTML 둘 다 `#0D0D12` 배경 기준입니다.
