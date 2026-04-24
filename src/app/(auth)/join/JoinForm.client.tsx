'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLogin } from '@/domain/auth/hooks/useLogin';
import { useJoin } from '@/domain/member/hooks/useJoin';
import { joinSchema, type JoinSchema } from '@/domain/member/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

export function JoinForm() {
  const router = useRouter();
  const toast = useToast();

  const loginMutation = useLogin({
    onSuccess: () => router.replace(ROUTES.HOME),
    onError: () => {
      toast.info('가입은 완료되었지만 자동 로그인에 실패했습니다. 로그인 페이지로 이동합니다.');
      router.replace(ROUTES.LOGIN);
    },
  });

  const form = useForm<JoinSchema>({
    resolver: zodResolver(joinSchema),
    defaultValues: { email: '', password: '', name: '', contact: '' },
  });

  const joinMutation = useJoin({
    onSuccess: () => {
      toast.success('회원가입이 완료되었습니다.');
      const { email, password } = form.getValues();
      loginMutation.mutate({ email, password });
    },
    onError: (err) => toast.error(err.message || '회원가입에 실패했습니다.'),
  });

  const isPending = joinMutation.isPending || loginMutation.isPending;

  return (
    <form
      className="space-y-4"
      onSubmit={form.handleSubmit((values) => joinMutation.mutate(values))}
      noValidate
    >
      <Input
        label="이메일"
        type="email"
        autoComplete="email"
        placeholder="you@bandage.com"
        required
        error={form.formState.errors.email?.message}
        {...form.register('email')}
      />
      <Input
        label="비밀번호"
        type="password"
        autoComplete="new-password"
        placeholder="8자 이상"
        required
        error={form.formState.errors.password?.message}
        {...form.register('password')}
      />
      <Input
        label="이름"
        autoComplete="name"
        placeholder="홍길동"
        required
        error={form.formState.errors.name?.message}
        {...form.register('name')}
      />
      <Input
        label="연락처"
        autoComplete="tel"
        placeholder="010-1234-5678"
        required
        error={form.formState.errors.contact?.message}
        {...form.register('contact')}
      />
      <Button type="submit" className="w-full" loading={isPending}>
        가입하기
      </Button>
    </form>
  );
}
