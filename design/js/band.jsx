
// ============================================================
// BAND SCREENS
// ============================================================

const BAND_LIST_DATA = [
  { bandId: 'b1', bandName: '루나틱', description: '홍대 기반 인디 록 밴드. 매주 수요일 합주합니다. 보컬, 기타, 드럼, 베이스로 구성된 4인조입니다.', profileImg: null },
  { bandId: 'b2', bandName: '코드 크래셔', description: '헤비메탈을 주로 연주합니다. 열정 넘치는 멤버를 모집 중!', profileImg: null },
  { bandId: 'b3', bandName: '마그마', description: '감성 발라드부터 팝까지. 연세 있는 분들 환영합니다.', profileImg: null },
  { bandId: 'b4', bandName: '서울 재즈 클럽', description: '재즈 즉흥 연주를 즐기는 밴드. 매월 공연을 진행합니다.', profileImg: null },
  { bandId: 'b5', bandName: '포크 라이더스', description: '통기타와 하모니카 중심의 포크 밴드입니다.', profileImg: null },
];

const BAND_MEMBERS = [
  { bandMemberId: 'm1', memberId: '김밴드', role: 'LEADER' },
  { bandMemberId: 'm2', memberId: '이기타', role: 'ADMIN' },
  { bandMemberId: 'm3', memberId: '박드럼', role: 'MEMBER' },
  { bandMemberId: 'm4', memberId: '최베이스', role: 'MEMBER' },
  { bandMemberId: 'm5', memberId: '정보컬', role: 'MEMBER' },
];

const BAND_APPLICATIONS = [
  { appId: 'a1', memberId: '강신입', appliedAt: '2026-04-20 14:30', status: 'PENDING' },
  { appId: 'a2', memberId: '오연습', appliedAt: '2026-04-19 09:00', status: 'PENDING' },
  { appId: 'a3', memberId: '윤지원', appliedAt: '2026-04-18 17:20', status: 'APPROVED' },
  { appId: 'a4', memberId: '한승민', appliedAt: '2026-04-17 11:00', status: 'REJECTED' },
];

