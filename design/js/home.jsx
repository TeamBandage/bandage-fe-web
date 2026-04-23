
// ============================================================
// HOME + MYPAGE SCREENS
// ============================================================

const MOCK_BANDS = [
  { bandId: 'b1', bandName: '루나틱', role: 'LEADER', profileImg: null },
  { bandId: 'b2', bandName: '코드 크래셔', role: 'MEMBER', profileImg: null },
  { bandId: 'b3', bandName: '마그마', role: 'ADMIN', profileImg: null },
];
const MOCK_PRACTICES = [
  { practiceId: 'p1', title: '정기 합주 #12', song: { title: 'Bohemian Rhapsody', artist: 'Queen' }, startAt: '2026-04-25 19:00', venue: '홍대 연습실 A' },
  { practiceId: 'p2', title: '합주', song: { title: 'Stairway to Heaven', artist: 'Led Zeppelin' }, startAt: '2026-04-27 18:00', venue: null },
];
const MOCK_PERFORMANCES = [
  { performanceId: 'pf1', title: '봄 정기공연 2026', startAt: '2026-04-30 18:00', venue: '홍익대학교 대강당', daysLeft: 8 },
  { performanceId: 'pf2', title: '인디 페스티벌', startAt: '2026-05-15 15:00', venue: '올림픽공원 야외광장', daysLeft: 23 },
];

function HomeScreen({ navigate }) {
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 20px', background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Icon name="guitar" size={20} color={C.accent} />
          <span style={{ fontSize: 20, fontWeight: 900, color: C.accent, letterSpacing: '-0.5px' }}>Bandage</span>
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }} onClick={() => {}}>
            <Icon name="bell" size={22} color={C.textSub} />
          </button>
          <Avatar name="김밴드" size={32} />
        </div>
      </div>

      <ScrollView style={{ padding: '20px 16px' }}>
        {/* 내 밴드 */}
        <SectionTitle action={
          <button onClick={() => navigate('band')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.accent, fontFamily: 'inherit' }}>전체 보기</button>
        }>내 밴드</SectionTitle>
        <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4, marginBottom: 24 }}>
          {MOCK_BANDS.map(b => (
            <div key={b.bandId} onClick={() => navigate('bandDetail', { bandId: b.bandId })} style={{
              flexShrink: 0, width: 110, background: C.card, borderRadius: 14,
              border: `1px solid ${C.border}`, padding: '14px 12px',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, cursor: 'pointer',
            }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon name="music" size={22} color={C.accent} />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: C.text, textAlign: 'center', lineHeight: 1.3 }}>{b.bandName}</span>
              <RoleBadge role={b.role} />
            </div>
          ))}
        </div>

        {/* 다가오는 합주 */}
        <SectionTitle action={
          <button onClick={() => navigate('practice')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.accent, fontFamily: 'inherit' }}>전체 보기</button>
        }>다가오는 합주</SectionTitle>
        {MOCK_PRACTICES.map(p => (
          <Card key={p.practiceId} onClick={() => navigate('practiceDetail', { practiceId: p.practiceId })}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="music" size={18} color={C.accent} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{p.title}</div>
                <div style={{ fontSize: 12, color: C.textSub, marginBottom: 4 }}>{p.song.artist} — {p.song.title}</div>
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Icon name="calendar" size={11} color={C.textMuted} />{p.startAt}
                  </span>
                  {p.venue && <span style={{ fontSize: 11, color: C.textMuted, display: 'flex', alignItems: 'center', gap: 3 }}>
                    <Icon name="location" size={11} color={C.textMuted} />{p.venue}
                  </span>}
                </div>
              </div>
              <Badge label="예정" color={C.accent} />
            </div>
          </Card>
        ))}

        {/* 다가오는 공연 */}
        <div style={{ marginTop: 10 }} />
        <SectionTitle action={
          <button onClick={() => navigate('performance')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: C.accent, fontFamily: 'inherit' }}>전체 보기</button>
        }>다가오는 공연</SectionTitle>
        {MOCK_PERFORMANCES.map(pf => (
          <Card key={pf.performanceId} onClick={() => navigate('performanceDetail', { performanceId: pf.performanceId })}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 10, background: C.amberDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Icon name="performance" size={18} color={C.amber} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: C.text, marginBottom: 3 }}>{pf.title}</div>
                <div style={{ fontSize: 11, color: C.textMuted, display: 'flex', gap: 10 }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="calendar" size={11} color={C.textMuted} />{pf.startAt}</span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><Icon name="location" size={11} color={C.textMuted} />{pf.venue}</span>
                </div>
              </div>
              {pf.daysLeft <= 7 && <Badge label={`D-${pf.daysLeft}`} color={C.danger} />}
            </div>
          </Card>
        ))}
        <div style={{ height: 20 }} />
      </ScrollView>
    </div>
  );
}

