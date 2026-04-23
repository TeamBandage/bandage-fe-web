
// ============================================================
// WEB — PRACTICE SCREENS (Master-Detail)
// ============================================================
const W_SESSION_TYPES = [
  { type: 'Vocal', icon: 'mic' }, { type: 'Chorus', icon: 'mic' },
  { type: 'Guitar', icon: 'music' }, { type: 'Bass', icon: 'music' },
  { type: 'Drum', icon: 'drum' }, { type: 'Percussion', icon: 'drum' },
  { type: 'Synth', icon: 'music' }, { type: 'Session', icon: 'star' },
];

const W_PRACTICES = [
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
    refLink: 'https://youtu.be/fJ9rUzIMcZQ', status: '예정',
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
    refLink: null, status: '예정',
  },
];

function WPracticeListScreen({ navigate }) {
  const [selected, setSelected] = React.useState(null);
  const [practice, setPractice] = React.useState(null);
  const [createModal, setCreateModal] = React.useState(false);
  const [scheduleModal, setScheduleModal] = React.useState(false);
  const [venueModal, setVenueModal] = React.useState(false);
  const [sessionModal, setSessionModal] = React.useState(false);
  const [linkModal, setLinkModal] = React.useState(false);
  const [participantModal, setParticipantModal] = React.useState(false);
  const [newVenue, setNewVenue] = React.useState('');
  const [newDate, setNewDate] = React.useState('');
  const [newDuration, setNewDuration] = React.useState('');
  const [newLink, setNewLink] = React.useState('');
  const [newParticipant, setNewParticipant] = React.useState('');
  const [sessionType, setSessionType] = React.useState('Guitar');
  const [sessionLabel, setSessionLabel] = React.useState('');
  const [toast, setToast] = React.useState('');
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2000); };
  const currentUser = '김밴드';
  const myRole = 'LEADER';

  // Create form
  const [cTitle, setCTitle] = React.useState('');
  const [cSong, setCSong] = React.useState(null);
  const [cVenue, setCVenue] = React.useState('');
  const [cDate, setCDate] = React.useState('');
  const [cDuration, setCDuration] = React.useState('60');
  const [cStep, setCStep] = React.useState(0);
  const [cCreating, setCCreating] = React.useState(false);

  const SONGS = [
    { songId: 'sg1', title: 'Bohemian Rhapsody', artist: 'Queen' },
    { songId: 'sg2', title: 'Stairway to Heaven', artist: 'Led Zeppelin' },
    { songId: 'sg3', title: 'Hotel California', artist: 'Eagles' },
    { songId: 'sg4', title: 'Smells Like Teen Spirit', artist: 'Nirvana' },
  ];

  function selectPractice(id) {
    setSelected(id);
    setPractice(JSON.parse(JSON.stringify(W_PRACTICES.find(p => p.practiceId === id))));
  }

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
    showToast('세션이 삭제되었습니다.');
  }
  function addSession() {
    const id = 's' + Date.now();
    setPractice(p => ({ ...p, sessions: [...p.sessions, { sessionId: id, label: sessionLabel || sessionType, type: sessionType, participant: null }] }));
    setSessionModal(false); setSessionLabel(''); showToast('세션이 추가되었습니다.');
  }

  const statusColor = { '예정': WC.accent, '진행 중': WC.warn, '완료': WC.textMuted };

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: WC.bg }}>
      {/* List panel */}
      <div style={{ width: 340, borderRight: `1px solid ${WC.border}`, display: 'flex', flexDirection: 'column', background: WC.surface, flexShrink: 0 }}>
        <div style={{ padding: '20px', borderBottom: `1px solid ${WC.border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ fontSize: 17, fontWeight: 700, color: WC.text }}>합주</span>
          <WBtn label="합주 추가" icon="plus" small onClick={() => { setCStep(0); setCreateModal(true); }} />
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          {W_PRACTICES.map(p => (
            <div key={p.practiceId} onClick={() => selectPractice(p.practiceId)}
              style={{ padding: '12px', borderRadius: 12, cursor: 'pointer', marginBottom: 4, background: selected === p.practiceId ? WC.accentDim : 'transparent', border: `1px solid ${selected === p.practiceId ? WC.accent + '44' : 'transparent'}`, transition: 'background 0.15s' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                <div style={{ width: 36, height: 36, borderRadius: 8, background: `${WC.success}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <WIcon name="practice" size={16} color={WC.success} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2 }}>
                    <span style={{ fontSize: 13, fontWeight: 700, color: WC.text }}>{p.title}</span>
                    <WBadge label={p.status} color={statusColor[p.status]} />
                  </div>
                  <div style={{ fontSize: 12, color: WC.textSub }}>{p.song.artist} — {p.song.title}</div>
                  <div style={{ fontSize: 11, color: WC.textMuted, marginTop: 3, display: 'flex', gap: 6 }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><WIcon name="calendar" size={11} color={WC.textMuted} />{p.startAt}</span>
                    {p.venue && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><WIcon name="location" size={11} color={WC.textMuted} />{p.venue}</span>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!practice ? (
          <WEmptyState icon="practice" title="합주를 선택하세요" sub="왼쪽 목록에서 합주를 선택하면 상세 정보를 볼 수 있습니다." />
        ) : (
          <>
            <WTopBar title={practice.title} breadcrumb="합주"
              actions={[
                <WBtn key="sch" label="일정 변경" variant="secondary" icon="calendar" small onClick={() => { setNewDate(practice.startAt); setNewDuration(String(practice.durationMinutes)); setScheduleModal(true); }} />,
                <WBtn key="ven" label="장소 변경" variant="secondary" icon="location" small onClick={() => { setNewVenue(practice.venue || ''); setVenueModal(true); }} />,
              ]} />

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                {/* Info + Song */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <WCard>
                    <WSectionTitle>일정 & 장소</WSectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <WIcon name="calendar" size={15} color={WC.textSub} />
                        <span style={{ fontSize: 14, color: WC.text }}>{practice.startAt}</span>
                        <WBadge label={`${practice.durationMinutes}분`} color={WC.textSub} />
                      </div>
                      {practice.venue
                        ? <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><WIcon name="location" size={15} color={WC.textSub} /><span style={{ fontSize: 14, color: WC.text }}>{practice.venue}</span></div>
                        : <span style={{ fontSize: 13, color: WC.textMuted }}>장소 미정</span>}
                    </div>
                  </WCard>
                  <WCard>
                    <WSectionTitle>합주곡</WSectionTitle>
                    <div style={{ display: 'flex', gap: 14 }}>
                      <div style={{ width: 56, height: 56, borderRadius: 10, background: WC.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <WIcon name="music" size={24} color={WC.accent} />
                      </div>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 700, color: WC.text }}>{practice.song.title}</div>
                        <div style={{ fontSize: 13, color: WC.textSub }}>{practice.song.artist}</div>
                        <div style={{ fontSize: 12, color: WC.textMuted }}>{practice.song.album}</div>
                        <div style={{ marginTop: 10 }}>
                          {practice.refLink
                            ? <WBtn label="링크 보기" icon="link" small variant="ghost" onClick={() => { setNewLink(practice.refLink); setLinkModal(true); }} />
                            : <WBtn label="링크 추가" icon="link" small variant="secondary" onClick={() => { setNewLink(''); setLinkModal(true); }} />
                          }
                        </div>
                      </div>
                    </div>
                  </WCard>
                  <WCard>
                    <WSectionTitle action={<button onClick={() => setParticipantModal(true)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: WC.accent, display: 'flex', alignItems: 'center', gap: 3, fontFamily: 'inherit' }}><WIcon name="plus" size={13} color={WC.accent} />추가</button>}>참가자</WSectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {practice.participants.map(pp => (
                        <div key={pp.participantId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <WAvatar name={pp.memberId} size={30} />
                          <span style={{ fontSize: 13, color: WC.text }}>{pp.memberId}</span>
                        </div>
                      ))}
                    </div>
                  </WCard>
                </div>

                {/* Sessions */}
                <div>
                  <WCard style={{ height: '100%' }}>
                    <WSectionTitle action={
                      <WBtn label="세션 추가" icon="plus" small onClick={() => setSessionModal(true)} />
                    }>세션</WSectionTitle>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      {practice.sessions.map(s => (
                        <div key={s.sessionId} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', background: WC.surface, borderRadius: 10, border: `1px solid ${WC.border}` }}>
                          <div style={{ width: 32, height: 32, borderRadius: 8, background: WC.card, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                            <WIcon name={W_SESSION_TYPES.find(t => t.type === s.type)?.icon || 'music'} size={14} color={WC.textSub} />
                          </div>
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 13, fontWeight: 600, color: WC.text }}>{s.label}</div>
                            <div style={{ fontSize: 11, color: s.participant ? WC.textSub : WC.textMuted }}>{s.participant || '빈 자리'}</div>
                          </div>
                          {s.participant === currentUser
                            ? <WBtn label="취소" small variant="danger" onClick={() => unassignSession(s.sessionId)} />
                            : !s.participant
                              ? <WBtn label="배정" small onClick={() => assignSession(s.sessionId)} />
                              : null}
                          <button onClick={() => deleteSession(s.sessionId)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}>
                            <WIcon name="trash" size={14} color={WC.textMuted} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </WCard>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <WModal visible={createModal} onClose={() => setCreateModal(false)} title="합주 만들기" width={520}>
        <WStepIndicator steps={['기본 정보', '일정 설정']} current={cStep} />
        {cStep === 0 && (
          <>
            <WInput label="합주 제목 (선택)" value={cTitle} onChange={setCTitle} placeholder="곡명으로 자동 채움" />
            <div style={{ marginBottom: 16 }}>
              <div style={{ fontSize: 12, color: WC.textSub, marginBottom: 8, fontWeight: 600 }}>합주곡 *</div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {SONGS.map(s => (
                  <div key={s.songId} onClick={() => { setCSong(s); setCTitle(t => t || s.title); }}
                    style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', background: cSong?.songId === s.songId ? WC.accentDim : WC.card, borderRadius: 10, border: `1.5px solid ${cSong?.songId === s.songId ? WC.accent : WC.border}`, cursor: 'pointer' }}>
                    <WIcon name="music" size={16} color={cSong?.songId === s.songId ? WC.accent : WC.textMuted} />
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 600, color: WC.text }}>{s.title}</div>
                      <div style={{ fontSize: 11, color: WC.textMuted }}>{s.artist}</div>
                    </div>
                    {cSong?.songId === s.songId && <WIcon name="check" size={16} color={WC.accent} />}
                  </div>
                ))}
              </div>
            </div>
            <WInput label="장소 (선택)" value={cVenue} onChange={setCVenue} placeholder="연습실 위치" />
            <div style={{ display: 'flex', gap: 10 }}>
              <WBtn label="취소" variant="secondary" onClick={() => setCreateModal(false)} fullWidth />
              <WBtn label="다음" onClick={() => setCStep(1)} disabled={!cSong} fullWidth />
            </div>
          </>
        )}
        {cStep === 1 && (
          <>
            <WInput label="시작 일시" value={cDate} onChange={setCDate} placeholder="2026-04-25 19:00" />
            <WInput label="소요 시간 (분)" type="number" value={cDuration} onChange={setCDuration} />
            {cSong && cDate && (
              <div style={{ background: WC.accentDim, border: `1px solid ${WC.accent}44`, borderRadius: 12, padding: '14px 16px', marginBottom: 16 }}>
                <div style={{ fontSize: 12, color: WC.accent, fontWeight: 700, marginBottom: 6 }}>요약</div>
                <div style={{ fontSize: 13, color: WC.text }}>{cTitle || cSong.title} · {cSong.artist}</div>
                <div style={{ fontSize: 12, color: WC.textSub, marginTop: 2 }}>{cDate} · {cDuration}분{cVenue ? ` · ${cVenue}` : ''}</div>
              </div>
            )}
            <div style={{ display: 'flex', gap: 10 }}>
              <WBtn label="이전" variant="secondary" onClick={() => setCStep(0)} fullWidth />
              <WBtn label="합주 만들기" onClick={() => { setCCreating(true); setTimeout(() => { setCCreating(false); setCreateModal(false); showToast('합주가 생성되었습니다.'); }, 1000); }} loading={cCreating} disabled={!cDate} fullWidth />
            </div>
          </>
        )}
      </WModal>

      <WModal visible={scheduleModal} onClose={() => setScheduleModal(false)} title="일정 변경" width={400}>
        <WInput label="시작 일시" value={newDate} onChange={setNewDate} placeholder="yyyy-MM-dd HH:mm" />
        <WInput label="소요 시간 (분)" type="number" value={newDuration} onChange={setNewDuration} />
        <div style={{ display: 'flex', gap: 10 }}>
          <WBtn label="취소" variant="secondary" onClick={() => setScheduleModal(false)} fullWidth />
          <WBtn label="저장" onClick={() => { setPractice(p => ({ ...p, startAt: newDate, durationMinutes: parseInt(newDuration) })); setScheduleModal(false); showToast('일정이 변경되었습니다.'); }} fullWidth />
        </div>
      </WModal>

      <WModal visible={venueModal} onClose={() => setVenueModal(false)} title="장소 변경" width={400}>
        <WInput label="장소" value={newVenue} onChange={setNewVenue} placeholder="장소를 입력하세요" />
        <div style={{ display: 'flex', gap: 10 }}>
          <WBtn label="취소" variant="secondary" onClick={() => setVenueModal(false)} fullWidth />
          <WBtn label="저장" onClick={() => { setPractice(p => ({ ...p, venue: newVenue })); setVenueModal(false); showToast('장소가 변경되었습니다.'); }} fullWidth />
        </div>
      </WModal>

      <WModal visible={sessionModal} onClose={() => setSessionModal(false)} title="세션 추가" width={420}>
        <div style={{ marginBottom: 16 }}>
          <div style={{ fontSize: 12, color: WC.textSub, marginBottom: 8, fontWeight: 600 }}>악기 타입</div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
            {W_SESSION_TYPES.map(t => <WChip key={t.type} label={t.type} icon={t.icon} selected={sessionType === t.type} onClick={() => { setSessionType(t.type); setSessionLabel(t.type); }} />)}
          </div>
        </div>
        <WInput label="세션 레이블" value={sessionLabel} onChange={setSessionLabel} placeholder={`예: ${sessionType} 2`} />
        <div style={{ display: 'flex', gap: 10 }}>
          <WBtn label="취소" variant="secondary" onClick={() => setSessionModal(false)} fullWidth />
          <WBtn label="추가" onClick={addSession} fullWidth />
        </div>
      </WModal>

      <WModal visible={linkModal} onClose={() => setLinkModal(false)} title="참조 링크" width={400}>
        <WInput label="URL" type="url" value={newLink} onChange={setNewLink} placeholder="https://youtu.be/..." />
        <div style={{ display: 'flex', gap: 10 }}>
          {practice?.refLink && <WBtn label="삭제" variant="danger" onClick={() => { setPractice(p => ({ ...p, refLink: null })); setLinkModal(false); showToast('링크가 삭제되었습니다.'); }} />}
          <WBtn label="취소" variant="secondary" onClick={() => setLinkModal(false)} fullWidth />
          <WBtn label="저장" onClick={() => { setPractice(p => ({ ...p, refLink: newLink })); setLinkModal(false); showToast('링크가 저장되었습니다.'); }} fullWidth />
        </div>
      </WModal>

      <WModal visible={participantModal} onClose={() => setParticipantModal(false)} title="멤버 추가" width={380}>
        <WInput label="멤버 ID" value={newParticipant} onChange={setNewParticipant} placeholder="멤버 아이디 입력" />
        <div style={{ display: 'flex', gap: 10 }}>
          <WBtn label="취소" variant="secondary" onClick={() => setParticipantModal(false)} fullWidth />
          <WBtn label="추가" onClick={() => { if (!newParticipant) return; setPractice(p => ({ ...p, participants: [...p.participants, { participantId: 'pp' + Date.now(), memberId: newParticipant }] })); setParticipantModal(false); setNewParticipant(''); showToast('멤버가 추가되었습니다.'); }} fullWidth />
        </div>
      </WModal>

      <WToast message={toast} visible={!!toast} type="success" />
    </div>
  );
}

Object.assign(window, { WPracticeListScreen, W_PRACTICES, W_SESSION_TYPES });
