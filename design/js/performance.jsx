
// ============================================================
// PERFORMANCE SCREENS
// ============================================================

const MOCK_PERFORMANCE_LIST = [
  {
    performanceId: 'pf1', title: '봄 정기공연 2026',
    startAt: '2026-04-30 18:00', durationMinutes: 180, venue: '홍익대학교 대강당',
    bandIds: ['b1', 'b2'], managerIds: ['김밴드'],
    practiceIds: ['p1', 'p2'], daysLeft: 8,
  },
  {
    performanceId: 'pf2', title: '인디 페스티벌',
    startAt: '2026-05-15 15:00', durationMinutes: 240, venue: '올림픽공원 야외광장',
    bandIds: ['b1'], managerIds: ['이기타'],
    practiceIds: ['p2'], daysLeft: 23,
  },
  {
    performanceId: 'pf3', title: '여름 버스킹',
    startAt: '2026-06-01 17:00', durationMinutes: 120, venue: '신촌 연세로',
    bandIds: ['b3'], managerIds: ['최베이스'],
    practiceIds: [], daysLeft: 40,
  },
];

// ── Performance List ──────────────────────────────────────────
function PerformanceListScreen({ navigate }) {
  const [filterTab, setFilterTab] = React.useState('all');
  const [selectedBand, setSelectedBand] = React.useState('all');

  const filtered = MOCK_PERFORMANCE_LIST.filter(pf => {
    if (filterTab === 'mine') return pf.bandIds.some(id => ['b1', 'b2'].includes(id));
    return true;
  });

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, position: 'relative', overflow: 'hidden' }}>
      <Header title="공연" />
      {/* Filter tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        {[['all', '전체 공연'], ['mine', '내 밴드 공연']].map(([id, label]) => (
          <button key={id} onClick={() => setFilterTab(id)} style={{
            flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: filterTab === id ? 700 : 500,
            color: filterTab === id ? C.accent : C.textMuted,
            borderBottom: filterTab === id ? `2px solid ${C.accent}` : '2px solid transparent',
            fontFamily: 'inherit',
          }}>{label}</button>
        ))}
      </div>

      {filterTab === 'mine' && (
        <div style={{ padding: '10px 16px', background: C.surface, borderBottom: `1px solid ${C.border}`, display: 'flex', gap: 8, overflowX: 'auto' }}>
          {[['all', '전체'], ['b1', '루나틱'], ['b2', '코드 크래셔']].map(([id, label]) => (
            <Chip key={id} label={label} selected={selectedBand === id} onClick={() => setSelectedBand(id)} small />
          ))}
        </div>
      )}

      <ScrollView style={{ padding: '12px 16px' }}>
        {filtered.map(pf => (
          <Card key={pf.performanceId} onClick={() => navigate('performanceDetail', { performanceId: pf.performanceId, isManager: pf.managerIds.includes('김밴드') })}>
            <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: C.amberDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="performance" size={20} color={C.amber} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{pf.title}</span>
                  {pf.daysLeft <= 7 && <Badge label={`D-${pf.daysLeft}`} color={C.danger} />}
                </div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Icon name="calendar" size={11} color={C.textMuted} />{pf.startAt}
                  </span>
                  <span style={{ fontSize: 11, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Icon name="location" size={11} color={C.textMuted} />{pf.venue}
                  </span>
                </div>
                <div style={{ fontSize: 11, color: C.textMuted, marginTop: 3 }}>소요 {pf.durationMinutes}분</div>
              </div>
            </div>
          </Card>
        ))}
        <div style={{ height: 80 }} />
      </ScrollView>
      <FAB onClick={() => navigate('performanceCreate')} label="공연 만들기" />
    </div>
  );
}

// ── Performance Detail ────────────────────────────────────────
function PerformanceDetailScreen({ navigate, params = {} }) {
  const { performanceId = 'pf1', isManager = true } = params;
  const init = MOCK_PERFORMANCE_LIST.find(p => p.performanceId === performanceId) || MOCK_PERFORMANCE_LIST[0];
  const [perf, setPerf] = React.useState(init);
  const [editSheet, setEditSheet] = React.useState(false);
  const [addPracticeSheet, setAddPracticeSheet] = React.useState(false);
  const [editTitle, setEditTitle] = React.useState('');
  const [editStartAt, setEditStartAt] = React.useState('');
  const [editDuration, setEditDuration] = React.useState('');
  const [editVenue, setEditVenue] = React.useState('');
  const [selected, setSelected] = React.useState([]);
  const [toast, setToast] = React.useState('');
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const bands = MOCK_BANDS.filter(b => perf.bandIds.includes(b.bandId));
  const practices = MOCK_PRACTICE_LIST.filter(p => perf.practiceIds.includes(p.practiceId));
  const availablePractices = MOCK_PRACTICE_LIST.filter(p => !perf.practiceIds.includes(p.practiceId));

  function saveEdit() {
    setPerf(p => ({ ...p, title: editTitle || p.title, startAt: editStartAt || p.startAt, durationMinutes: parseInt(editDuration) || p.durationMinutes, venue: editVenue || p.venue }));
    setEditSheet(false); showToast('공연 정보가 수정되었습니다.');
  }
  function removePractice(pid) {
    setPerf(p => ({ ...p, practiceIds: p.practiceIds.filter(id => id !== pid) }));
    showToast('합주가 제거되었습니다.');
  }
  function addPractices() {
    setPerf(p => ({ ...p, practiceIds: [...p.practiceIds, ...selected] }));
    setAddPracticeSheet(false); setSelected([]); showToast('합주가 연결되었습니다.');
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>
      <Header title={perf.title} onBack={() => navigate('performance')}
        rightActions={isManager ? [
          <button key="e" onClick={() => { setEditTitle(perf.title); setEditStartAt(perf.startAt); setEditDuration(String(perf.durationMinutes)); setEditVenue(perf.venue || ''); setEditSheet(true); }}
            style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icon name="edit" size={20} color={C.textSub} />
          </button>
        ] : null} />

      <ScrollView style={{ padding: '16px' }}>
        {/* Hero info */}
        <Card style={{ background: C.amberDim, border: `1px solid ${C.amber}33` }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: C.text, marginBottom: 10 }}>{perf.title}</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="calendar" size={15} color={C.amber} />
              <span style={{ fontSize: 13, color: C.text }}>{perf.startAt}</span>
              <Badge label={`${perf.durationMinutes}분`} color={C.amber} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <Icon name="location" size={15} color={C.amber} />
              <span style={{ fontSize: 13, color: C.text }}>{perf.venue}</span>
            </div>
          </div>
          {perf.daysLeft <= 7 && <div style={{ marginTop: 10 }}><Badge label={`D-${perf.daysLeft}`} color={C.danger} /></div>}
        </Card>

        {/* Participating Bands */}
        <div style={{ marginTop: 10 }}>
          <SectionTitle>참여 밴드</SectionTitle>
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', paddingBottom: 4 }}>
            {bands.map(b => (
              <div key={b.bandId} style={{ display: 'flex', alignItems: 'center', gap: 8, background: C.card, borderRadius: 20, padding: '8px 14px', border: `1px solid ${C.border}`, flexShrink: 0, cursor: 'pointer' }}
                onClick={() => navigate('bandDetail', { bandId: b.bandId, myRole: b.role })}>
                <div style={{ width: 24, height: 24, borderRadius: 6, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="music" size={12} color={C.accent} />
                </div>
                <span style={{ fontSize: 13, fontWeight: 600, color: C.text }}>{b.bandName}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Practices */}
        <div style={{ marginTop: 14 }}>
          <SectionTitle action={isManager && (
            <button onClick={() => setAddPracticeSheet(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.accent, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}>
              <Icon name="plus" size={14} color={C.accent} />합주 연결
            </button>
          )}>연결된 합주</SectionTitle>
          {practices.length === 0
            ? <EmptyState icon="practice" title="연결된 합주가 없습니다" sub="합주를 연결하거나 새로 추가하세요." />
            : practices.map(p => (
              <Card key={p.practiceId} onClick={() => navigate('practiceDetail', { practiceId: p.practiceId })}>
                <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                  <div style={{ width: 36, height: 36, borderRadius: 8, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <Icon name="music" size={16} color={C.accent} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.song.title}</div>
                    <div style={{ fontSize: 12, color: C.textMuted }}>{p.song.artist} · {p.startAt}</div>
                  </div>
                  {isManager && (
                    <button onClick={e => { e.stopPropagation(); removePractice(p.practiceId); }}
                      style={{ background: C.dangerDim, border: `1px solid ${C.danger}33`, borderRadius: 8, padding: '6px 8px', cursor: 'pointer' }}>
                      <Icon name="trash" size={14} color={C.danger} />
                    </button>
                  )}
                </div>
              </Card>
            ))
          }
          {isManager && (
            <button onClick={() => navigate('practiceCreate', { forPerformance: true })}
              style={{ width: '100%', background: 'none', border: `1.5px dashed ${C.border}`, borderRadius: 14, padding: '14px', cursor: 'pointer', fontSize: 13, color: C.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit', marginTop: 4 }}>
              <Icon name="plus" size={15} color={C.textMuted} />신규 합주 생성 후 연결
            </button>
          )}
        </div>

        {/* Managers */}
        <div style={{ marginTop: 14 }}>
          <SectionTitle>매니저</SectionTitle>
          {perf.managerIds.map(mid => (
            <Card key={mid} style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={mid} size={34} />
                <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{mid}</span>
                <Badge label="매니저" color={C.amber} />
              </div>
            </Card>
          ))}
        </div>
        <div style={{ height: 20 }} />
      </ScrollView>

      {/* Edit BottomSheet */}
      <BottomSheet visible={editSheet} onClose={() => setEditSheet(false)} title="공연 수정">
        <Input label="공연 제목" value={editTitle} onChange={setEditTitle} />
        <Input label="시작 일시" value={editStartAt} onChange={setEditStartAt} placeholder="yyyy-MM-dd HH:mm" />
        <Input label="소요 시간 (분)" type="number" value={editDuration} onChange={setEditDuration} />
        <Input label="장소" value={editVenue} onChange={setEditVenue} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Btn label="취소" variant="secondary" onClick={() => setEditSheet(false)} />
          <Btn label="저장" onClick={saveEdit} />
        </div>
      </BottomSheet>

      {/* Add Practice BottomSheet */}
      <BottomSheet visible={addPracticeSheet} onClose={() => setAddPracticeSheet(false)} title="합주 선택">
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>이 공연에 연결할 합주를 선택하세요.</div>
        {availablePractices.length === 0
          ? <EmptyState icon="practice" title="선택 가능한 합주가 없습니다" />
          : availablePractices.map(p => {
            const sel = selected.includes(p.practiceId);
            return (
              <div key={p.practiceId} onClick={() => setSelected(s => sel ? s.filter(id => id !== p.practiceId) : [...s, p.practiceId])}
                style={{ display: 'flex', gap: 12, padding: '12px 4px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', alignItems: 'center' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${sel ? C.accent : C.border}`, background: sel ? C.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {sel && <Icon name="check" size={13} color="#fff" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{p.song.title}</div>
                  <div style={{ fontSize: 12, color: C.textMuted }}>{p.song.artist} · {p.startAt}</div>
                </div>
              </div>
            );
          })
        }
        <div style={{ marginTop: 16 }}>
          <Btn label={`추가하기${selected.length > 0 ? ` (${selected.length})` : ''}`} onClick={addPractices} disabled={selected.length === 0} />
        </div>
      </BottomSheet>

      <Toast message={toast} visible={!!toast} type="success" />
    </div>
  );
}

// ── Performance Create ────────────────────────────────────────
function PerformanceCreateScreen({ navigate }) {
  const [title, setTitle] = React.useState('');
  const [startAt, setStartAt] = React.useState('');
  const [duration, setDuration] = React.useState('120');
  const [venue, setVenue] = React.useState('');
  const [selectedBands, setSelectedBands] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [errors, setErrors] = React.useState({});

  const myBands = MOCK_BANDS;

  function toggleBand(id) {
    setSelectedBands(prev => prev.includes(id) ? prev.filter(b => b !== id) : [...prev, id]);
  }

  function handleCreate() {
    const e = {};
    if (!title.trim()) e.title = '공연 제목을 입력해주세요.';
    if (!startAt.trim()) e.startAt = '시작 일시를 입력해주세요.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('performance'); }, 1200);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Header title="공연 만들기" onBack={() => navigate('performance')} />
      <ScrollView style={{ padding: '24px 20px' }}>
        <Input label="공연 제목" value={title} onChange={setTitle} placeholder="공연 제목 입력" error={errors.title} />
        <Input label="시작 일시" value={startAt} onChange={setStartAt} placeholder="2026-05-01 18:00" error={errors.startAt} />
        <div style={{ marginBottom: 16 }}>
          <Input label="소요 시간 (분)" type="number" value={duration} onChange={setDuration} placeholder="120" />
          <input type="range" min={30} max={480} step={30} value={parseInt(duration) || 120}
            onChange={e => setDuration(String(e.target.value))}
            style={{ width: '100%', accentColor: C.accent, marginTop: -4 }} />
        </div>
        <Input label="장소 (선택)" value={venue} onChange={setVenue} placeholder="공연 장소 입력" />

        {/* Band selection */}
        <div style={{ marginBottom: 20 }}>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 10, fontWeight: 600 }}>참여 밴드 (선택)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {myBands.map(b => {
              const sel = selectedBands.includes(b.bandId);
              return (
                <div key={b.bandId} onClick={() => toggleBand(b.bandId)} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  background: sel ? C.accentDim : C.card,
                  border: `1.5px solid ${sel ? C.accent : C.border}`,
                  borderRadius: 20, padding: '8px 14px', cursor: 'pointer',
                }}>
                  {sel && <Icon name="check" size={14} color={C.accent} />}
                  <span style={{ fontSize: 13, fontWeight: 600, color: sel ? C.accent : C.textSub }}>{b.bandName}</span>
                </div>
              );
            })}
          </div>
        </div>

        <Btn label="공연 만들기" onClick={handleCreate} loading={loading} disabled={!title.trim() || !startAt.trim()} />
      </ScrollView>
    </div>
  );
}

Object.assign(window, { PerformanceListScreen, PerformanceDetailScreen, PerformanceCreateScreen, MOCK_PERFORMANCE_LIST });
