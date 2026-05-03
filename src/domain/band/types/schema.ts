import { z } from 'zod';

export const createBandSchema = z.object({
  name: z
    .string()
    .min(1, '밴드 이름을 입력해 주세요.')
    .max(50, '밴드 이름은 50자 이하로 입력해 주세요.'),
  description: z
    .string()
    .max(200, '소개는 200자 이하로 입력해 주세요.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});
export type CreateBandSchema = z.infer<typeof createBandSchema>;
