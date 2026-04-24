import { z } from 'zod';

const CONTACT_REGEX = /^01\d-\d{3,4}-\d{4}$/;

export const joinSchema = z.object({
  email: z.string().min(1, '이메일을 입력해 주세요.').email('올바른 이메일 형식이 아닙니다.'),
  password: z.string().min(8, '비밀번호는 8자 이상이어야 합니다.'),
  name: z.string().min(2, '이름은 2자 이상이어야 합니다.'),
  contact: z
    .string()
    .min(1, '연락처를 입력해 주세요.')
    .regex(CONTACT_REGEX, '010-0000-0000 형식으로 입력해 주세요.'),
});
export type JoinSchema = z.infer<typeof joinSchema>;

export const updateMeSchema = z
  .object({
    name: z.string().min(2, '이름은 2자 이상이어야 합니다.').optional(),
    contact: z.string().regex(CONTACT_REGEX, '010-0000-0000 형식으로 입력해 주세요.').optional(),
  })
  .refine((data) => data.name !== undefined || data.contact !== undefined, {
    message: '수정할 항목을 하나 이상 입력해 주세요.',
  });
export type UpdateMeSchema = z.infer<typeof updateMeSchema>;
