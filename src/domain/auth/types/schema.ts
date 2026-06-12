import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().min(1, '이메일을 입력해 주세요').email('올바른 이메일 형식이 아닙니다'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
});
export type LoginSchema = z.infer<typeof loginSchema>;

export const passwordChangeSchema = z
  .object({
    originalPassword: z.string().min(1, '현재 비밀번호를 입력해 주세요'),
    newPassword: z.string().min(8, '새 비밀번호는 8자 이상이어야 합니다'),
    confirmPassword: z.string().min(1, '새 비밀번호를 다시 입력해 주세요'),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    path: ['confirmPassword'],
    message: '새 비밀번호가 일치하지 않습니다',
  })
  .refine((data) => data.originalPassword !== data.newPassword, {
    path: ['newPassword'],
    message: '현재 비밀번호와 다른 값을 사용해 주세요',
  });
export type PasswordChangeSchema = z.infer<typeof passwordChangeSchema>;
