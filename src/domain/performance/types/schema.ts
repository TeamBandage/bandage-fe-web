import { z } from 'zod';

const KST_DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

export const createPerformanceSchema = z.object({
  title: z
    .string()
    .min(1, '공연 제목을 입력해 주세요.')
    .max(100, '공연 제목은 100자 이하로 입력해 주세요.'),
  bandIds: z.array(z.string().min(1)).optional(),
  startAt: z.string().regex(KST_DATETIME, '시작 시각은 yyyy-MM-dd HH:mm 형식이어야 합니다.'),
  durationMinutes: z
    .number({ message: '소요 시간을 숫자로 입력해 주세요.' })
    .int()
    .min(30, '최소 30분 이상이어야 합니다.')
    .max(600, '최대 600분(10시간)까지 입력 가능합니다.'),
  venue: z
    .string()
    .max(200, '장소는 200자 이하로 입력해 주세요.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
});
export type CreatePerformanceSchema = z.infer<typeof createPerformanceSchema>;

export const updatePerformanceSchema = z
  .object({
    title: z.string().min(1).max(100).optional(),
    startAt: z.string().regex(KST_DATETIME).optional(),
    durationMinutes: z.number().int().min(30).max(600).optional(),
    venue: z.string().max(200).optional(),
  })
  .refine(
    (data) =>
      data.title !== undefined ||
      data.startAt !== undefined ||
      data.durationMinutes !== undefined ||
      data.venue !== undefined,
    { message: '수정할 항목을 하나 이상 입력해 주세요.' },
  );
export type UpdatePerformanceSchema = z.infer<typeof updatePerformanceSchema>;
