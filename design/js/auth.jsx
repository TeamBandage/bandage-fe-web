
// ============================================================
// AUTH SCREENS: Login, Join, PasswordChange
// ============================================================

function LoginScreen({ navigate }) {
  const [email, setEmail] = React.useState('');
  const [pw, setPw] = React.useState('');
  const [showPw, setShowPw] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState('');

  function handleLogin() {
    if (!email || !pw) { setError('이메일과 비밀번호를 입력해주세요.'); return; }
    setLoading(true); setError('');
    setTimeout(() => { setLoading(false); navigate('home'); }, 1000);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <ScrollView style={{ padding: '0 24px' }}>
        {/* Logo */}
        <div style={{ paddingTop: 64, paddingBottom: 40, textAlign: 'center' }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: C.accentDim, borderRadius: 20, padding: '12px 24px',
            border: `1px solid ${C.accent}44`, marginBottom: 16,
          }}>
            <Icon name="guitar" size={28} color={C.accent} />
            <span style={{ fontSize: 28, fontWeight: 900, color: C.accent, letterSpacing: '-0.5px' }}>Bandage</span>
          </div>
          <div style={{ fontSize: 14, color: C.textMuted, marginTop: 8 }}>밴드 합주 & 공연 관리 플랫폼</div>
        </div>

        {/* Form */}
        <Input label="이메일" type="email" value={email} onChange={setEmail} placeholder="example@email.com" />
        <Input
          label="비밀번호" type={showPw ? 'text' : 'password'} value={pw} onChange={setPw} placeholder="비밀번호 입력"
          rightEl={
            <button onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
              <Icon name={showPw ? 'eyeOff' : 'eye'} size={18} color={C.textMuted} />
            </button>
          }
        />
        {error && <div style={{ fontSize: 13, color: C.danger, marginTop: -8, marginBottom: 12 }}>{error}</div>}

        <div style={{ marginTop: 4, marginBottom: 24 }}>
          <Btn label="로그인" onClick={handleLogin} loading={loading} />
        </div>

        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <span style={{ fontSize: 13, color: C.textMuted }}>아직 계정이 없으신가요? </span>
          <button onClick={() => navigate('join')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.accent, fontWeight: 700, fontFamily: 'inherit' }}>회원가입</button>
        </div>

        {/* Social placeholder */}
        <div style={{ borderTop: `1px solid ${C.border}`, paddingTop: 24 }}>
          <div style={{ textAlign: 'center', fontSize: 12, color: C.textMuted, marginBottom: 16 }}>소셜 로그인 (준비 중)</div>
          <div style={{ display: 'flex', gap: 10 }}>
            {['Google', 'Kakao', 'Apple'].map(s => (
              <div key={s} style={{ flex: 1, padding: '11px', background: C.card, borderRadius: 12, border: `1px solid ${C.border}`, textAlign: 'center', fontSize: 12, color: C.textMuted, opacity: 0.5 }}>{s}</div>
            ))}
          </div>
        </div>
      </ScrollView>
    </div>
  );
}

