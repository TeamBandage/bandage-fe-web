import { z } from 'zod';

export const joinSchema = z
  .object({
    email: z.string().min(1, '이메일을 입력해 주세요').email('올바른 이메일 형식이 아닙니다'),
    password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다'),
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해 주세요'),
    name: z.string().min(2, '이름은 2자 이상이어야 합니다'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });
export type JoinSchema = z.infer<typeof joinSchema>;

export const updateMeSchema = z.object({
  name: z.string().min(2, '이름은 2자 이상이어야 합니다').optional(),
});
export type UpdateMeSchema = z.infer<typeof updateMeSchema>;
