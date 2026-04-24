'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useCreateBand } from '@/domain/band/hooks/useCreateBand';
import { createBandSchema, type CreateBandSchema } from '@/domain/band/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

export function BandCreateForm() {
  const router = useRouter();
  const toast = useToast();

  const form = useForm<CreateBandSchema>({
    resolver: zodResolver(createBandSchema),
    defaultValues: { name: '', description: '', profileImg: '' },
  });

  const mutation = useCreateBand({
    onSuccess: (data) => {
      toast.success('밴드가 생성되었습니다.');
      router.replace(ROUTES.BAND_DETAIL(data.bandId));
    },
    onError: (err) => toast.error(err.message || '밴드 생성에 실패했습니다.'),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        mutation.mutate({
          name: values.name,
          description: values.description,
          profileImg: values.profileImg,
        }),
      )}
      noValidate
    >
      <Input
        label="밴드 이름"
        placeholder="예: TuNA"
        required
        error={form.formState.errors.name?.message}
        {...form.register('name')}
      />
      <Textarea
        label="소개"
        placeholder="밴드 소개를 입력하세요 (최대 200자)"
        error={form.formState.errors.description?.message}
        {...form.register('description')}
      />
      <Input
        label="프로필 이미지 URL"
        placeholder="https://..."
        error={form.formState.errors.profileImg?.message}
        {...form.register('profileImg')}
      />
      <Button type="submit" className="w-full" loading={mutation.isPending}>
        밴드 만들기
      </Button>
    </form>
  );
}
