/** Kakao authorize → callback 사이의 CSRF 방지 state. sessionStorage 에 1회용 저장. */
const KEY = 'bandage-oauth-kakao-state';

export function createKakaoState(): string {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  const state = Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  sessionStorage.setItem(KEY, state);
  return state;
}

export function consumeKakaoState(): string | null {
  const state = sessionStorage.getItem(KEY);
  if (state) sessionStorage.removeItem(KEY);
  return state;
}
