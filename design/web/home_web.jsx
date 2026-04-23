
// ============================================================
// WEB — HOME + MYPAGE
// ============================================================

function WHomeScreen({ navigate }) {
  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px', background: WC.bg }}>
      {/* Welcome */}
      <div style={{ marginBottom: 28 }}>
        <div style={{ fontSize: 24, fontWeight: 800, color: WC.text }}>안녕하세요, 김밴드 님 👋</div>
        <div style={{ fontSize: 14, color: WC.textMuted, marginTop: 4 }}>오늘도 좋은 합주 되세요.</div>
      </div>

      {/* Stat row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 32 }}>
        <WStatCard label="소속 밴드" value="3" icon="band" color={WC.accent} />
        <WStatCard label="예정 합주" value="2" icon="practice" color={WC.success} />
        <WStatCard label="예정 공연" value="2" icon="performance" color={WC.amber} />
        <WStatCard label="참여 세션" value="5" icon="music" color={WC.warn} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
        {/* 내 밴드 */}
        <div>
          <WSectionTitle action={<button onClick={() => navigate('band')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: WC.accent, fontFamily: 'inherit' }}>전체 보기 →</button>}>내 밴드</WSectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { bandId: 'b1', bandName: '루나틱', role: 'LEADER' },
              { bandId: 'b2', bandName: '코드 크래셔', role: 'MEMBER' },
              { bandId: 'b3', bandName: '마그마', role: 'ADMIN' },
            ].map(b => (
              <WCard key={b.bandId} onClick={() => navigate('bandDetail', { bandId: b.bandId, myRole: b.role })}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: WC.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <WIcon name="music" size={18} color={WC.accent} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: WC.text }}>{b.bandName}</div>
                  </div>
                  <WRoleBadge role={b.role} />
                </div>
              </WCard>
            ))}
          </div>
        </div>

        {/* 다가오는 합주 */}
        <div>
          <WSectionTitle action={<button onClick={() => navigate('practice')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: WC.accent, fontFamily: 'inherit' }}>전체 보기 →</button>}>다가오는 합주</WSectionTitle>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { practiceId: 'p1', title: '정기 합주 #12', song: { title: 'Bohemian Rhapsody', artist: 'Queen' }, startAt: '2026-04-25 19:00', venue: '홍대 연습실 A' },
              { practiceId: 'p2', title: '합주', song: { title: 'Stairway to Heaven', artist: 'Led Zeppelin' }, startAt: '2026-04-27 18:00', venue: null },
            ].map(p => (
              <WCard key={p.practiceId} onClick={() => navigate('practiceDetail', { practiceId: p.practiceId })}>
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: `${WC.success}22`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <WIcon name="practice" size={18} color={WC.success} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: WC.text, marginBottom: 2 }}>{p.title}</div>
                    <div style={{ fontSize: 12, color: WC.textSub }}>{p.song.artist} — {p.song.title}</div>
                    <div style={{ fontSize: 11, color: WC.textMuted, marginTop: 4, display: 'flex', gap: 8 }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><WIcon name="calendar" size={11} color={WC.textMuted} />{p.startAt}</span>
                      {p.venue && <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><WIcon name="location" size={11} color={WC.textMuted} />{p.venue}</span>}
                    </div>
                  </div>
                  <WBadge label="예정" color={WC.accent} />
                </div>
              </WCard>
            ))}
          </div>
        </div>

        {/* 다가오는 공연 */}
        <div style={{ gridColumn: '1 / -1' }}>
          <WSectionTitle action={<button onClick={() => navigate('performance')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: WC.accent, fontFamily: 'inherit' }}>전체 보기 →</button>}>다가오는 공연</WSectionTitle>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
            {[
              { performanceId: 'pf1', title: '봄 정기공연 2026', startAt: '2026-04-30 18:00', venue: '홍익대학교 대강당', daysLeft: 8 },
              { performanceId: 'pf2', title: '인디 페스티벌', startAt: '2026-05-15 15:00', venue: '올림픽공원 야외광장', daysLeft: 23 },
            ].map(pf => (
              <WCard key={pf.performanceId} onClick={() => navigate('performanceDetail', { performanceId: pf.performanceId, isManager: true })}>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
                  <div style={{ width: 40, height: 40, borderRadius: 10, background: WC.amberDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                    <WIcon name="performance" size={18} color={WC.amber} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: WC.text, marginBottom: 3 }}>{pf.title}</div>
                    <div style={{ fontSize: 11, color: WC.textMuted }}>{pf.startAt}</div>
                    <div style={{ fontSize: 11, color: WC.textMuted }}>{pf.venue}</div>
                  </div>
                  {pf.daysLeft <= 7 && <WBadge label={`D-${pf.daysLeft}`} color={WC.danger} />}
                </div>
              </WCard>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ── MyPage ─────────────────────────────────────────────────────
function WMyPageScreen({ navigate }) {
  const [editModal, setEditModal] = React.useState(false);
  const [logoutDialog, setLogoutDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [deletePwModal, setDeletePwModal] = React.useState(false);
  const [name, setName] = React.useState('김밴드');
  const [contact, setContact] = React.useState('010-1234-5678');
  const [editName, setEditName] = React.useState('');
  const [editContact, setEditContact] = React.useState('');
  const [toast, setToast] = React.useState('');
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2500); };

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '32px 36px', background: WC.bg }}>
      <div style={{ maxWidth: 800 }}>
        <div style={{ fontSize: 22, fontWeight: 800, color: WC.text, marginBottom: 28 }}>마이페이지</div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Profile card */}
          <WCard style={{ gridColumn: '1 / -1', padding: '28px 32px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
              <div style={{ position: 'relative' }}>
                <WAvatar name={name} size={80} />
                <div style={{ position: 'absolute', bottom: 0, right: 0, background: WC.accent, borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${WC.card}`, cursor: 'pointer' }}>
                  <WIcon name="camera" size={12} color="#fff" />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 22, fontWeight: 800, color: WC.text }}>{name}</div>
                <div style={{ fontSize: 14, color: WC.textMuted, marginTop: 4 }}>kim@bandage.io</div>
                <div style={{ fontSize: 14, color: WC.textMuted }}>{contact}</div>
              </div>
              <WBtn label="프로필 편집" variant="secondary" icon="edit" onClick={() => { setEditName(name); setEditContact(contact); setEditModal(true); }} />
            </div>
          </WCard>

          {/* Settings */}
          <div>
            <WSectionTitle>계정 설정</WSectionTitle>
            <WCard style={{ padding: 0, overflow: 'hidden' }}>
              {[
                { icon: 'shield', label: '비밀번호 변경', sub: '마지막 변경: 30일 전', action: () => navigate('passwordChange') },
                { icon: 'bell', label: '알림 설정', sub: '준비 중', disabled: true },
                { icon: 'info', label: '앱 정보', sub: 'v1.0.0', disabled: true },
              ].map((item, i) => (
                <React.Fragment key={i}>
                  {i > 0 && <WDivider />}
                  <button onClick={item.disabled ? undefined : item.action} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'none', border: 'none', cursor: item.disabled ? 'default' : 'pointer', fontFamily: 'inherit' }}>
                    <WIcon name={item.icon} size={18} color={item.disabled ? WC.textMuted : WC.textSub} />
                    <div style={{ flex: 1, textAlign: 'left' }}>
                      <div style={{ fontSize: 14, color: item.disabled ? WC.textMuted : WC.text }}>{item.label}</div>
                      {item.sub && <div style={{ fontSize: 12, color: WC.textMuted, marginTop: 1 }}>{item.sub}</div>}
                    </div>
                    {!item.disabled && <WIcon name="chevronRight" size={16} color={WC.textMuted} />}
                  </button>
                </React.Fragment>
              ))}
            </WCard>
          </div>

          {/* Danger zone */}
          <div>
            <WSectionTitle>기타</WSectionTitle>
            <WCard style={{ padding: 0, overflow: 'hidden' }}>
              <button onClick={() => setLogoutDialog(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <WIcon name="logout" size={18} color={WC.textSub} />
                <span style={{ flex: 1, textAlign: 'left', fontSize: 14, color: WC.text }}>로그아웃</span>
                <WIcon name="chevronRight" size={16} color={WC.textMuted} />
              </button>
              <WDivider />
              <button onClick={() => setDeleteDialog(true)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                <WIcon name="trash" size={18} color={WC.danger} />
                <span style={{ flex: 1, textAlign: 'left', fontSize: 14, color: WC.danger }}>회원 탈퇴</span>
                <WIcon name="chevronRight" size={16} color={WC.danger} />
              </button>
            </WCard>
          </div>
        </div>
      </div>

      {/* Modals */}
      <WModal visible={editModal} onClose={() => setEditModal(false)} title="프로필 수정" width={420}>
        <WInput label="이름" value={editName} onChange={setEditName} />
        <WInput label="연락처" value={editContact} onChange={setEditContact} />
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <WBtn label="취소" variant="secondary" onClick={() => setEditModal(false)} fullWidth />
          <WBtn label="저장" onClick={() => { setName(editName); setContact(editContact); setEditModal(false); showToast('프로필이 수정되었습니다.'); }} fullWidth />
        </div>
      </WModal>

      <WDialog visible={logoutDialog} title="로그아웃" message="정말 로그아웃 하시겠습니까?" confirmLabel="로그아웃" cancelLabel="취소"
        onConfirm={() => { setLogoutDialog(false); navigate('login'); }} onCancel={() => setLogoutDialog(false)} />

      <WDialog visible={deleteDialog} title="회원 탈퇴" message="정말 탈퇴하시겠습니까?" subText="탈퇴 시 모든 데이터가 삭제됩니다."
        confirmLabel="다음" cancelLabel="취소" confirmDanger
        onConfirm={() => { setDeleteDialog(false); setDeletePwModal(true); }} onCancel={() => setDeleteDialog(false)} />

      <WModal visible={deletePwModal} onClose={() => setDeletePwModal(false)} title="비밀번호 확인" width={380}>
        <div style={{ fontSize: 13, color: WC.textMuted, marginBottom: 16 }}>탈퇴를 위해 현재 비밀번호를 입력해주세요.</div>
        <WInput label="비밀번호" type="password" value="" onChange={() => {}} placeholder="현재 비밀번호" />
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <WBtn label="취소" variant="secondary" onClick={() => setDeletePwModal(false)} fullWidth />
          <WBtn label="탈퇴하기" variant="danger" onClick={() => { setDeletePwModal(false); navigate('login'); }} fullWidth />
        </div>
      </WModal>

      <WToast message={toast} visible={!!toast} type="success" />
    </div>
  );
}

Object.assign(window, { WHomeScreen, WMyPageScreen });
