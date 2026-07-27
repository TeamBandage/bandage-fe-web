'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProfileImageUpload } from '@/components/ui/profile-image-upload';
import {
  ResponsiveSheet,
  ResponsiveSheetBody,
  ResponsiveSheetContent,
  ResponsiveSheetFooter,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
} from '@/components/ui/responsive-sheet';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useDeleteBand } from '@/domain/band/hooks/useDeleteBand';
import { useUpdateBand } from '@/domain/band/hooks/useUpdateBand';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  band: { bandId: string; bandName: string; description?: string; profileImg?: string };
}

/**
 * 밴드 설정 모달 — 정보 수정 / 사진 변경 / 삭제 3탭.
 * 사진 변경: presigned URL 발급(`/uploads/profile-image/presigned-url`) → S3 PUT → PATCH `profileImg=objectKey`.
 */
export function BandSettingsModal({ open, onOpenChange, band }: Props) {
  const router = useRouter();
  const toast = useToast();
  const [tab, setTab] = useState<'info' | 'image' | 'delete'>('info');

  // 정보
  const [name, setName] = useState(band.bandName);
  const [description, setDescription] = useState(band.description ?? '');

  // 삭제
  const [confirmText, setConfirmText] = useState('');

  const updateMutation = useUpdateBand(band.bandId, {
    onSuccess: () => {
      toast.success('밴드 정보를 저장했습니다.');
      onOpenChange(false);
    },
    onError: (err) => toast.error(err.message || '저장에 실패했습니다.'),
  });

  const deleteMutation = useDeleteBand(band.bandId, {
    onSuccess: () => {
      toast.success('밴드를 삭제했습니다.');
      onOpenChange(false);
      router.replace(ROUTES.BANDS);
    },
    onError: (err) => toast.error(err.message || '삭제에 실패했습니다.'),
  });

  function handleSaveInfo() {
    updateMutation.mutate({ name: name.trim(), description: description.trim() || undefined });
  }

  function handleImageUploaded(objectKey: string) {
    updateMutation.mutate({ profileImg: objectKey });
  }

  function handleDelete() {
    if (confirmText !== band.bandName) {
      toast.error('밴드 이름을 정확히 입력해 주세요.');
      return;
    }
    deleteMutation.mutate();
  }

  return (
    <ResponsiveSheet open={open} onOpenChange={onOpenChange}>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>밴드 설정</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <ResponsiveSheetBody>
          <Tabs value={tab} onValueChange={(v) => setTab(v as 'info' | 'image' | 'delete')}>
            <TabsList className="mb-s-4 w-full">
              <TabsTrigger value="info" className="flex-1">
                정보
              </TabsTrigger>
              <TabsTrigger value="image" className="flex-1">
                사진
              </TabsTrigger>
              <TabsTrigger value="delete" className="flex-1">
                삭제
              </TabsTrigger>
            </TabsList>

            <TabsContent value="info" className="space-y-s-3">
              <Input
                label="밴드 이름"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <Textarea
                label="소개 (선택)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </TabsContent>

            <TabsContent value="image" className="space-y-s-3">
              <ProfileImageUpload
                value={band.profileImg ?? null}
                onChange={handleImageUploaded}
                domain="BAND"
                bandId={band.bandId}
                size={96}
                hint="JPEG / PNG / WEBP, 5MB 이하. 리더만 변경할 수 있습니다."
                disabled={updateMutation.isPending}
              />
            </TabsContent>

            <TabsContent value="delete" className="space-y-s-3">
              <p className="text-foreground-sub text-sm">
                밴드를 삭제하면 모든 멤버·합주·공연 데이터가 함께 제거되며 복구할 수 없습니다.
              </p>
              <Input
                label={`밴드 이름(${band.bandName}) 을 그대로 입력해 주세요`}
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder={band.bandName}
              />
            </TabsContent>
          </Tabs>
        </ResponsiveSheetBody>
        <ResponsiveSheetFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            취소
          </Button>
          {tab === 'info' && (
            <Button onClick={handleSaveInfo} loading={updateMutation.isPending}>
              저장
            </Button>
          )}
          {tab === 'image' && (
            <Button onClick={() => onOpenChange(false)} disabled={updateMutation.isPending}>
              닫기
            </Button>
          )}
          {tab === 'delete' && (
            <Button
              variant="danger"
              onClick={handleDelete}
              disabled={confirmText !== band.bandName}
              loading={deleteMutation.isPending}
            >
              삭제
            </Button>
          )}
        </ResponsiveSheetFooter>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
