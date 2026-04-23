/**
 * Auth screens: Login, Join, PasswordChange.
 */
import { h } from '../core.js';
import { Icon } from '../icons.js';
import { Button, Field, PasswordStrength, Steps, showToast } from '../components.js';

function AuthBrand(tagline = '밴드의 모든 합주와 공연을<br/>하나의 플랫폼에서 관리하세요.') {
  return h('div', { class: 'auth-brand' },
    h('div', { class: 'auth-brand__rings' },
      h('div', { class: 'auth-brand__ring auth-brand__ring--lg' }),
      h('div', { class: 'auth-brand__ring auth-brand__ring--md' }),
      h('div', { class: 'auth-brand__ring auth-brand__ring--sm' }),
    ),
    h('div', { class: 'auth-brand__content' },
      h('div', { class: 'auth-brand__logo' }, Icon('guitar', { size: 34, color: 'oklch(0.62 0.22 250)' })),
      h('div', { class: 'auth-brand__title' }, 'Bandage'),
      h('div', { class: 'auth-brand__tagline', html: tagline }),
      h('div', { class: 'auth-brand__features' },
        ...['합주 일정 관리', '세션 배정', '공연 연결'].map(f =>
          h('div', { class: 'auth-brand__feature' },
            Icon('check', { size: 12, color: 'oklch(0.62 0.22 250)' }), f))
      )
    )
  );
}

export function LoginScreen({ navigate }) {
  const state = { email: '', pw: '', showPw: false, error: '', loading: false };
  const root = h('div', { class: 'auth-split' });

  function render() {
    root.innerHTML = '';
    root.appendChild(AuthBrand());
    root.appendChild(h('div', { class: 'auth-form' },
      h('div', { class: 'auth-form__inner' },
        h('div', { class: 'auth-form__heading' },
          h('div', { class: 'auth-form__title' }, '로그인'),
          h('div', { class: 'auth-form__subtitle' }, 'Bandage 계정으로 시작하세요')
        ),
        Field({ label: '이메일', type: 'email', value: state.email, placeholder: 'example@email.com',
          onChange: v => state.email = v }),
        Field({ label: '비밀번호', type: state.showPw ? 'text' : 'password', value: state.pw,
          placeholder: '비밀번호 입력', onChange: v => state.pw = v,
          rightEl: h('button', { type: 'button', onClick: () => { state.showPw = !state.showPw; render(); } },
            Icon(state.showPw ? 'eyeOff' : 'eye', { size: 16, color: '#6B6B80' })) }),
        state.error && h('div', { style: { fontSize: '13px', color: 'var(--danger)', marginBottom: '12px' } }, state.error),
        Button({ label: '로그인', loading: state.loading, fullWidth: true,
          onClick: () => {
            if (!state.email || !state.pw) { state.error = '이메일과 비밀번호를 입력해주세요.'; return render(); }
            state.loading = true; state.error = ''; render();
            setTimeout(() => navigate('home'), 800);
          } }),
        h('div', { style: { textAlign: 'center', margin: '20px 0 0', fontSize: '14px', color: 'var(--text-muted)' } },
          '아직 계정이 없으신가요? ',
          h('button', { onClick: () => navigate('join'),
            style: { color: 'var(--accent)', fontWeight: 700, fontSize: '14px' } }, '회원가입')
        ),
        h('div', { class: 'social-group' },
          h('div', { class: 'social-group__label' }, '소셜 로그인 (준비 중)'),
          h('div', { class: 'social-group__buttons' },
            ...['Google', 'Kakao', 'Apple'].map(s => h('div', { class: 'social-btn' }, s))
          )
        )
      )
    ));
  }
  render();
  return root;
}

