/**
 * BE 의 `CloudFrontUrlResolver` 가 외부 URL(google profile picture, kakao thumbnail 등)을
 * 무조건 `${cdn}/${input}` 으로 prefix 붙여서 깨진 URL 을 응답하는 케이스가 있다.
 * (예: `https://<cdn>/https://lh3.googleusercontent.com/...`).
 *
 * BE 가 정상화될 때까지 FE 에서 임시로 정규화한다 — 입력 안에 `https?://` 가 두 번 등장하면
 * 두 번째 등장부터를 그대로 잘라서 반환.
 *
 * BE 수정 후에도 멱등 — 정상 URL 은 그대로 통과.
 */
export function normalizeProfileImgUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // URL 안에서 두 번째 `http(s)://` 의 위치를 찾는다.
  const protoMatches = [...trimmed.matchAll(/https?:\/\//g)];
  if (protoMatches.length >= 2) {
    const second = protoMatches[1]!;
    return trimmed.slice(second.index);
  }
  return trimmed;
}
