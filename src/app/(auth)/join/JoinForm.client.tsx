'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordStrength } from '@/components/ui/password-strength';
import { StepIndicator } from '@/components/ui/step-indicator';
import { useLogin } from '@/domain/auth/hooks/useLogin';
import { useJoin } from '@/domain/member/hooks/useJoin';
import { joinSchema, type JoinSchema } from '@/domain/member/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

const STEPS = ['기본 정보', '계정 설정'] as const;

export function JoinForm() {
  const router = useRouter();
  const toast = useToast();
  const [step, setStep] = useState<0 | 1>(0);

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
    mode: 'onTouched',
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

  async function goNext() {
    const valid = await form.trigger(['name', 'contact']);
    if (valid) setStep(1);
  }

  return (
    <form
      className="space-y-s-4"
      onSubmit={form.handleSubmit((values) => joinMutation.mutate(values))}
      noValidate
    >
      <StepIndicator steps={STEPS} current={step} />

      {step === 0 && (
        <>
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
          <Button type="button" className="w-full" onClick={goNext} disabled={isPending}>
            다음
          </Button>
        </>
      )}

      {step === 1 && (
        <>
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
          <PasswordStrength password={form.watch('password')} />
          <div className="gap-s-2 flex">
            <Button
              type="button"
              variant="ghost"
              className="flex-1"
              onClick={() => setStep(0)}
              disabled={isPending}
            >
              이전
            </Button>
            <Button type="submit" className="flex-1" loading={isPending}>
              가입하기
            </Button>
          </div>
        </>
      )}
    </form>
  );
}
