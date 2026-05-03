/**
 * BE `ProfileImageUploadService.ALLOWED_CONTENT_TYPE_TO_EXTS` 와 동일하게 유지.
 * 추가 시 BE 도 함께 업데이트.
 */
export const ALLOWED_IMAGE_MIME = ['image/jpeg', 'image/png', 'image/webp'] as const;
export type AllowedImageMime = (typeof ALLOWED_IMAGE_MIME)[number];

/** `<input accept>` 용. */
export const ALLOWED_IMAGE_ACCEPT = ALLOWED_IMAGE_MIME.join(',');

/**
 * BE `ProfileImageUploadService.MAX_PROFILE_IMAGE_BYTES` 와 동일하게 유지 (5MB).
 * 초과 시 BE 가 `413 FILE_SIZE_EXCEEDED` 반환.
 */
export const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function extFromMime(mime: string): string | null {
  switch (mime) {
    case 'image/jpeg':
      return 'jpg';
    case 'image/png':
      return 'png';
    case 'image/webp':
      return 'webp';
    default:
      return null;
  }
}

export function isAllowedImageMime(mime: string): mime is AllowedImageMime {
  return (ALLOWED_IMAGE_MIME as readonly string[]).includes(mime);
}