export function JoinScreen({ navigate }) {
  const state = { step: 0, name: '', contact: '', email: '', pw: '', pwConfirm: '', showPw: false, errors: {}, loading: false };
  const root = h('div', { class: 'auth-split' });

  function render() {
    root.innerHTML = '';
    root.appendChild(AuthBrand('밴드 합주 & 공연 관리 플랫폼'));

    const inner = h('div', { class: 'auth-form__inner' },
      h('div', { class: 'auth-form__heading' },
        h('div', { class: 'auth-form__title' }, '회원가입'),
        h('div', { class: 'auth-form__subtitle' }, 'Bandage 계정을 만들어 시작하세요')
      ),
      Steps(['기본 정보', '계정 설정'], state.step)
    );

    if (state.step === 0) {
      inner.append(
        Field({ label: '이름', value: state.name, placeholder: '홍길동', error: state.errors.name,
          onChange: v => state.name = v }),
        Field({ label: '연락처', type: 'tel', value: state.contact, placeholder: '01012345678', error: state.errors.contact,
          onChange: v => state.contact = v }),
        Button({ label: '다음', fullWidth: true, onClick: () => {
          const e = {};
          if (!state.name.trim()) e.name = '이름을 입력해주세요.';
          if (!state.contact.trim()) e.contact = '연락처를 입력해주세요.';
          state.errors = e;
          if (Object.keys(e).length === 0) { state.step = 1; }
          render();
        }})
      );
    } else {
      inner.append(
        Field({ label: '이메일', type: 'email', value: state.email, placeholder: 'example@email.com',
          error: state.errors.email, onChange: v => state.email = v }),
        Field({ label: '비밀번호', type: state.showPw ? 'text' : 'password', value: state.pw, placeholder: '8자 이상',
          error: state.errors.pw, onChange: v => { state.pw = v; render(); },
          rightEl: h('button', { type: 'button', onClick: () => { state.showPw = !state.showPw; render(); } },
            Icon(state.showPw ? 'eyeOff' : 'eye', { size: 16, color: '#6B6B80' })) }),
        PasswordStrength(state.pw),
        Field({ label: '비밀번호 확인', type: 'password', value: state.pwConfirm, placeholder: '비밀번호 재입력',
          error: state.errors.pwConfirm, onChange: v => state.pwConfirm = v }),
        h('div', { style: { display: 'flex', gap: '10px' } },
          Button({ label: '이전', variant: 'secondary', fullWidth: true, onClick: () => { state.step = 0; render(); } }),
          Button({ label: '가입하기', loading: state.loading, fullWidth: true, onClick: () => {
            const e = {};
            if (!state.email || !/\S+@\S+\.\S+/.test(state.email)) e.email = '올바른 이메일 형식을 입력해주세요.';
            if (!state.pw || state.pw.length < 8) e.pw = '비밀번호는 8자 이상이어야 합니다.';
            if (state.pw !== state.pwConfirm) e.pwConfirm = '비밀번호가 일치하지 않습니다.';
            state.errors = e;
            if (Object.keys(e).length === 0) {
              state.loading = true; render();
              setTimeout(() => { showToast('회원가입이 완료되었습니다.'); navigate('login'); }, 900);
            } else render();
          }})
        )
      );
    }

    inner.append(
      h('div', { style: { textAlign: 'center', marginTop: '20px', fontSize: '14px', color: 'var(--text-muted)' } },
        '이미 계정이 있으신가요? ',
        h('button', { onClick: () => navigate('login'),
          style: { color: 'var(--accent)', fontWeight: 700, fontSize: '14px' } }, '로그인')
      )
    );
    root.appendChild(h('div', { class: 'auth-form', style: { width: '520px' } }, inner));
  }
  render();
  return root;
}

export function PasswordChangeScreen({ navigate }) {
  const state = { orig: '', newPw: '', confirm: '', errors: {}, loading: false };
  const root = h('div', { class: 'pane-detail__body' });

  function render() {
    root.innerHTML = '';
    const body = h('div', { style: { maxWidth: '480px' } },
      h('div', { style: { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '32px' } },
        h('button', { class: 'btn btn--secondary btn--sm', onClick: () => navigate('mypage') },
          Icon('back', { size: 14 })),
        h('div', {},
          h('div', { style: { fontSize: '22px', fontWeight: 800 } }, '비밀번호 변경'),
          h('div', { style: { fontSize: '13px', color: 'var(--text-muted)', marginTop: '2px' } },
            '변경 후 자동으로 로그아웃됩니다.')
        )
      ),
      h('div', { class: 'card' },
        Field({ label: '현재 비밀번호', type: 'password', value: state.orig, error: state.errors.orig,
          onChange: v => state.orig = v }),
        Field({ label: '새 비밀번호', type: 'password', value: state.newPw, placeholder: '8자 이상',
          error: state.errors.newPw, onChange: v => { state.newPw = v; render(); } }),
        PasswordStrength(state.newPw),
        Field({ label: '새 비밀번호 확인', type: 'password', value: state.confirm, error: state.errors.confirm,
          onChange: v => state.confirm = v }),
        Button({ label: '변경하기', loading: state.loading, fullWidth: true, onClick: () => {
          const e = {};
          if (!state.orig) e.orig = '현재 비밀번호를 입력해주세요.';
          if (!state.newPw || state.newPw.length < 8) e.newPw = '8자 이상 입력해주세요.';
          if (state.newPw !== state.confirm) e.confirm = '비밀번호가 일치하지 않습니다.';
          state.errors = e;
          if (Object.keys(e).length === 0) {
            state.loading = true; render();
            setTimeout(() => { showToast('비밀번호가 변경되었습니다.'); navigate('login'); }, 900);
          } else render();
        }})
      )
    );
    root.appendChild(body);
  }
  render();
  return root;
}
