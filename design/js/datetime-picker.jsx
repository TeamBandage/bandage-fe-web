// ============================================================
// DateTimePicker — 좌측 캘린더 + 우측 시:분 휠 (데스크톱 친화)
// 사용: <DateTimePicker value="2026-04-25 19:00" onChange={v => ...} label="시작 일시" minDate="today" />
// 값 형식: "yyyy-MM-dd HH:mm"
// ============================================================

const DTP_C = {
  bg: '#13131E',
  surface: '#1A1A28',
  card: '#1F1F30',
  border: '#25253A',
  borderHi: '#35354A',
  text: '#F0EFF8',
  textSub: '#8A8AA8',
  textMuted: '#4A4A62',
  accent: 'oklch(0.62 0.22 250)',
  accentDim: 'oklch(0.62 0.22 250 / 0.18)',
  accentSoft: 'oklch(0.62 0.22 250 / 0.08)',
  danger: 'oklch(0.62 0.22 25)',
};

// ── 유틸 ──────────────────────────────────────────────────────
function dtpPad(n) { return String(n).padStart(2, '0'); }
function dtpToday() { const d = new Date(); d.setHours(0,0,0,0); return d; }
function dtpParse(s) {
  if (!s) return null;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}):(\d{2}))?/);
  if (!m) return null;
  return { y: +m[1], mo: +m[2], d: +m[3], h: m[4] ? +m[4] : 19, mi: m[5] ? +m[5] : 0 };
}
function dtpFormat(p) {
  if (!p) return '';
  return `${p.y}-${dtpPad(p.mo)}-${dtpPad(p.d)} ${dtpPad(p.h)}:${dtpPad(p.mi)}`;
}
function dtpFormatDisplay(p) {
  if (!p) return '';
  const date = new Date(p.y, p.mo-1, p.d);
  const dow = ['일','월','화','수','목','금','토'][date.getDay()];
  return `${p.y}.${dtpPad(p.mo)}.${dtpPad(p.d)} (${dow}) ${dtpPad(p.h)}:${dtpPad(p.mi)}`;
}
function dtpSameDay(a, b) {
  return a && b && a.y===b.y && a.mo===b.mo && a.d===b.d;
}
function dtpDateLT(a, b) { // a < b (date only)
  if (a.y !== b.y) return a.y < b.y;
  if (a.mo !== b.mo) return a.mo < b.mo;
  return a.d < b.d;
}

