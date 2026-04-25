
// ============================================================
// PRACTICE SCREENS
// ============================================================

const SESSION_TYPES = [
  { type: 'Vocal', icon: 'mic' },
  { type: 'Chorus', icon: 'mic' },
  { type: 'Guitar', icon: 'music' },
  { type: 'Bass', icon: 'music' },
  { type: 'Drum', icon: 'drum' },
  { type: 'Percussion', icon: 'drum' },
  { type: 'Synth', icon: 'music' },
  { type: 'Session', icon: 'star' },
];

const MOCK_PRACTICE_LIST = [
  {
    practiceId: 'p1', title: '정기 합주 #12',
    song: { title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera' },
    startAt: '2026-04-25 19:00', durationMinutes: 120, venue: '홍대 연습실 A',
    sessions: [
      { sessionId: 's1', label: 'Guitar 1', type: 'Guitar', participant: '이기타' },
      { sessionId: 's2', label: 'Guitar 2', type: 'Guitar', participant: null },
      { sessionId: 's3', label: 'Vocal', type: 'Vocal', participant: '정보컬' },
      { sessionId: 's4', label: 'Bass', type: 'Bass', participant: '최베이스' },
      { sessionId: 's5', label: 'Drum', type: 'Drum', participant: null },
    ],
    participants: [
      { participantId: 'pp1', memberId: '이기타' },
      { participantId: 'pp2', memberId: '정보컬' },
      { participantId: 'pp3', memberId: '최베이스' },
    ],
    refLink: 'https://youtu.be/fJ9rUzIMcZQ',
    status: '예정',
  },
  {
    practiceId: 'p2', title: '합주',
    song: { title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV' },
    startAt: '2026-04-27 18:00', durationMinutes: 90, venue: null,
    sessions: [
      { sessionId: 's6', label: 'Guitar', type: 'Guitar', participant: '이기타' },
      { sessionId: 's7', label: 'Vocal', type: 'Vocal', participant: null },
    ],
    participants: [{ participantId: 'pp4', memberId: '이기타' }],
    refLink: null,
    status: '예정',
  },
];

// ── Practice List ─────────────────────────────────────────────
function PracticeListScreen({ navigate }) {
  const statusColor = { '예정': C.accent, '진행 중': C.warn, '완료': C.textMuted };
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, position: 'relative', overflow: 'hidden' }}>
      <Header title="합주" />
      <ScrollView style={{ padding: '12px 16px' }}>
        {MOCK_PRACTICE_LIST.map(p => {
          const assigned = p.sessions.filter(s => s.participant).length;
          return (
            <Card key={p.practiceId} onClick={() => navigate('practiceDetail', { practiceId: p.practiceId })}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 10, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="music" size={20} color={C.accent} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 3 }}>
                    <span style={{ fontSize: 15, fontWeight: 700, color: C.text }}>{p.title}</span>
                    <Badge label={p.status} color={statusColor[p.status]} />
                  </div>
                  <div style={{ fontSize: 13, color: C.textSub, marginBottom: 5 }}>{p.song.artist} — {p.song.title}</div>
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 11, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Icon name="calendar" size={11} color={C.textMuted} />{p.startAt} ({p.durationMinutes}분)
                    </span>
                    {p.venue && <span style={{ fontSize: 11, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                      <Icon name="location" size={11} color={C.textMuted} />{p.venue}
                    </span>}
                  </div>
                  <div style={{ marginTop: 8, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {Object.entries(p.sessions.reduce((acc, s) => {
                      acc[s.type] = acc[s.type] || { total: 0, assigned: 0 };
                      acc[s.type].total++;
                      if (s.participant) acc[s.type].assigned++;
                      return acc;
                    }, {})).map(([type, { total, assigned }]) => (
                      <span key={type} style={{ fontSize: 11, color: assigned === total ? C.success : C.textMuted, background: C.surface, borderRadius: 6, padding: '2px 7px' }}>
                        {type} {assigned}/{total}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
        <div style={{ height: 80 }} />
      </ScrollView>
      <FAB onClick={() => navigate('practiceCreate')} label="합주 추가" />
    </div>
  );
}

// ── Practice Detail ───────────────────────────────────────────
function PracticeDetailScreen({ navigate, params = {} }) {
  const { practiceId = 'p1', myRole = 'LEADER' } = params;
  const init = MOCK_PRACTICE_LIST.find(p => p.practiceId === practiceId) || MOCK_PRACTICE_LIST[0];
  const [practice, setPractice] = React.useState(init);
  const [scheduleSheet, setScheduleSheet] = React.useState(false);
  const [venueSheet, setVenueSheet] = React.useState(false);
  const [sessionSheet, setSessionSheet] = React.useState(false);
  const [linkSheet, setLinkSheet] = React.useState(false);
  const [participantSheet, setParticipantSheet] = React.useState(false);
  const [newVenue, setNewVenue] = React.useState('');
  const [newDate, setNewDate] = React.useState('');
  const [newDuration, setNewDuration] = React.useState('');
  const [newLink, setNewLink] = React.useState('');
  const [newParticipant, setNewParticipant] = React.useState('');
  const [sessionType, setSessionType] = React.useState('Guitar');
  const [sessionLabel, setSessionLabel] = React.useState('');
  const [toast, setToast] = React.useState({ msg: '', type: 'success' });
  const showToast = (msg, type = 'success') => { setToast({ msg, type }); setTimeout(() => setToast({ msg: '', type }), 2000); };
  const currentUser = '김밴드';
  const canManage = myRole === 'LEADER' || myRole === 'ADMIN';

  function assignSession(sid) {
    setPractice(p => ({ ...p, sessions: p.sessions.map(s => s.sessionId === sid ? { ...s, participant: currentUser } : s) }));
    showToast('세션에 배정되었습니다.');
  }
  function unassignSession(sid) {
    setPractice(p => ({ ...p, sessions: p.sessions.map(s => s.sessionId === sid ? { ...s, participant: null } : s) }));
    showToast('배정이 취소되었습니다.', 'info');
  }
  function deleteSession(sid) {
    setPractice(p => ({ ...p, sessions: p.sessions.filter(s => s.sessionId !== sid) }));
    showToast('세션이 삭제되었습니다.', 'info');
  }
  function addSession() {
    const id = 's' + Date.now();
    setPractice(p => ({ ...p, sessions: [...p.sessions, { sessionId: id, label: sessionLabel || sessionType, type: sessionType, participant: null }] }));
    setSessionSheet(false); setSessionLabel(''); showToast('세션이 추가되었습니다.');
  }
  function saveVenue() {
    setPractice(p => ({ ...p, venue: newVenue }));
    setVenueSheet(false); showToast('장소가 변경되었습니다.');
  }
  function saveSchedule() {
    setPractice(p => ({ ...p, startAt: newDate, durationMinutes: parseInt(newDuration) || p.durationMinutes }));
    setScheduleSheet(false); showToast('일정이 변경되었습니다.');
  }
  function saveLink() {
    setPractice(p => ({ ...p, refLink: newLink }));
    setLinkSheet(false); showToast('참조 링크가 저장되었습니다.');
  }
  function addParticipant() {
    if (!newParticipant) return;
    const id = 'pp' + Date.now();
    setPractice(p => ({ ...p, participants: [...p.participants, { participantId: id, memberId: newParticipant }] }));
    setParticipantSheet(false); setNewParticipant(''); showToast('멤버가 추가되었습니다.');
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>
      <Header title={practice.title} onBack={() => navigate('practice')}
        rightActions={canManage ? [
          <button key="e" onClick={() => { setNewVenue(practice.venue || ''); setScheduleSheet(true); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
            <Icon name="edit" size={20} color={C.textSub} />
          </button>
        ] : null} />

      <ScrollView style={{ padding: '16px' }}>
        {/* Header Info */}
        <Card>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                <Icon name="calendar" size={15} color={C.textSub} />
                <span style={{ fontSize: 14, color: C.text }}>{practice.startAt}</span>
                <Badge label={`${practice.durationMinutes}분`} color={C.textSub} />
              </div>
              {practice.venue && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Icon name="location" size={15} color={C.textSub} />
                  <span style={{ fontSize: 14, color: C.text }}>{practice.venue}</span>
                </div>
              )}
              {!practice.venue && <span style={{ fontSize: 13, color: C.textMuted }}>장소 미정</span>}
            </div>
            {canManage && (
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => { setNewDate(practice.startAt); setNewDuration(String(practice.durationMinutes)); setScheduleSheet(true); }}
                  style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, color: C.textSub, fontFamily: 'inherit' }}>일정 변경</button>
                <button onClick={() => { setNewVenue(practice.venue || ''); setVenueSheet(true); }}
                  style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, color: C.textSub, fontFamily: 'inherit' }}>장소 변경</button>
              </div>
            )}
          </div>
        </Card>

        {/* Song Section */}
        <div style={{ marginTop: 6 }}>
          <SectionTitle>합주곡</SectionTitle>
          <Card>
            <div style={{ display: 'flex', gap: 14 }}>
              <div style={{ width: 64, height: 64, borderRadius: 10, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="music" size={28} color={C.accent} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{practice.song.title}</div>
                <div style={{ fontSize: 13, color: C.textSub, marginTop: 2 }}>{practice.song.artist}</div>
                <div style={{ fontSize: 12, color: C.textMuted }}>{practice.song.album}</div>
                <div style={{ marginTop: 10 }}>
                  {practice.refLink
                    ? <button onClick={() => { setNewLink(practice.refLink); setLinkSheet(true); }} style={{ background: C.accentDim, border: `1px solid ${C.accent}44`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: C.accent, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Icon name="link" size={13} color={C.accent} />링크 보기
                      </button>
                    : <button onClick={() => { setNewLink(''); setLinkSheet(true); }} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 8, padding: '6px 12px', cursor: 'pointer', fontSize: 12, color: C.textSub, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 5 }}>
                        <Icon name="link" size={13} color={C.textMuted} />링크 추가
                      </button>
                  }
                </div>
              </div>
            </div>
          </Card>
        </div>

        {/* Sessions Section */}
        <div style={{ marginTop: 6 }}>
          <SectionTitle action={canManage && <button onClick={() => setSessionSheet(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.accent, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}><Icon name="plus" size={14} color={C.accent} />세션 추가</button>}>세션</SectionTitle>
          {practice.sessions.map(s => (
            <Card key={s.sessionId} style={{ padding: '12px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{ width: 34, height: 34, borderRadius: 8, background: C.surface, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name={SESSION_TYPES.find(t => t.type === s.type)?.icon || 'music'} size={16} color={C.textSub} />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.label}</div>
                  <div style={{ fontSize: 12, color: s.participant ? C.textSub : C.textMuted, marginTop: 1 }}>
                    {s.participant || '빈 자리'}
                  </div>
                </div>
                {s.participant === currentUser
                  ? <button onClick={() => unassignSession(s.sessionId)} style={{ background: C.dangerDim, border: `1px solid ${C.danger}33`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, color: C.danger, fontFamily: 'inherit' }}>배정 취소</button>
                  : !s.participant
                    ? <button onClick={() => assignSession(s.sessionId)} style={{ background: C.accentDim, border: `1px solid ${C.accent}44`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, color: C.accent, fontFamily: 'inherit' }}>배정하기</button>
                    : null
                }
                {canManage && (
                  <button onClick={() => deleteSession(s.sessionId)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                    <Icon name="trash" size={16} color={C.textMuted} />
                  </button>
                )}
              </div>
            </Card>
          ))}
        </div>

        {/* Participants Section */}
        <div style={{ marginTop: 6 }}>
          <SectionTitle action={canManage && <button onClick={() => setParticipantSheet(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.accent, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}><Icon name="plus" size={14} color={C.accent} />멤버 추가</button>}>참가자</SectionTitle>
          {practice.participants.map(pp => (
            <Card key={pp.participantId} style={{ padding: '10px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <Avatar name={pp.memberId} size={34} />
                <span style={{ fontSize: 14, color: C.text, fontWeight: 500 }}>{pp.memberId}</span>
              </div>
            </Card>
          ))}
        </div>
        <div style={{ height: 20 }} />
      </ScrollView>

      {/* Schedule BottomSheet */}
      <BottomSheet visible={scheduleSheet} onClose={() => setScheduleSheet(false)} title="합주 일정 변경">
        <Input label="시작 일시 (yyyy-MM-dd HH:mm)" value={newDate} onChange={setNewDate} placeholder="2026-04-25 19:00" />
        <Input label="소요 시간 (분)" type="number" value={newDuration} onChange={setNewDuration} placeholder="60" />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Btn label="취소" variant="secondary" onClick={() => setScheduleSheet(false)} />
          <Btn label="저장" onClick={saveSchedule} />
        </div>
      </BottomSheet>

      {/* Venue BottomSheet */}
      <BottomSheet visible={venueSheet} onClose={() => setVenueSheet(false)} title="장소 변경">
        <Input label="장소" value={newVenue} onChange={setNewVenue} placeholder="장소를 입력하세요" />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Btn label="취소" variant="secondary" onClick={() => setVenueSheet(false)} />
          <Btn label="저장" onClick={saveVenue} />
        </div>
      </BottomSheet>

      {/* Session Add BottomSheet */}
      <BottomSheet visible={sessionSheet} onClose={() => setSessionSheet(false)} title="세션 추가">
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: C.textSub, marginBottom: 8, fontWeight: 600 }}>악기 타입</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {SESSION_TYPES.map(t => (
              <Chip key={t.type} label={t.type} icon={t.icon} selected={sessionType === t.type} onClick={() => { setSessionType(t.type); setSessionLabel(t.type); }} />
            ))}
          </div>
        </div>
        <Input label="세션 레이블" value={sessionLabel} onChange={setSessionLabel} placeholder={`예: ${sessionType} 2`} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Btn label="취소" variant="secondary" onClick={() => setSessionSheet(false)} />
          <Btn label="추가" onClick={addSession} />
        </div>
      </BottomSheet>

      {/* Link BottomSheet */}
      <BottomSheet visible={linkSheet} onClose={() => setLinkSheet(false)} title="참조 링크">
        <div style={{ fontSize: 12, color: C.textMuted, marginBottom: 12 }}>YouTube, SoundCloud 등 참조 링크를 등록하세요.</div>
        <Input label="URL" type="url" value={newLink} onChange={setNewLink} placeholder="https://youtu.be/..." />
        {practice.refLink && (
          <div style={{ marginBottom: 12 }}>
            <Btn label="링크 삭제" variant="danger" onClick={() => { setPractice(p => ({ ...p, refLink: null })); setLinkSheet(false); showToast('링크가 삭제되었습니다.', 'info'); }} />
          </div>
        )}
        <div style={{ display: 'flex', gap: 8, marginTop: 4 }}>
          <Btn label="취소" variant="secondary" onClick={() => setLinkSheet(false)} />
          <Btn label="저장" onClick={saveLink} />
        </div>
      </BottomSheet>

      {/* Participant BottomSheet */}
      <BottomSheet visible={participantSheet} onClose={() => setParticipantSheet(false)} title="멤버 추가">
        <Input label="멤버 ID" value={newParticipant} onChange={setNewParticipant} placeholder="멤버 아이디 입력" />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Btn label="취소" variant="secondary" onClick={() => setParticipantSheet(false)} />
          <Btn label="추가" onClick={addParticipant} />
        </div>
      </BottomSheet>

      <Toast message={toast.msg} visible={!!toast.msg} type={toast.type} />
    </div>
  );
}

// ── Practice Create ───────────────────────────────────────────
function PracticeCreateScreen({ navigate, params = {} }) {
  const { forPerformance } = params;
  const [step, setStep] = React.useState(0);
  const [title, setTitle] = React.useState('');
  const [song, setSong] = React.useState(null);
  const [venue, setVenue] = React.useState('');
  const [startAt, setStartAt] = React.useState('');
  const [duration, setDuration] = React.useState('60');
  const [songSearch, setSongSearch] = React.useState('');
  const [songSheet, setSongSheet] = React.useState(false);
  const [loading, setLoading] = React.useState(false);

  const SONGS = [
    { songId: 'sg1', title: 'Bohemian Rhapsody', artist: 'Queen', album: 'A Night at the Opera' },
    { songId: 'sg2', title: 'Stairway to Heaven', artist: 'Led Zeppelin', album: 'Led Zeppelin IV' },
    { songId: 'sg3', title: 'Hotel California', artist: 'Eagles', album: 'Hotel California' },
    { songId: 'sg4', title: 'Smells Like Teen Spirit', artist: 'Nirvana', album: 'Nevermind' },
  ];
  const filteredSongs = SONGS.filter(s => s.title.toLowerCase().includes(songSearch.toLowerCase()) || s.artist.toLowerCase().includes(songSearch.toLowerCase()));

  function handleSubmit() {
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate(forPerformance ? 'performanceDetail' : 'practice'); }, 1200);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Header title={forPerformance ? '공연에 합주 추가' : '합주 만들기'} onBack={() => navigate(forPerformance ? 'performanceDetail' : 'practice')} />

      <ScrollView style={{ padding: '20px 20px' }}>
        <div style={{ marginBottom: 24 }}>
          <StepIndicator steps={['기본 정보', '일정 설정']} current={step} />
        </div>

        {step === 0 && (
          <>
            <Input label="합주 제목 (선택)" value={title} onChange={setTitle} placeholder="곡명으로 자동 채움" />
            {/* Song selector */}
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: C.textSub, marginBottom: 6, fontWeight: 600 }}>합주곡 <span style={{ color: C.danger }}>*</span></div>
              <div onClick={() => setSongSheet(true)} style={{
                background: C.card, border: `1.5px solid ${song ? C.accent : C.border}`, borderRadius: 12, padding: '12px 14px',
                display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer',
              }}>
                {song ? (
                  <>
                    <Icon name="music" size={16} color={C.accent} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 14, color: C.text, fontWeight: 600 }}>{song.title}</div>
                      <div style={{ fontSize: 12, color: C.textMuted }}>{song.artist}</div>
                    </div>
                    <button onClick={e => { e.stopPropagation(); setSong(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}>
                      <Icon name="close" size={16} color={C.textMuted} />
                    </button>
                  </>
                ) : (
                  <>
                    <Icon name="music" size={16} color={C.textMuted} />
                    <span style={{ flex: 1, fontSize: 14, color: C.textMuted }}>곡 검색 및 선택</span>
                    <Icon name="chevronRight" size={16} color={C.textMuted} />
                  </>
                )}
              </div>
            </div>
            <Input label="장소 (선택)" value={venue} onChange={setVenue} placeholder="연습실 위치 입력" />
            <Btn label="다음" onClick={() => setStep(1)} disabled={!song} />
          </>
        )}

        {step === 1 && (
          <>
            <Input label="시작 일시" value={startAt} onChange={setStartAt} placeholder="2026-04-25 19:00" />
            <Input label="소요 시간 (분)" type="number" value={duration} onChange={setDuration} placeholder="60" />
            {/* Summary */}
            {song && startAt && (
              <Card style={{ background: C.accentDim, border: `1px solid ${C.accent}44`, marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: C.accent, fontWeight: 700, marginBottom: 8 }}>요약</div>
                <div style={{ fontSize: 13, color: C.text }}>{title || song.title}</div>
                <div style={{ fontSize: 12, color: C.textSub, marginTop: 3 }}>{song.artist} — {song.title}</div>
                <div style={{ fontSize: 12, color: C.textSub, marginTop: 3 }}>{startAt} · {duration}분{venue ? ` · ${venue}` : ''}</div>
              </Card>
            )}
            <div style={{ display: 'flex', gap: 8 }}>
              <Btn label="이전" variant="secondary" onClick={() => setStep(0)} />
              <Btn label="합주 만들기" onClick={handleSubmit} loading={loading} disabled={!startAt} />
            </div>
          </>
        )}
      </ScrollView>

      {/* Song Search BottomSheet */}
      <BottomSheet visible={songSheet} onClose={() => setSongSheet(false)} title="곡 검색">
        <div style={{ background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
          <Icon name="music" size={15} color={C.textMuted} />
          <input value={songSearch} onChange={e => setSongSearch(e.target.value)} placeholder="곡명, 아티스트 검색..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: C.text, fontFamily: 'inherit' }} autoFocus />
        </div>
        {filteredSongs.map(s => (
          <div key={s.songId} onClick={() => { setSong(s); setSongSheet(false); setTitle(t => t || s.title); }}
            style={{ display: 'flex', gap: 12, padding: '12px 4px', borderBottom: `1px solid ${C.border}`, cursor: 'pointer', alignItems: 'center' }}>
            <div style={{ width: 40, height: 40, borderRadius: 8, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
              <Icon name="music" size={18} color={C.accent} />
            </div>
            <div>
              <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{s.title}</div>
              <div style={{ fontSize: 12, color: C.textMuted }}>{s.artist} · {s.album}</div>
            </div>
          </div>
        ))}
      </BottomSheet>
    </div>
  );
}

Object.assign(window, { PracticeListScreen, PracticeDetailScreen, PracticeCreateScreen, MOCK_PRACTICE_LIST, SESSION_TYPES });