// ── Band List ─────────────────────────────────────────────────
function BandListScreen({ navigate }) {
  const [search, setSearch] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const filtered = BAND_LIST_DATA.filter(b => b.bandName.includes(search) || b.description.includes(search));

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, position: 'relative', overflow: 'hidden' }}>
      <Header title="밴드 탐색" />
      {/* Search */}
      <div style={{ padding: '12px 16px', background: C.surface, borderBottom: `1px solid ${C.border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, padding: '10px 14px', gap: 8 }}>
          <Icon name="band" size={16} color={C.textMuted} />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="밴드 이름으로 검색..."
            style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 14, color: C.text, fontFamily: 'inherit' }} />
        </div>
      </div>

      <ScrollView style={{ padding: '12px 16px' }}>
        {filtered.length === 0
          ? <EmptyState icon="band" title="검색 결과가 없습니다" sub="다른 밴드 이름으로 검색해 보세요" />
          : filtered.map(b => (
            <Card key={b.bandId} onClick={() => navigate('bandDetail', { bandId: b.bandId, myRole: b.bandId === 'b1' ? 'LEADER' : b.bandId === 'b2' ? 'MEMBER' : null })}>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ width: 52, height: 52, borderRadius: 12, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon name="music" size={24} color={C.accent} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: 15, fontWeight: 700, color: C.text, marginBottom: 4 }}>{b.bandName}</div>
                  <div style={{ fontSize: 13, color: C.textMuted, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{b.description}</div>
                </div>
              </div>
            </Card>
          ))
        }
        {loading && <div style={{ display: 'flex', justifyContent: 'center', padding: 20 }}><Spinner /></div>}
        <div style={{ height: 80 }} />
      </ScrollView>

      <FAB onClick={() => navigate('bandCreate')} label="밴드 만들기" />
    </div>
  );
}

// ── Band Detail ───────────────────────────────────────────────
function BandDetailScreen({ navigate, params = {} }) {
  const { bandId = 'b1', myRole = 'LEADER' } = params;
  const band = BAND_LIST_DATA.find(b => b.bandId === bandId) || BAND_LIST_DATA[0];
  const [tab, setTab] = React.useState('info');
  const [joinSheet, setJoinSheet] = React.useState(false);
  const [delegateDialog, setDelegateDialog] = React.useState(null);
  const [filterStatus, setFilterStatus] = React.useState('PENDING');
  const [applications, setApplications] = React.useState(BAND_APPLICATIONS);
  const [members, setMembers] = React.useState(BAND_MEMBERS);
  const [toast, setToast] = React.useState('');
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  const tabs = ['info', 'members', 'applications'];
  const tabLabels = ['정보', '멤버', '신청 현황'];

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg, overflow: 'hidden' }}>
      <Header title={band.bandName} onBack={() => navigate('band')}
        rightActions={myRole === 'LEADER' || myRole === 'ADMIN'
          ? [<button key="set" onClick={() => {}} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Icon name="settings" size={20} color={C.textSub} /></button>]
          : null} />

      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${C.border}`, background: C.surface }}>
        {tabs.map((t, i) => (
          <button key={t} onClick={() => setTab(t)} style={{
            flex: 1, padding: '12px 0', background: 'none', border: 'none', cursor: 'pointer',
            fontSize: 14, fontWeight: tab === t ? 700 : 500,
            color: tab === t ? C.accent : C.textMuted,
            borderBottom: tab === t ? `2px solid ${C.accent}` : '2px solid transparent',
            fontFamily: 'inherit',
          }}>{tabLabels[i]}</button>
        ))}
      </div>

      <ScrollView style={{ padding: '16px' }}>
        {/* INFO TAB */}
        {tab === 'info' && (
          <>
            <ImgPlaceholder width="100%" height={180} label="band cover image" borderRadius={14} />
            <div style={{ marginTop: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 22, fontWeight: 800, color: C.text, marginBottom: 8 }}>{band.bandName}</div>
              <div style={{ fontSize: 14, color: C.textSub, lineHeight: 1.7 }}>{band.description}</div>
            </div>

            {!myRole && <Btn label="가입 신청" onClick={() => setJoinSheet(true)} />}
            {myRole === 'PENDING' && <Btn label="신청 취소" variant="secondary" onClick={() => showToast('신청이 취소되었습니다.')} />}
            {myRole && myRole !== 'LEADER' && <Btn label="밴드 탈퇴" variant="secondary" onClick={() => {}} />}
          </>
        )}

        {/* MEMBERS TAB */}
        {tab === 'members' && (
          <>
            {members.map(m => (
              <Card key={m.bandMemberId}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={m.memberId} size={40} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{m.memberId}</div>
                  </div>
                  <RoleBadge role={m.role} />
                  {myRole === 'LEADER' && m.role !== 'LEADER' && (
                    <button onClick={() => setDelegateDialog(m)} style={{ background: C.accentDim, border: `1px solid ${C.accent}44`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 11, color: C.accent, fontFamily: 'inherit', marginLeft: 6 }}>
                      권한 위임
                    </button>
                  )}
                </div>
              </Card>
            ))}
          </>
        )}

        {/* APPLICATIONS TAB */}
        {tab === 'applications' && (myRole === 'LEADER' || myRole === 'ADMIN') && (
          <>
            <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
              {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
                <Chip key={s} label={{ PENDING: '대기', APPROVED: '승인', REJECTED: '거절' }[s]}
                  selected={filterStatus === s} onClick={() => setFilterStatus(s)} />
              ))}
            </div>
            {applications.filter(a => a.status === filterStatus).map(a => (
              <Card key={a.appId}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <Avatar name={a.memberId} size={38} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 14, fontWeight: 600, color: C.text }}>{a.memberId}</div>
                    <div style={{ fontSize: 11, color: C.textMuted, marginTop: 2 }}>{a.appliedAt}</div>
                  </div>
                  {a.status === 'PENDING' && (
                    <div style={{ display: 'flex', gap: 6 }}>
                      <button onClick={() => { setApplications(prev => prev.map(x => x.appId === a.appId ? { ...x, status: 'APPROVED' } : x)); showToast('승인되었습니다.'); }}
                        style={{ background: C.successDim, border: `1px solid ${C.success}44`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: C.success, fontFamily: 'inherit' }}>승인</button>
                      <button onClick={() => { setApplications(prev => prev.map(x => x.appId === a.appId ? { ...x, status: 'REJECTED' } : x)); showToast('거절되었습니다.'); }}
                        style={{ background: C.dangerDim, border: `1px solid ${C.danger}44`, borderRadius: 8, padding: '6px 10px', cursor: 'pointer', fontSize: 12, color: C.danger, fontFamily: 'inherit' }}>거절</button>
                    </div>
                  )}
                  {a.status !== 'PENDING' && (
                    <Badge label={{ APPROVED: '승인됨', REJECTED: '거절됨' }[a.status]} color={a.status === 'APPROVED' ? C.success : C.danger} />
                  )}
                </div>
              </Card>
            ))}
            {applications.filter(a => a.status === filterStatus).length === 0 && (
              <EmptyState icon="user" title="신청 내역이 없습니다" />
            )}
          </>
        )}
        {tab === 'applications' && myRole !== 'LEADER' && myRole !== 'ADMIN' && (
          <EmptyState icon="shield" title="권한이 없습니다" sub="리더 또는 관리자만 확인할 수 있습니다." />
        )}
        <div style={{ height: 20 }} />
      </ScrollView>

      {/* Join Bottom Sheet */}
      <BottomSheet visible={joinSheet} onClose={() => setJoinSheet(false)} title="가입 신청">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, paddingBottom: 8 }}>
          <div style={{ width: 56, height: 56, borderRadius: 14, background: C.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Icon name="music" size={26} color={C.accent} />
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: C.text }}>{band.bandName}</div>
          <div style={{ fontSize: 14, color: C.textSub, textAlign: 'center' }}>해당 밴드에 가입을 신청하시겠습니까?</div>
          <div style={{ fontSize: 12, color: C.textMuted, textAlign: 'center' }}>신청 후 리더의 승인이 필요합니다.</div>
        </div>
        <div style={{ display: 'flex', gap: 8, marginTop: 16 }}>
          <Btn label="취소" variant="secondary" onClick={() => setJoinSheet(false)} />
          <Btn label="신청하기" onClick={() => { setJoinSheet(false); showToast('가입 신청이 완료되었습니다.'); }} />
        </div>
      </BottomSheet>

      {/* Delegate Dialog */}
      <Dialog visible={!!delegateDialog}
        title="리더 권한 위임"
        message={`${delegateDialog?.memberId} 님에게 리더 권한을 위임하시겠습니까?`}
        subText="위임 후 본인은 일반 멤버로 변경됩니다."
        confirmLabel="위임하기" cancelLabel="취소"
        onConfirm={() => { setDelegateDialog(null); showToast('권한이 위임되었습니다.'); }}
        onCancel={() => setDelegateDialog(null)} />

      <Toast message={toast} visible={!!toast} type="success" />
    </div>
  );
}

