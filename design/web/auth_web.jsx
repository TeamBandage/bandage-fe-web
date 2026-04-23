
// ============================================================
// WEB — AUTH SCREENS
// ============================================================

function WLoginScreen({ navigate }) {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  function handleLogin() {
    if (!email || !pw) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    setLoading(true); setError('');
    setTimeout(() => { setLoading(false); navigate('home'); }, 900);
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: WC.bg }}>
      {/* Left brand panel */}
      <div style={{ flex: 1, background: `linear-gradient(145deg, #0D0D1E 0%, #111128 100%)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, borderRight: `1px solid ${WC.border}`, position: 'relative', overflow: 'hidden' }}>
        {/* Decorative circles */}
        <div style={{ position: 'absolute', width: 400, height: 400, borderRadius: '50%', border: `1px solid ${WC.accent}18`, top: '10%', left: '50%', transform: 'translateX(-50%)' }} />
        <div style={{ position: 'absolute', width: 280, height: 280, borderRadius: '50%', border: `1px solid ${WC.accent}22`, top: '20%', left: '50%', transform: 'translateX(-50%)' }} />
        <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: `${WC.accent}0A`, top: '25%', left: '50%', transform: 'translateX(-50%)' }} />

        <div style={{ position: 'relative', textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: WC.accentDim, border: `1px solid ${WC.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <WIcon name="guitar" size={34} color={WC.accent} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: WC.text, letterSpacing: '-1px', marginBottom: 12 }}>Bandage</div>
          <div style={{ fontSize: 16, color: WC.textSub, lineHeight: 1.7, maxWidth: 280 }}>밴드의 모든 합주와 공연을<br/>하나의 플랫폼에서 관리하세요.</div>
          <div style={{ display: 'flex', gap: 12, marginTop: 40, justifyContent: 'center' }}>
            {['합주 일정 관리', '세션 배정', '공연 연결'].map(f => (
              <div key={f} style={{ background: WC.card, border: `1px solid ${WC.border}`, borderRadius: 20, padding: '8px 16px', fontSize: 12, color: WC.textSub, display: 'flex', alignItems: 'center', gap: 6 }}>
                <WIcon name="check" size={12} color={WC.accent} />{f}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form panel */}
      <div style={{ width: 480, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 60px', background: WC.surface }}>
        <div style={{ width: '100%', maxWidth: 360 }}>
          <div style={{ marginBottom: 36 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: WC.text, marginBottom: 8 }}>로그인</div>
            <div style={{ fontSize: 14, color: WC.textMuted }}>Bandage 계정으로 시작하세요</div>
          </div>

          <WInput label="이메일" type="email" value={email} onChange={setEmail} placeholder="example@email.com" />
          <WInput label="비밀번호" type={showPw ? 'text' : 'password'} value={pw} onChange={setPw} placeholder="비밀번호 입력"
            rightEl={<button onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><WIcon name={showPw ? 'eyeOff' : 'eye'} size={17} color={WC.textMuted} /></button>} />

          {error && <div style={{ fontSize: 13, color: WC.danger, marginTop: -10, marginBottom: 14 }}>{error}</div>}

          <div style={{ marginTop: 4, marginBottom: 20 }}>
            <WBtn label="로그인" onClick={handleLogin} loading={loading} fullWidth />
          </div>

          <div style={{ textAlign: 'center', marginBottom: 28, fontSize: 14, color: WC.textMuted }}>
            아직 계정이 없으신가요?{' '}
            <button onClick={() => navigate('join')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: WC.accent, fontWeight: 700, fontFamily: 'inherit', fontSize: 14 }}>회원가입</button>
          </div>

          <div style={{ borderTop: `1px solid ${WC.border}`, paddingTop: 24 }}>
            <div style={{ textAlign: 'center', fontSize: 12, color: WC.textMuted, marginBottom: 14 }}>소셜 로그인 (준비 중)</div>
            <div style={{ display: 'flex', gap: 10 }}>
              {['Google', 'Kakao', 'Apple'].map(s => (
                <div key={s} style={{ flex: 1, padding: '10px', background: WC.card, borderRadius: 10, border: `1px solid ${WC.border}`, textAlign: 'center', fontSize: 13, color: WC.textMuted, opacity: 0.5 }}>{s}</div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Join Screen ───────────────────────────────────────────────
function WJoinScreen({ navigate }) {
  const [step, setStep] = React.useState(0);
  const [name, setName] = React.useState('');
  const [contact, setContact] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [pwConfirm, setPwConfirm] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);

  function validateStep1() {
    const e = {};
    if (!name.trim()) e.name = '이름을 입력해주세요.';
    if (!contact.trim()) e.contact = '연락처를 입력해주세요.';
    setErrors(e); return Object.keys(e).length === 0;
  }
  function validateStep2() {
    const e = {};
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) e.email = '올바른 이메일 형식을 입력해주세요.';
    if (!pw || pw.length < 8) e.pw = '비밀번호는 8자 이상이어야 합니다.';
    if (pw !== pwConfirm) e.pwConfirm = '비밀번호가 일치하지 않습니다.';
    setErrors(e); return Object.keys(e).length === 0;
  }

  return (
    <div style={{ display: 'flex', width: '100%', height: '100%', background: WC.bg }}>
      <div style={{ flex: 1, background: `linear-gradient(145deg, #0D0D1E, #111128)`, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: 60, borderRight: `1px solid ${WC.border}` }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ width: 72, height: 72, borderRadius: 20, background: WC.accentDim, border: `1px solid ${WC.accent}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px' }}>
            <WIcon name="guitar" size={34} color={WC.accent} />
          </div>
          <div style={{ fontSize: 40, fontWeight: 900, color: WC.text, letterSpacing: '-1px', marginBottom: 12 }}>Bandage</div>
          <div style={{ fontSize: 15, color: WC.textSub }}>밴드 합주 & 공연 관리 플랫폼</div>
        </div>
      </div>

      <div style={{ width: 520, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '0 60px', background: WC.surface }}>
        <div style={{ width: '100%', maxWidth: 400 }}>
          <div style={{ marginBottom: 32 }}>
            <div style={{ fontSize: 26, fontWeight: 800, color: WC.text, marginBottom: 8 }}>회원가입</div>
            <div style={{ fontSize: 14, color: WC.textMuted }}>Bandage 계정을 만들어 시작하세요</div>
          </div>
          <WStepIndicator steps={['기본 정보', '계정 설정']} current={step} />

          {step === 0 && (
            <>
              <WInput label="이름" value={name} onChange={setName} placeholder="홍길동" error={errors.name} />
              <WInput label="연락처" type="tel" value={contact} onChange={setContact} placeholder="01012345678" error={errors.contact} />
              <WBtn label="다음" onClick={() => { if(validateStep1()) setStep(1); }} fullWidth />
            </>
          )}
          {step === 1 && (
            <>
              <WInput label="이메일" type="email" value={email} onChange={setEmail} placeholder="example@email.com" error={errors.email} />
              <WInput label="비밀번호" type={showPw ? 'text' : 'password'} value={pw} onChange={setPw} placeholder="8자 이상" error={errors.pw}
                rightEl={<button onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><WIcon name={showPw ? 'eyeOff' : 'eye'} size={17} color={WC.textMuted} /></button>} />
              <WPasswordStrength password={pw} />
              <WInput label="비밀번호 확인" type="password" value={pwConfirm} onChange={setPwConfirm} placeholder="비밀번호 재입력" error={errors.pwConfirm} />
              <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
                <WBtn label="이전" variant="secondary" onClick={() => setStep(0)} fullWidth />
                <WBtn label="가입하기" onClick={() => { if(validateStep2()) { setLoading(true); setTimeout(() => { setLoading(false); navigate('login'); }, 1000); } }} loading={loading} fullWidth />
              </div>
            </>
          )}
          <div style={{ textAlign: 'center', marginTop: 20, fontSize: 14, color: WC.textMuted }}>
            이미 계정이 있으신가요?{' '}
            <button onClick={() => navigate('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', color: WC.accent, fontWeight: 700, fontFamily: 'inherit', fontSize: 14 }}>로그인</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Password Change ────────────────────────────────────────────
function WPasswordChangeScreen({ navigate }) {
  const [orig, setOrig] = React.useState('');
  const [newPw, setNewPw] = React.useState('');
  const [confirm, setConfirm] = React.useState('');
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [done, setDone] = React.useState(false);

  function handleChange() {
    const e = {};
    if (!orig) e.orig = '현재 비밀번호를 입력해주세요.';
    if (!newPw || newPw.length < 8) e.newPw = '8자 이상 입력해주세요.';
    if (newPw !== confirm) e.confirm = '비밀번호가 일치하지 않습니다.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setDone(true); setTimeout(() => navigate('login'), 1500); }, 1200);
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: '40px 40px', background: WC.bg }}>
      <div style={{ maxWidth: 480 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 32 }}>
          <button onClick={() => navigate('mypage')} style={{ background: WC.card, border: `1px solid ${WC.border}`, borderRadius: 8, padding: '8px 12px', cursor: 'pointer', display: 'flex' }}>
            <WIcon name="back" size={16} color={WC.textSub} />
          </button>
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: WC.text }}>비밀번호 변경</div>
            <div style={{ fontSize: 13, color: WC.textMuted, marginTop: 2 }}>변경 후 자동으로 로그아웃됩니다.</div>
          </div>
        </div>

        <WCard>
          <WInput label="현재 비밀번호" type="password" value={orig} onChange={setOrig} placeholder="현재 비밀번호" error={errors.orig} />
          <div style={{ height: 4 }} />
          <WInput label="새 비밀번호" type="password" value={newPw} onChange={setNewPw} placeholder="8자 이상" error={errors.newPw} />
          <WPasswordStrength password={newPw} />
          <WInput label="새 비밀번호 확인" type="password" value={confirm} onChange={setConfirm} placeholder="새 비밀번호 재입력" error={errors.confirm} />
          {done && <div style={{ background: WC.successDim, border: `1px solid ${WC.success}`, borderRadius: 10, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: WC.success }}>비밀번호가 변경되었습니다. 로그인 화면으로 이동합니다...</div>}
          <div style={{ marginTop: 4 }}>
            <WBtn label="변경하기" onClick={handleChange} loading={loading} disabled={done} fullWidth />
          </div>
        </WCard>
      </div>
    </div>
  );
}

Object.assign(window, { WLoginScreen, WJoinScreen, WPasswordChangeScreen });
