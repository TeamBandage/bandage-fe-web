# Task ID: 17

**Title:** 모바일 뷰에서 생성 모달 (Task 16) 자연스러운 렌더 확인

**Status:** done

**Dependencies:** None

**Priority:** low

**Description:** Task 16 에서 도입한 Band/Practice/Performance 생성 모달이 lg 미만(BottomSheet) 에서 컨트롤/입력 높이·스크롤이 자연스러운지 확인하고, Playwright 스모크를 추가한다.

**Details:**

ResponsiveSheet 가 lg 미만에서 BottomSheet 로 전환되므로 대부분 자동. 남은 점검: (a) 모바일 375 에서 Step 3 까지 필드가 모두 보이는지 (body overflow-y-auto) (b) DateTimePicker 의 select 가 모바일 터치 친화적인지 (c) [다음]/[이전]/[만들기] 버튼 48px 충족. Playwright 스모크 1~2 개 추가 검토.

**Test Strategy:**

No test strategy provided.