// ── Band Create ───────────────────────────────────────────────
function BandCreateScreen({ navigate }) {
  const [name, setName] = React.useState('');
  const [desc, setDesc] = React.useState('');
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [imgSheet, setImgSheet] = React.useState(false);

  function handleCreate() {
    const e = {};
    if (!name.trim()) e.name = '밴드 이름을 입력해주세요.';
    if (!desc.trim()) e.desc = '밴드 소개를 입력해주세요.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('bandDetail', { bandId: 'b1', myRole: 'LEADER' }); }, 1200);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Header title="밴드 만들기" onBack={() => navigate('band')}
        rightActions={[<button key="x" onClick={() => navigate('band')} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4 }}><Icon name="close" size={20} color={C.textSub} /></button>]} />
      <ScrollView style={{ padding: '24px 20px' }}>
        {/* Profile image upload */}
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 28 }}>
          <div onClick={() => setImgSheet(true)} style={{ position: 'relative', cursor: 'pointer' }}>
            <div style={{ width: 90, height: 90, borderRadius: '50%', background: C.card, border: `2px dashed ${C.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon name="camera" size={28} color={C.textMuted} />
            </div>
            <div style={{ position: 'absolute', bottom: 0, right: 0, background: C.accent, borderRadius: '50%', width: 26, height: 26, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2px solid ${C.bg}` }}>
              <Icon name="plus" size={14} color="#fff" />
            </div>
          </div>
        </div>

        <Input label="밴드 이름" value={name} onChange={setName} placeholder="밴드 이름을 입력하세요" maxLength={30} error={errors.name} />
        <Input label="밴드 소개" value={desc} onChange={setDesc} placeholder="밴드를 소개해주세요..." maxLength={200} error={errors.desc} multiline />

        <div style={{ marginTop: 8 }}>
          <Btn label="밴드 만들기" onClick={handleCreate} loading={loading} disabled={!name.trim() || !desc.trim()} />
        </div>
      </ScrollView>

      <BottomSheet visible={imgSheet} onClose={() => setImgSheet(false)} title="사진 선택">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <button onClick={() => setImgSheet(false)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px', cursor: 'pointer', fontSize: 15, color: C.text, fontFamily: 'inherit' }}>📷 카메라로 촬영</button>
          <button onClick={() => setImgSheet(false)} style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 12, padding: '14px', cursor: 'pointer', fontSize: 15, color: C.text, fontFamily: 'inherit' }}>🖼 갤러리에서 선택</button>
        </div>
      </BottomSheet>
    </div>
  );
}

Object.assign(window, { BandListScreen, BandDetailScreen, BandCreateScreen });
