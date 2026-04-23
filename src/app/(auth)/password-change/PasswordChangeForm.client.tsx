'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useChangePassword } from '@/domain/auth/hooks/useChangePassword';
import { passwordChangeSchema, type PasswordChangeSchema } from '@/domain/auth/types';
import { ROUTES } from '@/global/config/routes';
import { useAuthStore } from '@/global/store/authStore';
import { useToast } from '@/hooks/useToast';

export function PasswordChangeForm() {
  const router = useRouter();
  const toast = useToast();
  const clearAuth = useAuthStore((s) => s.clear);

  const form = useForm<PasswordChangeSchema>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { originalPassword: '', newPassword: '', confirmPassword: '' },
  });

  const mutation = useChangePassword({
    onSuccess: () => {
      toast.success('비밀번호가 변경되었습니다. 다시 로그인해 주세요.');
      clearAuth();
      router.replace(ROUTES.LOGIN);
    },
    onError: (err) => toast.error(err.message || '비밀번호 변경에 실패했습니다.'),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) =>
        mutation.mutate({
          originalPassword: values.originalPassword,
          newPassword: values.newPassword,
        }),
      )}
      noValidate
    >
      <Input
        label="현재 비밀번호"
        type="password"
        autoComplete="current-password"
        required
        error={form.formState.errors.originalPassword?.message}
        {...form.register('originalPassword')}
      />
      <Input
        label="새 비밀번호"
        type="password"
        autoComplete="new-password"
        placeholder="8자 이상"
        required
        error={form.formState.errors.newPassword?.message}
        {...form.register('newPassword')}
      />
      <Input
        label="새 비밀번호 확인"
        type="password"
        autoComplete="new-password"
        required
        error={form.formState.errors.confirmPassword?.message}
        {...form.register('confirmPassword')}
      />
      <Button type="submit" className="w-full" loading={mutation.isPending}>
        비밀번호 변경
      </Button>
    </form>
  );
}
