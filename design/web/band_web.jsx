
// ============================================================
// WEB — BAND SCREENS
// ============================================================
const W_BAND_LIST = [
  { bandId: 'b1', bandName: '루나틱', description: '홍대 기반 인디 록 밴드. 매주 수요일 합주합니다. 보컬, 기타, 드럼, 베이스 4인조.', myRole: 'LEADER' },
  { bandId: 'b2', bandName: '코드 크래셔', description: '헤비메탈을 주로 연주합니다. 열정 넘치는 멤버를 모집 중!', myRole: 'MEMBER' },
  { bandId: 'b3', bandName: '마그마', description: '감성 발라드부터 팝까지. 연세 있는 분들 환영합니다.', myRole: 'ADMIN' },
  { bandId: 'b4', bandName: '서울 재즈 클럽', description: '재즈 즉흥 연주를 즐기는 밴드. 매월 공연을 진행합니다.', myRole: null },
  { bandId: 'b5', bandName: '포크 라이더스', description: '통기타와 하모니카 중심의 포크 밴드입니다.', myRole: null },
];

const W_BAND_MEMBERS = [
  { bandMemberId: 'm1', memberId: '김밴드', role: 'LEADER' },
  { bandMemberId: 'm2', memberId: '이기타', role: 'ADMIN' },
  { bandMemberId: 'm3', memberId: '박드럼', role: 'MEMBER' },
  { bandMemberId: 'm4', memberId: '최베이스', role: 'MEMBER' },
  { bandMemberId: 'm5', memberId: '정보컬', role: 'MEMBER' },
];

const W_APPLICATIONS = [
  { appId: 'a1', memberId: '강신입', appliedAt: '2026-04-20 14:30', status: 'PENDING' },
  { appId: 'a2', memberId: '오연습', appliedAt: '2026-04-19 09:00', status: 'PENDING' },
  { appId: 'a3', memberId: '윤지원', appliedAt: '2026-04-18 17:20', status: 'APPROVED' },
  { appId: 'a4', memberId: '한승민', appliedAt: '2026-04-17 11:00', status: 'REJECTED' },
];