// ── Join Screen ──────────────────────────────────────────────
function JoinScreen({ navigate }) {
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
    else if (!/^\d{10,11}$/.test(contact.replace(/-/g, ''))) e.contact = '올바른 전화번호를 입력해주세요.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  function validateStep2() {
    const e = {};
    if (!email.trim()) e.email = '이메일을 입력해주세요.';
    else if (!/\S+@\S+\.\S+/.test(email)) e.email = '올바른 이메일 형식을 입력해주세요.';
    if (!pw) e.pw = '비밀번호를 입력해주세요.';
    else if (pw.length < 8) e.pw = '비밀번호는 8자 이상이어야 합니다.';
    if (pw !== pwConfirm) e.pwConfirm = '비밀번호가 일치하지 않습니다.';
    setErrors(e);
    return Object.keys(e).length === 0;
  }
  function handleNext() { if (validateStep1()) setStep(1); }
  function handleSubmit() {
    if (!validateStep2()) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); navigate('login'); }, 1200);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Header title="회원가입" onBack={() => step === 1 ? setStep(0) : navigate('login')} />
      <ScrollView style={{ padding: '20px 24px' }}>
        <div style={{ marginBottom: 24 }}>
          <StepIndicator steps={['기본 정보', '계정 설정']} current={step} />
        </div>

        {step === 0 && (
          <>
            <Input label="이름" value={name} onChange={setName} placeholder="홍길동" error={errors.name} />
            <Input label="연락처" type="tel" value={contact} onChange={setContact} placeholder="01012345678" error={errors.contact} />
          </>
        )}
        {step === 1 && (
          <>
            <Input label="이메일" type="email" value={email} onChange={setEmail} placeholder="example@email.com" error={errors.email} />
            <Input
              label="비밀번호" type={showPw ? 'text' : 'password'} value={pw} onChange={setPw}
              placeholder="8자 이상" error={errors.pw}
              rightEl={
                <button onClick={() => setShowPw(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}>
                  <Icon name={showPw ? 'eyeOff' : 'eye'} size={18} color={C.textMuted} />
                </button>
              }
            />
            <PasswordStrength password={pw} />
            <Input label="비밀번호 확인" type="password" value={pwConfirm} onChange={setPwConfirm} placeholder="비밀번호 재입력" error={errors.pwConfirm} />
          </>
        )}

        <div style={{ marginTop: 8 }}>
          {step === 0
            ? <Btn label="다음" onClick={handleNext} />
            : <Btn label="가입하기" onClick={handleSubmit} loading={loading} />
          }
        </div>
        <div style={{ textAlign: 'center', marginTop: 16 }}>
          <span style={{ fontSize: 13, color: C.textMuted }}>이미 계정이 있으신가요? </span>
          <button onClick={() => navigate('login')} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 13, color: C.accent, fontWeight: 700, fontFamily: 'inherit' }}>로그인</button>
        </div>
      </ScrollView>
    </div>
  );
}

// ── Password Change Screen ────────────────────────────────────
function PasswordChangeScreen({ navigate }) {
  const [orig, setOrig] = React.useState('');
  const [newPw, setNewPw] = React.useState('');
  const [newPwConfirm, setNewPwConfirm] = React.useState('');
  const [showOrig, setShowOrig] = React.useState(false);
  const [showNew, setShowNew] = React.useState(false);
  const [errors, setErrors] = React.useState({});
  const [loading, setLoading] = React.useState(false);
  const [success, setSuccess] = React.useState(false);

  function handleChange() {
    const e = {};
    if (!orig) e.orig = '현재 비밀번호를 입력해주세요.';
    if (!newPw || newPw.length < 8) e.newPw = '비밀번호는 8자 이상이어야 합니다.';
    if (newPw !== newPwConfirm) e.newPwConfirm = '비밀번호가 일치하지 않습니다.';
    setErrors(e);
    if (Object.keys(e).length) return;
    setLoading(true);
    setTimeout(() => { setLoading(false); setSuccess(true); setTimeout(() => navigate('login'), 1500); }, 1200);
  }

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', background: C.bg }}>
      <Header title="비밀번호 변경" onBack={() => navigate('mypage')} />
      <ScrollView style={{ padding: '24px' }}>
        <Input label="현재 비밀번호" type={showOrig ? 'text' : 'password'} value={orig} onChange={setOrig}
          placeholder="현재 비밀번호" error={errors.orig}
          rightEl={<button onClick={() => setShowOrig(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Icon name={showOrig ? 'eyeOff' : 'eye'} size={18} color={C.textMuted} /></button>} />
        <div style={{ height: 8 }} />
        <Input label="새 비밀번호" type={showNew ? 'text' : 'password'} value={newPw} onChange={setNewPw}
          placeholder="8자 이상" error={errors.newPw}
          rightEl={<button onClick={() => setShowNew(v => !v)} style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}><Icon name={showNew ? 'eyeOff' : 'eye'} size={18} color={C.textMuted} /></button>} />
        <PasswordStrength password={newPw} />
        <Input label="새 비밀번호 확인" type="password" value={newPwConfirm} onChange={setNewPwConfirm} placeholder="새 비밀번호 재입력" error={errors.newPwConfirm} />

        {success && (
          <div style={{ background: C.successDim, border: `1px solid ${C.success}`, borderRadius: 12, padding: '12px 16px', marginBottom: 16, fontSize: 13, color: C.success, textAlign: 'center' }}>
            비밀번호가 변경되었습니다. 로그인 화면으로 이동합니다...
          </div>
        )}
        <Btn label="변경하기" onClick={handleChange} loading={loading} disabled={success} />
      </ScrollView>
    </div>
  );
}

Object.assign(window, { LoginScreen, JoinScreen, PasswordChangeScreen });
