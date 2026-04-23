'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/domain/auth/hooks/useLogin';
import { loginSchema, type LoginSchema } from '@/domain/auth/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

export function LoginForm() {
  const router = useRouter();
  const toast = useToast();

  const form = useForm<LoginSchema>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const mutation = useLogin({
    onSuccess: () => {
      toast.success('로그인되었습니다.');
      router.replace(ROUTES.HOME);
    },
    onError: (err) => toast.error(err.message || '로그인에 실패했습니다.'),
  });

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => mutation.mutate(values))}
      noValidate
    >
      <Input
        label="이메일"
        type="email"
        autoComplete="email"
        placeholder="you@bandage.com"
        error={form.formState.errors.email?.message}
        {...form.register('email')}
      />
      <Input
        label="비밀번호"
        type="password"
        autoComplete="current-password"
        placeholder="8자 이상"
        error={form.formState.errors.password?.message}
        {...form.register('password')}
      />
      <Button type="submit" className="w-full" loading={mutation.isPending}>
        로그인
      </Button>
    </form>
  );
}