// ── Band List (Master-Detail) ─────────────────────────────────
function WBandListScreen({ navigate }) {
  const [search, setSearch] = React.useState('');
  const [selected, setSelected] = React.useState(null);
  const [createModal, setCreateModal] = React.useState(false);
  const [joinSheet, setJoinSheet] = React.useState(false);
  const [delegateDialog, setDelegateDialog] = React.useState(null);
  const [detailTab, setDetailTab] = React.useState('info');
  const [members, setMembers] = React.useState(W_BAND_MEMBERS);
  const [apps, setApps] = React.useState(W_APPLICATIONS);
  const [filterStatus, setFilterStatus] = React.useState('PENDING');
  const [toast, setToast] = React.useState('');
  const showToast = msg => { setToast(msg); setTimeout(() => setToast(''), 2000); };

  // Band Create form state
  const [bName, setBName] = React.useState('');
  const [bDesc, setBDesc] = React.useState('');
  const [creating, setCreating] = React.useState(false);

  const filtered = W_BAND_LIST.filter(b => b.bandName.includes(search) || b.description.includes(search));
  const detail = selected ? W_BAND_LIST.find(b => b.bandId === selected) : null;

  function handleCreate() {
    if (!bName || !bDesc) return;
    setCreating(true);
    setTimeout(() => { setCreating(false); setCreateModal(false); setBName(''); setBDesc(''); showToast('밴드가 생성되었습니다.'); }, 1000);
  }

  return (
    <div style={{ flex: 1, display: 'flex', overflow: 'hidden', background: WC.bg }}>
      {/* List panel */}
      <div style={{ width: 360, borderRight: `1px solid ${WC.border}`, display: 'flex', flexDirection: 'column', background: WC.surface, flexShrink: 0 }}>
        <div style={{ padding: '20px 20px 12px', borderBottom: `1px solid ${WC.border}` }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: WC.text }}>밴드 탐색</span>
            <WBtn label="밴드 만들기" icon="plus" small onClick={() => setCreateModal(true)} />
          </div>
          <div style={{ display: 'flex', alignItems: 'center', background: WC.card, borderRadius: 10, border: `1px solid ${WC.border}`, padding: '9px 12px', gap: 8 }}>
            <WIcon name="search" size={15} color={WC.textMuted} />
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="밴드 이름으로 검색..."
              style={{ flex: 1, background: 'none', border: 'none', outline: 'none', fontSize: 13, color: WC.text, fontFamily: 'inherit' }} />
          </div>
        </div>
        <div style={{ flex: 1, overflowY: 'auto', padding: '10px 12px' }}>
          {filtered.map(b => (
            <div key={b.bandId} onClick={() => { setSelected(b.bandId); setDetailTab('info'); }}
              style={{ display: 'flex', gap: 12, padding: '12px', borderRadius: 12, cursor: 'pointer', marginBottom: 4, background: selected === b.bandId ? WC.accentDim : 'transparent', border: `1px solid ${selected === b.bandId ? WC.accent + '44' : 'transparent'}`, transition: 'background 0.15s' }}>
              <div style={{ width: 44, height: 44, borderRadius: 10, background: WC.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <WIcon name="music" size={20} color={WC.accent} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: WC.text }}>{b.bandName}</span>
                  {b.myRole && <WRoleBadge role={b.myRole} />}
                </div>
                <div style={{ fontSize: 12, color: WC.textMuted, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{b.description}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detail panel */}
      <div style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {!detail ? (
          <WEmptyState icon="band" title="밴드를 선택하세요" sub="왼쪽 목록에서 밴드를 선택하면 상세 정보를 볼 수 있습니다." />
        ) : (
          <>
            <WTopBar title={detail.bandName} breadcrumb="밴드 탐색"
              actions={[
                detail.myRole === 'LEADER' || detail.myRole === 'ADMIN'
                  ? <WBtn key="set" label="밴드 설정" variant="secondary" icon="settings" small onClick={() => {}} />
                  : null,
                !detail.myRole
                  ? <WBtn key="join" label="가입 신청" small onClick={() => setJoinSheet(true)} />
                  : detail.myRole !== 'LEADER'
                    ? <WBtn key="leave" label="밴드 탈퇴" variant="secondary" small onClick={() => {}} />
                    : null,
              ].filter(Boolean)} />

            {/* Tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${WC.border}`, background: WC.surface, padding: '0 28px' }}>
              {[['info', '정보'], ['members', '멤버'], ['applications', '신청 현황']].map(([id, label]) => (
                <button key={id} onClick={() => setDetailTab(id)} style={{ padding: '12px 16px', background: 'none', border: 'none', cursor: 'pointer', fontSize: 14, fontWeight: detailTab === id ? 700 : 500, color: detailTab === id ? WC.accent : WC.textMuted, borderBottom: detailTab === id ? `2px solid ${WC.accent}` : '2px solid transparent', fontFamily: 'inherit' }}>{label}</button>
              ))}
            </div>

            <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px' }}>
              {detailTab === 'info' && (
                <>
                  <WImgPlaceholder width="100%" height={220} label="band cover image" borderRadius={16} />
                  <div style={{ marginTop: 20, marginBottom: 12 }}>
                    <div style={{ fontSize: 24, fontWeight: 800, color: WC.text, marginBottom: 8 }}>{detail.bandName}</div>
                    <div style={{ fontSize: 14, color: WC.textSub, lineHeight: 1.8 }}>{detail.description}</div>
                  </div>
                </>
              )}

              {detailTab === 'members' && (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
                  {members.map(m => (
                    <WCard key={m.bandMemberId}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                        <WAvatar name={m.memberId} size={40} />
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 14, fontWeight: 600, color: WC.text }}>{m.memberId}</div>
                          <WRoleBadge role={m.role} />
                        </div>
                        {detail.myRole === 'LEADER' && m.role !== 'LEADER' && (
                          <WBtn label="위임" small variant="ghost" onClick={() => setDelegateDialog(m)} />
                        )}
                      </div>
                    </WCard>
                  ))}
                </div>
              )}

              {detailTab === 'applications' && (
                detail.myRole === 'LEADER' || detail.myRole === 'ADMIN' ? (
                  <>
                    <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
                      {['PENDING', 'APPROVED', 'REJECTED'].map(s => (
                        <WChip key={s} label={{ PENDING: '대기', APPROVED: '승인', REJECTED: '거절' }[s]} selected={filterStatus === s} onClick={() => setFilterStatus(s)} />
                      ))}
                    </div>
                    {apps.filter(a => a.status === filterStatus).map(a => (
                      <WCard key={a.appId} style={{ marginBottom: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                          <WAvatar name={a.memberId} size={38} />
                          <div style={{ flex: 1 }}>
                            <div style={{ fontSize: 14, fontWeight: 600, color: WC.text }}>{a.memberId}</div>
                            <div style={{ fontSize: 12, color: WC.textMuted }}>{a.appliedAt}</div>
                          </div>
                          {a.status === 'PENDING' && (
                            <div style={{ display: 'flex', gap: 8 }}>
                              <WBtn label="승인" small onClick={() => { setApps(p => p.map(x => x.appId === a.appId ? { ...x, status: 'APPROVED' } : x)); showToast('승인되었습니다.'); }} />
                              <WBtn label="거절" small variant="danger" onClick={() => { setApps(p => p.map(x => x.appId === a.appId ? { ...x, status: 'REJECTED' } : x)); showToast('거절되었습니다.'); }} />
                            </div>
                          )}
                          {a.status !== 'PENDING' && <WBadge label={{ APPROVED: '승인됨', REJECTED: '거절됨' }[a.status]} color={a.status === 'APPROVED' ? WC.success : WC.danger} />}
                        </div>
                      </WCard>
                    ))}
                  </>
                ) : <WEmptyState icon="shield" title="권한이 없습니다" sub="리더 또는 관리자만 확인할 수 있습니다." />
              )}
            </div>
          </>
        )}
      </div>

      {/* Band Create Modal */}
      <WModal visible={createModal} onClose={() => setCreateModal(false)} title="밴드 만들기" width={480}>
        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 24 }}>
          <div style={{ width: 80, height: 80, borderRadius: '50%', background: WC.card, border: `2px dashed ${WC.border}`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', gap: 4 }}>
            <WIcon name="camera" size={24} color={WC.textMuted} />
            <span style={{ fontSize: 10, color: WC.textMuted }}>프로필</span>
          </div>
        </div>
        <WInput label="밴드 이름" value={bName} onChange={setBName} placeholder="밴드 이름을 입력하세요" maxLength={30} />
        <WInput label="밴드 소개" value={bDesc} onChange={setBDesc} placeholder="밴드를 소개해주세요..." maxLength={200} multiline />
        <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
          <WBtn label="취소" variant="secondary" onClick={() => setCreateModal(false)} fullWidth />
          <WBtn label="밴드 만들기" onClick={handleCreate} loading={creating} disabled={!bName || !bDesc} fullWidth />
        </div>
      </WModal>

      {/* Join Modal */}
      <WModal visible={joinSheet} onClose={() => setJoinSheet(false)} title="가입 신청" width={400}>
        {detail && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ width: 60, height: 60, borderRadius: 14, background: WC.accentDim, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
              <WIcon name="music" size={28} color={WC.accent} />
            </div>
            <div style={{ fontSize: 18, fontWeight: 700, color: WC.text, marginBottom: 10 }}>{detail.bandName}</div>
            <div style={{ fontSize: 14, color: WC.textSub, marginBottom: 6 }}>해당 밴드에 가입을 신청하시겠습니까?</div>
            <div style={{ fontSize: 12, color: WC.textMuted, marginBottom: 24 }}>신청 후 리더의 승인이 필요합니다.</div>
            <div style={{ display: 'flex', gap: 10 }}>
              <WBtn label="취소" variant="secondary" onClick={() => setJoinSheet(false)} fullWidth />
              <WBtn label="신청하기" onClick={() => { setJoinSheet(false); showToast('가입 신청이 완료되었습니다.'); }} fullWidth />
            </div>
          </div>
        )}
      </WModal>

      <WDialog visible={!!delegateDialog}
        title="리더 권한 위임"
        message={`${delegateDialog?.memberId} 님에게 리더 권한을 위임하시겠습니까?`}
        subText="위임 후 본인은 일반 멤버로 변경됩니다."
        confirmLabel="위임하기" cancelLabel="취소"
        onConfirm={() => { setDelegateDialog(null); showToast('권한이 위임되었습니다.'); }}
        onCancel={() => setDelegateDialog(null)} />

      <WToast message={toast} visible={!!toast} type="success" />
    </div>
  );
}

Object.assign(window, { WBandListScreen, W_BAND_LIST, W_BAND_MEMBERS });
