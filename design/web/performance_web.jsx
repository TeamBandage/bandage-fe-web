
// ============================================================
// WEB — PERFORMANCE SCREENS
// ============================================================
const W_PERFORMANCES = [
  {
    performanceId: 'pf1', title: '봄 정기공연 2026',
    startAt: '2026-04-30 18:00', durationMinutes: 180, venue: '홍익대학교 대강당',
    bandIds: ['b1', 'b2'], managerIds: ['김밴드'], practiceIds: ['p1', 'p2'], daysLeft: 8,
  },
  {
    performanceId: 'pf2', title: '인디 페스티벌',
    startAt: '2026-05-15 15:00', durationMinutes: 240, venue: '올림픽공원 야외광장',
    bandIds: ['b1'], managerIds: ['이기타'], practiceIds: ['p2'], daysLeft: 23,
  },
  {
    performanceId: 'pf3', title: '여름 버스킹',
    startAt: '2026-06-01 17:00', durationMinutes: 120, venue: '신촌 연세로',
    bandIds: ['b3'], managerIds: ['최베이스'], practiceIds: [], daysLeft: 40,
  },
];

function WPerformanceListScreen({ navigate }) {
  const [selected, setSelected] = React.useState(null);
  const [perf, setPerf] = React.useState(null);
  const [filterTab, setFilterTab] = React.useState('all');
  const [createModal, setCreateModal] = React.useState(false);
  const [editModal, setEditModal] = React.useState(false);
  const [addPracticeModal, setAddPracticeModal] = React.useState(false);
  const [selectedPractices, setSelectedPractices] = React.useState([]);
  const [toast, setToast] = React.useState('');
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  // Create form
  const [cfTitle, setCfTitle] = React.useState('');
  const [cfDate, setCfDate] = React.useState('');
  const [cfDuration, setCfDuration] = React.useState('120');
  const [cfVenue, setCfVenue] = React.useState('');
  const [cfBands, setCfBands] = React.useState([]);
  const [cfCreating, setCfCreating] = React.useState(false);

  // Edit form
  const [eTitle, setETitle] = React.useState('');
  const [eDate, setEDate] = React.useState('');
  const [eDuration, setEDuration] = React.useState('');
  const [eVenue, setEVenue] = React.useState('');
  const [eSaving, setESaving] = React.useState(false);

  const filtered = W_PERFORMANCES.filter(p => filterTab === 'mine' ? p.bandIds.some(id => ['b1', 'b2'].includes(id)) : true);
  const bands = W_BAND_LIST || [
    { bandId: 'b1', bandName: '루나틱' }, { bandId: 'b2', bandName: '코드 크래셔' }, { bandId: 'b3', bandName: '마그마' },
  ];
  const practices = W_PRACTICES || [];
  const isManager = perf?.managerIds?.includes('김밴드');

  function selectPerf(id) {
    setSelected(id);
    setPerf(JSON.parse(JSON.stringify(W_PERFORMANCES.find(p => p.performanceId === id))));
  }

  function removePractice(pid) {
    setPerf(p => ({ ...p, practiceIds: p.practiceIds.filter(id => id !== pid) }));
    showToast('합주가 제거되었습니다.');
  }

  function addPractices() {
    setPerf(p => ({ ...p, practiceIds: [...p.practiceIds, ...selectedPractices] }));
    setAddPracticeModal(false); setSelectedPractices([]); showToast('합주가 연결되었습니다.');
  }

  function saveEdit() {
    setESaving(true);
    setTimeout(() => {
      setPerf(p => ({ ...p, title: eTitle || p.title, startAt: eDate || p.startAt, durationMinutes: parseInt(eDuration) || p.durationMinutes, venue: eVenue || p.venue }));
      setESaving(false); setEditModal(false); showToast('공연 정보가 수정되었습니다.');
    }, 800);
  }

  const perfPractices = perf ? practices.filter(p => perf.practiceIds.includes(p.practiceId)) : [];
  const availPractices = perf ? practices.filter(p => !perf.practiceIds.includes(p.practiceId)) : [];

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: WC.bg }}>
      {/* List panel */}
      <div style={{ width: 340, borderRight: `1px solid ${WC.border}`, display: 'flex', flexDirection: 'column', background: WC.surface, flexShrink: 0 }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${WC.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: WC.text }}>공연</span>
          <WBtn label="공연 만들기" icon="plus" small onClick={() => setCreateModal(true)} />
        </div>
        <div style={{ display: 'flex', borderBottom: `1px solid ${WC.border}` }}>
          {[['all', '전체'], ['mine', '내 밴드']].map(([id, label]) => (
            <button key={id} onClick={() => setFilterTab(id)} style={{ flex: 1, padding: '10px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: filterTab === id ? 700 : 400, color: filterTab === id ? WC.accent : WC.textMuted, borderBottom: filterTab === id ? `2px solid ${WC.accent}` : '2px solid transparent', fontFamily: 'inherit' }}>{label}</button>
          ))}
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          {filtered.map(p => (
            <div key={p.performanceId} onClick={() => selectPerf(p.performanceId)}
              style={{ padding: '12px', borderRadius: 12, cursor: 'pointer', marginBottom: 4, background: selected === p.performanceId ? WC.amberDim : 'transparent', border: `1px solid ${selected === p.performanceId ? WC.amber + '44' : 'transparent'}`, transition: 'background 0.15s' }}>
              <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: WC.amberDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <WIcon name="performance" size={16} color={WC.amber} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: WC.text }}>{p.title}</span>
                    {p.daysLeft <= 7 && <WBadge label={`D-${p.daysLeft}`} color={WC.danger} />}
                  </div>
                  <div style={{ fontSize: 11, color: WC.textMuted }}>{p.startAt}</div>
                  <div style={{ fontSize: 11, color: WC.textMuted }}>{p.venue}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {!perf ? (
          <WEmptyState icon="performance" title="공연을 선택하세요" sub="왼쪽 목록에서 공연을 선택하면 상세 정보를 볼 수 있습니다." />
        ) : (
          <>
            <WTopBar title={perf.title} breadcrumb="공연"
              actions={isManager ? [
                <WBtn key="edit" label="공연 수정" variant="secondary" icon="edit" small onClick={() => { setETitle(perf.title); setEDate(perf.startAt); setEDuration(String(perf.durationMinutes)); setEVenue(perf.venue || ''); setEditModal(true); }} />,
              ] : []} />

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              {/* Hero */}
              <div style={{ background: WC.amberDim, border: `1px solid ${WC.amber}33`, borderRadius: 16, padding: '24px 28px', marginBottom: 20 }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: WC.text, marginBottom: 12 }}>{perf.title}</div>
                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <WIcon name="calendar" size={16} color={WC.amber} />
                        <span style={{ fontSize: 14, color: WC.text }}>{perf.startAt}</span>
                        <WBadge label={`${perf.durationMinutes}분`} color={WC.amber} />
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <WIcon name="location" size={16} color={WC.amber} />
                        <span style={{ fontSize: 14, color: WC.text }}>{perf.venue}</span>
                      </div>
                    </div>
                  </div>
                  {perf.daysLeft <= 7 && <WBadge label={`D-${perf.daysLeft}`} color={WC.danger} />}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Bands + Managers */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <WCard>
                    <WSectionTitle>참여 밴드</WSectionTitle>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {perf.bandIds.map(bid => {
                        const band = bands.find(b => b.bandId === bid);
                        return band ? (
                          <div key={bid} style={{ display: 'flex', alignItems: 'center', gap: 8, background: WC.surface, borderRadius: 20, padding: '7px 14px', border: `1px solid ${WC.border}`, cursor: 'pointer' }}>
                            <div style={{ width: 22, height: 22, borderRadius: 6, background: WC.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                              <WIcon name="music" size={11} color={WC.accent} />
                            </div>
                            <span style={{ fontSize: 13, fontWeight: 600, color: WC.text }}>{band.bandName}</span>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </WCard>
                  <WCard>
                    <WSectionTitle>매니저</WSectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      {perf.managerIds.map(mid => (
                        <div key={mid} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <WAvatar name={mid} size={32} />
                          <span style={{ fontSize: 13, color: WC.text, fontWeight: 500 }}>{mid}</span>
                          <WBadge label="매니저" color={WC.amber} />
                        </div>
                      ))}
                    </div>
                  </WCard>
                </div>

                {/* Practices */}
                <WCard>
                  <WSectionTitle action={isManager && (
                    <WBtn label="합주 연결" icon="plus" small onClick={() => setAddPracticeModal(true)} />
                  )}>연결된 합주</WSectionTitle>
                  {perfPractices.length === 0
                    ? <WEmptyState icon="practice" title="연결된 합주 없음" sub="합주를 연결하세요." />
                    : perfPractices.map(p => (
                      <div key={p.practiceId} style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 12px', background: WC.surface, borderRadius: 10, border: `1px solid ${WC.border}`, marginBottom: 8, cursor: 'pointer' }}>
                        <div style={{ width: 32, height: 32, borderRadius: 8, background: WC.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <WIcon name="music" size={14} color={WC.accent} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 600, color: WC.text }}>{p.song.title}</div>
                          <div style={{ fontSize: 11, color: WC.textMuted }}>{p.song.artist} · {p.startAt}</div>
                        </div>
                        {isManager && (
                          <button onClick={() => removePractice(p.practiceId)} style={{ background: WC.dangerDim, border: `1px solid ${WC.danger}33`, borderRadius: 8, padding: '5px 8px', cursor: 'pointer' }}>
                            <WIcon name="trash" size={13} color={WC.danger} />
                          </button>
                        )}
                      </div>
                    ))
                  }
                  {isManager && (
                    <button onClick={() => {}} style={{ width: '100%', background: 'none', border: `1.5px dashed ${WC.border}`, borderRadius: 10, padding: '12px', cursor: 'pointer', fontSize: 13, color: WC.textMuted, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, fontFamily: 'inherit', marginTop: 4 }}>
                      <WIcon name="plus" size={14} color={WC.textMuted} />신규 합주 생성 후 연결
                    </button>
                  )}
                </WCard>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Create Modal */}
      <WModal visible={createModal} onClose={() => setCreateModal(false)} title="공연 만들기" width={500}>
        <WInput label="공연 제목 *" value={cfTitle} onChange={setCfTitle} placeholder="공연 제목 입력" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <WInput label="시작 일시 *" value={cfDate} onChange={setCfDate} placeholder="2026-05-01 18:00" />
          <WInput label="소요 시간 (분)" type="number" value={cfDuration} onChange={setCfDuration} />
        </div>
        <WInput label="장소 (선택)" value={cfVenue} onChange={setCfVenue} placeholder="공연 장소 입력" />
        <div style={{ marginBottom: 18 }}>
          <div style={{ fontSize: 12, color: WC.textSub, marginBottom: 8, fontWeight: 600 }}>참여 밴드 (선택)</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {bands.slice(0,3).map(b => {
              const sel = cfBands.includes(b.bandId);
              return (
                <div key={b.bandId} onClick={() => setCfBands(p => sel ? p.filter(id => id !== b.bandId) : [...p, b.bandId])}
                  style={{ display: 'flex', alignItems: 'center', gap: 6, background: sel ? WC.accentDim : WC.card, border: `1.5px solid ${sel ? WC.accent : WC.border}`, borderRadius: 20, padding: '7px 14px', cursor: 'pointer' }}>
                  {sel && <WIcon name="check" size={13} color={WC.accent} />}
                  <span style={{ fontSize: 13, fontWeight: 600, color: sel ? WC.accent : WC.textSub }}>{b.bandName}</span>
                </div>
              );
            })}
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <WBtn label="취소" variant="secondary" onClick={() => setCreateModal(false)} fullWidth />
          <WBtn label="공연 만들기" onClick={() => { setCfCreating(true); setTimeout(() => { setCfCreating(false); setCreateModal(false); showToast('공연이 생성되었습니다.'); }, 1000); }} loading={cfCreating} disabled={!cfTitle || !cfDate} fullWidth />
        </div>
      </WModal>

      {/* Edit Modal */}
      <WModal visible={editModal} onClose={() => setEditModal(false)} title="공연 수정" width={480}>
        <WInput label="공연 제목" value={eTitle} onChange={setETitle} />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
          <WInput label="시작 일시" value={eDate} onChange={setEDate} />
          <WInput label="소요 시간 (분)" type="number" value={eDuration} onChange={setEDuration} />
        </div>
        <WInput label="장소" value={eVenue} onChange={setEVenue} />
        <div style={{ display: 'flex', gap: 10 }}>
          <WBtn label="취소" variant="secondary" onClick={() => setEditModal(false)} fullWidth />
          <WBtn label="저장" onClick={saveEdit} loading={eSaving} fullWidth />
        </div>
      </WModal>

      {/* Add Practice Modal */}
      <WModal visible={addPracticeModal} onClose={() => setAddPracticeModal(false)} title="합주 선택" width={460}>
        <div style={{ fontSize: 13, color: WC.textMuted, marginBottom: 14 }}>이 공연에 연결할 합주를 선택하세요.</div>
        {availPractices.length === 0
          ? <WEmptyState icon="practice" title="선택 가능한 합주가 없습니다" />
          : availPractices.map(p => {
            const sel = selectedPractices.includes(p.practiceId);
            return (
              <div key={p.practiceId} onClick={() => setSelectedPractices(s => sel ? s.filter(id => id !== p.practiceId) : [...s, p.practiceId])}
                style={{ display: 'flex', gap: 12, padding: '12px', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${sel ? WC.accent : WC.border}`, background: sel ? WC.accentDim : WC.card, marginBottom: 8, alignItems: 'center' }}>
                <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${sel ? WC.accent : WC.border}`, background: sel ? WC.accent : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {sel && <WIcon name="check" size={13} color="#fff" />}
                </div>
                <div>
                  <div style={{ fontSize: 14, fontWeight: 600, color: WC.text }}>{p.song.title}</div>
                  <div style={{ fontSize: 12, color: WC.textMuted }}>{p.song.artist} · {p.startAt}</div>
                </div>
              </div>
            );
          })
        }
        <div style={{ marginTop: 14 }}>
          <WBtn label={`추가하기${selectedPractices.length > 0 ? ` (${selectedPractices.length})` : ''}`} onClick={addPractices} disabled={selectedPractices.length === 0} fullWidth />
        </div>
      </WModal>

      <WToast message={toast} visible={!!toast} type="success" />
    </div>
  );
}

Object.assign(window, { WPerformanceListScreen, W_PERFORMANCES });