// ── 캘린더 그리드 ─────────────────────────────────────────────
function DTPCalendar({ viewYear, viewMonth, selected, onPickDate, minDate, onNav }) {
  const firstDow = new Date(viewYear, viewMonth-1, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7) cells.push(null);

  const today = dtpToday();
  const todayP = { y: today.getFullYear(), mo: today.getMonth()+1, d: today.getDate() };
  const monthName = `${viewYear}년 ${viewMonth}월`;
  const dows = ['일','월','화','수','목','금','토'];

  return (
    <div style={{ flex: 1, padding: '20px 22px', borderRight: `1px solid ${DTP_C.border}` }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button onClick={() => onNav(-1)} style={dtpNavBtn}>‹</button>
        <div style={{ fontSize: 15, fontWeight: 700, color: DTP_C.text }}>{monthName}</div>
        <button onClick={() => onNav(1)} style={dtpNavBtn}>›</button>
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2, marginBottom: 6 }}>
        {dows.map((d, i) => (
          <div key={d} style={{
            fontSize: 11, fontWeight: 600, textAlign: 'center', padding: '6px 0',
            color: i === 0 ? '#E55' : i === 6 ? '#5AA' : DTP_C.textMuted,
          }}>{d}</div>
        ))}
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 2 }}>
        {cells.map((d, idx) => {
          if (d === null) return <div key={idx} style={{ aspectRatio: '1' }} />;
          const cellP = { y: viewYear, mo: viewMonth, d };
          const isSel = selected && dtpSameDay(cellP, selected);
          const isToday = dtpSameDay(cellP, todayP);
          const isPast = minDate && dtpDateLT(cellP, minDate);
          const dow = (firstDow + d - 1) % 7;
          let color = DTP_C.text;
          if (dow === 0) color = '#E66';
          if (dow === 6) color = '#6BB';
          if (isPast) color = DTP_C.textMuted;
          return (
            <button key={idx} disabled={isPast} onClick={() => onPickDate(cellP)}
              style={{
                aspectRatio: '1', borderRadius: 8, border: 'none', cursor: isPast ? 'not-allowed' : 'pointer',
                background: isSel ? DTP_C.accent : isToday ? DTP_C.accentSoft : 'transparent',
                color: isSel ? '#fff' : color,
                fontSize: 13, fontWeight: isSel || isToday ? 700 : 500,
                opacity: isPast ? 0.35 : 1,
                transition: 'background 0.12s',
                position: 'relative',
              }}>
              {d}
              {isToday && !isSel && (
                <div style={{ position: 'absolute', bottom: 4, left: '50%', transform: 'translateX(-50%)',
                  width: 4, height: 4, borderRadius: '50%', background: DTP_C.accent }} />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}

const dtpNavBtn = {
  width: 28, height: 28, borderRadius: 8, border: `1px solid ${DTP_C.border}`,
  background: DTP_C.card, color: DTP_C.text, cursor: 'pointer', fontSize: 16, lineHeight: 1,
};

// ── iOS 스타일 휠 (시:분 분리) ────────────────────────────────
function DTPWheel({ values, value, onChange, label }) {
  const ref = React.useRef(null);
  const ITEM_H = 32;
  const idx = values.indexOf(value);

  React.useEffect(() => {
    if (ref.current && idx >= 0) {
      ref.current.scrollTop = idx * ITEM_H;
    }
  }, [idx]);

  function onScroll(e) {
    const i = Math.round(e.target.scrollTop / ITEM_H);
    const v = values[Math.max(0, Math.min(values.length-1, i))];
    if (v !== undefined && v !== value) onChange(v);
  }

  return (
    <div style={{ flex: 1, position: 'relative' }}>
      <div style={{ fontSize: 11, fontWeight: 600, color: DTP_C.textMuted, textAlign: 'center', marginBottom: 6 }}>{label}</div>
      <div style={{ position: 'relative', height: ITEM_H * 5, overflow: 'hidden', borderRadius: 10, background: DTP_C.card, border: `1px solid ${DTP_C.border}` }}>
        {/* 중앙 하이라이트 밴드 */}
        <div style={{
          position: 'absolute', left: 0, right: 0, top: ITEM_H * 2, height: ITEM_H,
          background: DTP_C.accentDim, borderTop: `1px solid ${DTP_C.accent}`, borderBottom: `1px solid ${DTP_C.accent}`,
          pointerEvents: 'none', zIndex: 1,
        }} />
        <div ref={ref} onScroll={onScroll}
          style={{
            height: '100%', overflowY: 'scroll', scrollSnapType: 'y mandatory',
            paddingTop: ITEM_H * 2, paddingBottom: ITEM_H * 2,
            scrollbarWidth: 'none', msOverflowStyle: 'none',
          }}>
          {values.map(v => (
            <div key={v} style={{
              height: ITEM_H, display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 16, fontWeight: 600, scrollSnapAlign: 'center',
              color: v === value ? DTP_C.accent : DTP_C.textSub,
            }}>{dtpPad(v)}</div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── 빠른 선택 칩 ──────────────────────────────────────────────
function DTPQuickChip({ label, onClick, active }) {
  return (
    <button onClick={onClick} style={{
      padding: '6px 12px', borderRadius: 999,
      border: `1px solid ${active ? DTP_C.accent : DTP_C.border}`,
      background: active ? DTP_C.accentDim : 'transparent',
      color: active ? DTP_C.accent : DTP_C.textSub,
      fontSize: 12, fontWeight: 600, cursor: 'pointer',
    }}>{label}</button>
  );
}

// ── 메인 DateTimePicker ───────────────────────────────────────
function DateTimePicker({ value, onChange, label, placeholder = '날짜와 시간 선택', futureOnly = true, showDuration, durationValue, onDurationChange }) {
  const [open, setOpen] = React.useState(false);
  const parsed = dtpParse(value);
  const today = dtpToday();
  const todayP = { y: today.getFullYear(), mo: today.getMonth()+1, d: today.getDate() };
  const minDate = futureOnly ? todayP : null;

  const initial = parsed || { ...todayP, h: 19, mi: 0 };
  const [draft, setDraft] = React.useState(initial);
  const [view, setView] = React.useState({ y: initial.y, mo: initial.mo });

  React.useEffect(() => {
    if (open) {
      const init = dtpParse(value) || { ...todayP, h: 19, mi: 0 };
      setDraft(init);
      setView({ y: init.y, mo: init.mo });
    }
  }, [open]);

  function nav(dir) {
    let { y, mo } = view;
    mo += dir;
    if (mo > 12) { mo = 1; y++; }
    if (mo < 1) { mo = 12; y--; }
    setView({ y, mo });
  }

  function quickDay(offset) {
    const d = new Date();
    d.setDate(d.getDate() + offset);
    const p = { y: d.getFullYear(), mo: d.getMonth()+1, d: d.getDate(), h: draft.h, mi: draft.mi };
    setDraft(p);
    setView({ y: p.y, mo: p.mo });
  }

  function confirm() {
    onChange(dtpFormat(draft));
    setOpen(false);
  }

  const hours = Array.from({length: 24}, (_, i) => i);
  const mins = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];
  const closestMin = mins.reduce((a,b) => Math.abs(b-draft.mi) < Math.abs(a-draft.mi) ? b : a, mins[0]);

  const isQuickToday = dtpSameDay(draft, todayP);
  const tomorrow = new Date(); tomorrow.setDate(tomorrow.getDate()+1);
  const tomorrowP = { y: tomorrow.getFullYear(), mo: tomorrow.getMonth()+1, d: tomorrow.getDate() };
  const isQuickTomorrow = dtpSameDay(draft, tomorrowP);
  const nextWeek = new Date(); nextWeek.setDate(nextWeek.getDate()+7);
  const nextWeekP = { y: nextWeek.getFullYear(), mo: nextWeek.getMonth()+1, d: nextWeek.getDate() };
  const isQuickNextWeek = dtpSameDay(draft, nextWeekP);

  return (
    <div style={{ position: 'relative' }}>
      {label && <div style={{ fontSize: 12, fontWeight: 600, color: DTP_C.textSub, marginBottom: 6 }}>{label}</div>}
      <button onClick={() => setOpen(true)} style={{
        width: '100%', padding: '11px 14px', textAlign: 'left',
        background: DTP_C.card, border: `1.5px solid ${DTP_C.border}`, borderRadius: 10,
        color: parsed ? DTP_C.text : DTP_C.textMuted, fontSize: 14, fontWeight: parsed ? 600 : 400, cursor: 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span>{parsed ? dtpFormatDisplay(parsed) : placeholder}</span>
        <span style={{ fontSize: 16, color: DTP_C.textMuted }}>📅</span>
      </button>

      {open && (
        <>
          <div onClick={() => setOpen(false)} style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)', zIndex: 1000,
          }} />
          <div style={{
            position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)',
            background: DTP_C.bg, border: `1px solid ${DTP_C.border}`, borderRadius: 16,
            boxShadow: '0 20px 60px rgba(0,0,0,0.5)', zIndex: 1001,
            width: 620, maxWidth: 'calc(100vw - 40px)',
            display: 'flex', flexDirection: 'column',
          }}>
            {/* 빠른 선택 칩 */}
            <div style={{ display: 'flex', gap: 8, padding: '14px 20px', borderBottom: `1px solid ${DTP_C.border}`, flexWrap: 'wrap' }}>
              <DTPQuickChip label="오늘" active={isQuickToday} onClick={() => quickDay(0)} />
              <DTPQuickChip label="내일" active={isQuickTomorrow} onClick={() => quickDay(1)} />
              <DTPQuickChip label="다음 주" active={isQuickNextWeek} onClick={() => quickDay(7)} />
            </div>

            {/* 캘린더 + 시간 휠 */}
            <div style={{ display: 'flex', minHeight: 320 }}>
              <DTPCalendar viewYear={view.y} viewMonth={view.mo} selected={draft}
                minDate={minDate} onNav={nav}
                onPickDate={p => setDraft({ ...draft, ...p })} />
              <div style={{ width: 240, padding: '20px 18px', display: 'flex', flexDirection: 'column' }}>
                <div style={{ fontSize: 11, fontWeight: 600, color: DTP_C.textMuted, marginBottom: 12, textAlign: 'center', textTransform: 'uppercase', letterSpacing: 0.8 }}>
                  시간 선택
                </div>
                <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
                  <DTPWheel label="시" values={hours} value={draft.h} onChange={h => setDraft({ ...draft, h })} />
                  <div style={{ paddingBottom: 50, fontSize: 18, fontWeight: 700, color: DTP_C.textSub }}>:</div>
                  <DTPWheel label="분" values={mins} value={closestMin} onChange={mi => setDraft({ ...draft, mi })} />
                </div>
              </div>
            </div>

            {/* 푸터 */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', borderTop: `1px solid ${DTP_C.border}`, background: DTP_C.surface }}>
              <div style={{ fontSize: 13, color: DTP_C.text, fontWeight: 600 }}>
                {dtpFormatDisplay(draft)}
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={() => setOpen(false)} style={{
                  padding: '8px 16px', borderRadius: 8, border: `1px solid ${DTP_C.border}`,
                  background: 'transparent', color: DTP_C.textSub, fontSize: 13, fontWeight: 600, cursor: 'pointer',
                }}>취소</button>
                <button onClick={confirm} style={{
                  padding: '8px 18px', borderRadius: 8, border: 'none',
                  background: DTP_C.accent, color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                }}>확인</button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// 글로벌 노출
window.DateTimePicker = DateTimePicker;