// ── MyPage Screen ─────────────────────────────────────────────
function MyPageScreen({ navigate }) {
  const [editSheet, setEditSheet] = React.useState(false);
  const [logoutDialog, setLogoutDialog] = React.useState(false);
  const [deleteDialog, setDeleteDialog] = React.useState(false);
  const [deleteStep, setDeleteStep] = React.useState(0);
  const [deletePw, setDeletePw] = React.useState('');
  const [name, setName] = React.useState('김밴드');
  const [contact, setContact] = React.useState('010-1234-5678');
  const [editName, setEditName] = React.useState('');
  const [editContact, setEditContact] = React.useState('');
  const [toast, setToast] = React.useState('');

  function showToast(msg) { setToast(msg); setTimeout(() => setToast(''), 2000); }

  const menuItems = [
    { icon: 'shield', label: '비밀번호 변경', action: () => navigate('passwordChange') },
    { icon: 'bell', label: '알림 설정', sub: '준비 중', disabled: true },
    { icon: 'info', label: '앱 정보', sub: 'v1.0.0', disabled: true },
    { icon: 'logout', label: '로그아웃', action: () => setLogoutDialog(true), color: C.textSub },
  ];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Header title="마이페이지" />
      <ScrollView>
        {/* Profile */}
        <div style={{ background: C.surface, padding: '24px 20px', borderBottom: `1px solid ${C.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative' }}>
              <Avatar name={name} size={64} />
              <div style={{ position: 'absolute', bottom: 0, right: 0, background: C.accent, borderRadius: '50%', width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${C.surface}` }}>
                <Icon name="camera" size={11} color="#fff" />
              </div>
            </div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, color: C.text }}>{name}</div>
              <div style={{ fontSize: 13, color: C.textMuted, marginTop: 2 }}>kim@bandage.io</div>
              <div style={{ fontSize: 13, color: C.textMuted }}>{contact}</div>
            </div>
            <button onClick={() => { setEditName(name); setEditContact(contact); setEditSheet(true); }}
              style={{ marginLeft: 'auto', background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '8px 14px', cursor: 'pointer', fontSize: 12, color: C.textSub, fontFamily: 'inherit' }}>
              편집
            </button>
          </div>
        </div>

        {/* Menu */}
        <div style={{ padding: '8px 0' }}>
          {menuItems.map((item, i) => (
            <button key={i} onClick={item.disabled ? undefined : item.action} style={{
              width: '100%', background: 'none', border: 'none', cursor: item.disabled ? 'default' : 'pointer',
              display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px',
              fontFamily: 'inherit',
            }}>
              <Icon name={item.icon} size={20} color={item.disabled ? C.textMuted : (item.color || C.textSub)} />
              <span style={{ flex: 1, textAlign: 'left', fontSize: 15, color: item.disabled ? C.textMuted : (item.color || C.text), fontWeight: 500 }}>{item.label}</span>
              {item.sub && <span style={{ fontSize: 12, color: C.textMuted }}>{item.sub}</span>}
              {!item.disabled && <Icon name="chevronRight" size={16} color={C.textMuted} />}
            </button>
          ))}
          <Divider />
          <button onClick={() => setDeleteDialog(true)} style={{
            width: '100%', background: 'none', border: 'none', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', fontFamily: 'inherit',
          }}>
            <Icon name="trash" size={20} color={C.danger} />
            <span style={{ flex: 1, textAlign: 'left', fontSize: 15, color: C.danger, fontWeight: 500 }}>회원 탈퇴</span>
            <Icon name="chevronRight" size={16} color={C.danger} />
          </button>
        </div>
      </ScrollView>

      {/* Edit BottomSheet */}
      <BottomSheet visible={editSheet} onClose={() => setEditSheet(false)} title="프로필 수정">
        <Input label="이름" value={editName} onChange={setEditName} />
        <Input label="연락처" value={editContact} onChange={setEditContact} />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Btn label="취소" variant="secondary" onClick={() => setEditSheet(false)} />
          <Btn label="저장" onClick={() => { setName(editName); setContact(editContact); setEditSheet(false); showToast('프로필이 수정되었습니다.'); }} />
        </div>
      </BottomSheet>

      {/* Logout Dialog */}
      <Dialog visible={logoutDialog} title="로그아웃" message="정말 로그아웃 하시겠습니까?" confirmLabel="로그아웃" cancelLabel="취소"
        onConfirm={() => { setLogoutDialog(false); navigate('login'); }}
        onCancel={() => setLogoutDialog(false)} />

      {/* Delete Dialog */}
      <Dialog visible={deleteDialog && deleteStep === 0} title="회원 탈퇴" message="정말 탈퇴하시겠습니까?" subText="탈퇴 시 모든 데이터가 삭제됩니다."
        confirmLabel="다음" cancelLabel="취소" confirmDanger
        onConfirm={() => setDeleteStep(1)} onCancel={() => setDeleteDialog(false)} />

      {/* Delete Step 2 */}
      <BottomSheet visible={deleteDialog && deleteStep === 1} onClose={() => { setDeleteDialog(false); setDeleteStep(0); }} title="비밀번호 확인">
        <div style={{ fontSize: 13, color: C.textMuted, marginBottom: 16 }}>탈퇴를 위해 현재 비밀번호를 입력해주세요.</div>
        <Input label="비밀번호" type="password" value={deletePw} onChange={setDeletePw} placeholder="현재 비밀번호" />
        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <Btn label="취소" variant="secondary" onClick={() => { setDeleteDialog(false); setDeleteStep(0); }} />
          <Btn label="탈퇴하기" variant="danger" onClick={() => { setDeleteDialog(false); setDeleteStep(0); navigate('login'); }} />
        </div>
      </BottomSheet>

      <Toast message={toast} visible={!!toast} type="success" />
    </div>
  );
}

Object.assign(window, { HomeScreen, MyPageScreen, MOCK_BANDS, MOCK_PRACTICES, MOCK_PERFORMANCES });
