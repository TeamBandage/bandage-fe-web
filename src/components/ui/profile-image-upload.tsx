'use client';

import { ImagePlus, Loader2 } from 'lucide-react';
import { useEffect, useId, useRef, useState } from 'react';

import {
  ALLOWED_IMAGE_ACCEPT,
  MAX_IMAGE_SIZE_BYTES,
  normalizeProfileImgUrl,
  uploadProfileImage,
  type UploadDomain,
} from '@/global/upload';
import { useToast } from '@/hooks/useToast';
import { cn } from '@/lib/cn';

import { Button } from './button';

interface Props {
  /** 현재 표시할 이미지 URL (BE 가 변환한 CloudFront URL). 미설정 시 placeholder. */
  value: string | null;
  /** 업로드 완료 시 BE 가 PATCH 시 받을 objectKey 를 콜백. */
  onChange: (objectKey: string) => void;
  domain: UploadDomain;
  /** domain=BAND 인 경우 필수. */
  bandId?: string;
  label?: string;
  hint?: string;
  /** 외부에서 disable. 업로드 중 자체 disable 은 별개. */
  disabled?: boolean;
  /** 미리보기 이미지 크기. default 96px. */
  size?: number;
}

/**
 * 프로필 이미지 업로드 — presign 발급 + S3 PUT + objectKey 콜백.
 * 호출 측은 onChange 로 받은 objectKey 를 PATCH 의 `profileImg` 로 전달한다.
 *
 * 클리어(null 설정) 는 BE 가 현재 PATCH null 을 "변경 없음" 으로 해석하므로 미지원.
 * 클리어 기능 도입 시 BE PATCH 시멘틱 합의 필요 (별도 BD 이슈).
 */
export function ProfileImageUpload({
  value,
  onChange,
  domain,
  bandId,
  label = '프로필 이미지',
  hint,
  disabled,
  size = 96,
}: Props) {
  const id = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const toast = useToast();
  const [uploading, setUploading] = useState(false);
  /** 업로드 직후 BE 가 응답에 CloudFront URL 을 반영하기 전, 짧은 시간 동안 로컬 미리보기. */
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  /** 외부 URL 이 깨졌을 때 placeholder 로 fallback. value 가 바뀌면 reset. */
  const [errored, setErrored] = useState(false);
  useEffect(() => {
    setErrored(false);
  }, [value]);

  const isDisabled = disabled || uploading;
  const normalizedValue = normalizeProfileImgUrl(value);
  const display = errored ? null : (localPreview ?? normalizedValue);

  function trigger() {
    if (isDisabled) return;
    inputRef.current?.click();
  }

  async function handleFile(file: File) {
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      toast.error('이미지 크기는 5MB 이하여야 합니다.');
      return;
    }
    setUploading(true);
    const previewUrl = URL.createObjectURL(file);
    setLocalPreview(previewUrl);
    try {
      const objectKey = await uploadProfileImage({ file, domain, bandId });
      onChange(objectKey);
      toast.success('이미지를 업로드했습니다.');
    } catch (err) {
      const message = err instanceof Error ? err.message : '이미지 업로드에 실패했습니다.';
      toast.error(message);
      setLocalPreview(null);
      URL.revokeObjectURL(previewUrl);
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label htmlFor={id} className="text-foreground text-sm font-medium">
          {label}
        </label>
      )}
      <div className="flex items-center gap-3">
        <button
          type="button"
          id={id}
          onClick={trigger}
          disabled={isDisabled}
          aria-label={display ? '프로필 이미지 변경' : '프로필 이미지 업로드'}
          className={cn(
            'bg-card-hover text-foreground-sub relative flex items-center justify-center overflow-hidden rounded-md transition-opacity',
            isDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:opacity-80',
          )}
          style={{ width: size, height: size }}
        >
          {display ? (
            // eslint-disable-next-line @next/next/no-img-element -- CloudFront/Blob/외부 OAuth provider URL 모두 허용
            <img
              src={display}
              alt={label}
              className="h-full w-full object-cover"
              onError={() => {
                if (localPreview) {
                  setLocalPreview(null);
                } else {
                  setErrored(true);
                }
              }}
            />
          ) : (
            <ImagePlus className="h-6 w-6" />
          )}
          {uploading && (
            <span className="bg-bg/60 absolute inset-0 flex items-center justify-center">
              <Loader2 className="h-5 w-5 animate-spin" />
            </span>
          )}
        </button>
        <div className="flex flex-col gap-1.5">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={trigger}
            disabled={isDisabled}
          >
            {display ? '이미지 변경' : '이미지 선택'}
          </Button>
          {hint && <p className="text-foreground-muted text-xs">{hint}</p>}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_IMAGE_ACCEPT}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          if (file) void handleFile(file);
        }}
      />
    </div>
  );
}
