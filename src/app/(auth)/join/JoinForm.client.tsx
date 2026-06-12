'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { PasswordStrength } from '@/components/ui/password-strength';
import { useLogin } from '@/domain/auth/hooks/useLogin';
import { useJoin } from '@/domain/member/hooks/useJoin';
import { joinSchema, type JoinSchema } from '@/domain/member/types';
import { ROUTES } from '@/global/config/routes';
import { useToast } from '@/hooks/useToast';

const INPUT_CLASS =
  'rounded-[5px] border-white/20 hover:border-white/35 focus-visible:ring-0 focus-visible:border-white/70 not-placeholder-shown:border-white/70';

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
    defaultValues: { email: '', password: '', confirmPassword: '', name: '' },
    mode: 'onChange',
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
      className="space-y-s-4"
      onSubmit={form.handleSubmit((values) => joinMutation.mutate(values))}
      noValidate
    >
      <Input
        label="이름"
        autoComplete="name"
        placeholder="이름을 입력하세요"
        required
        error={form.formState.errors.name?.message}
        className={INPUT_CLASS}
        {...form.register('name')}
      />
      <Input
        label="이메일"
        type="email"
        autoComplete="email"
        placeholder="you@bandage.com"
        required
        error={form.formState.errors.email?.message}
        className={INPUT_CLASS}
        {...form.register('email')}
      />
      <div className="space-y-2">
        <Input
          label="비밀번호"
          type="password"
          autoComplete="new-password"
          placeholder="비밀번호를 입력하세요"
          required
          error={form.formState.errors.password?.message}
          className={INPUT_CLASS}
          {...form.register('password')}
        />
        <PasswordStrength password={form.watch('password')} />
      </div>
      <Input
        label="비밀번호 확인"
        type="password"
        autoComplete="new-password"
        placeholder="비밀번호를 재입력해주세요"
        required
        error={form.formState.errors.confirmPassword?.message}
        className={INPUT_CLASS}
        {...form.register('confirmPassword')}
      />
      <Button type="submit" className="w-full rounded-[5px] font-bold" loading={isPending}>
        가입하기
      </Button>
    </form>
  );
}
