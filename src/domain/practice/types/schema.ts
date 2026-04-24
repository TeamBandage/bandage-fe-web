import { z } from 'zod';

const KST_DATETIME = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;

export const createPracticeSchema = z.object({
  title: z
    .string()
    .max(100, '제목은 100자 이하로 입력해 주세요.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  song: z.string().min(1, '합주곡 ID 를 입력해 주세요.'),
  venue: z
    .string()
    .max(200, '장소는 200자 이하로 입력해 주세요.')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  startAt: z.string().regex(KST_DATETIME, '시작 시각은 yyyy-MM-dd HH:mm 형식이어야 합니다.'),
  durationMinutes: z
    .number({ message: '소요 시간을 숫자로 입력해 주세요.' })
    .int('정수로 입력해 주세요.')
    .min(15, '최소 15분 이상이어야 합니다.')
    .max(480, '최대 480분(8시간)까지 입력 가능합니다.'),
});
export type CreatePracticeSchema = z.infer<typeof createPracticeSchema>;

export const updateScheduleSchema = z.object({
  startAt: z.string().regex(KST_DATETIME, '시작 시각은 yyyy-MM-dd HH:mm 형식이어야 합니다.'),
  durationMinutes: z.number().int().min(15).max(480),
});
export type UpdateScheduleSchema = z.infer<typeof updateScheduleSchema>;

export const updateVenueSchema = z.object({
  venue: z.string().min(1, '장소를 입력해 주세요.').max(200, '장소는 200자 이하로 입력해 주세요.'),
});
export type UpdateVenueSchema = z.infer<typeof updateVenueSchema>;

export const createSessionSchema = z.object({
  label: z
    .string()
    .min(1, '세션 이름을 입력해 주세요.')
    .max(50, '세션 이름은 50자 이하로 입력해 주세요.'),
  type: z.enum(['VOCAL', 'CHORUS', 'GUITAR', 'BASS', 'DRUM', 'PERCUSSION', 'SYNTH', 'ETC']),
});
export type CreateSessionSchema = z.infer<typeof createSessionSchema>;

export const addParticipantSchema = z.object({
  memberId: z.number({ message: '멤버 ID 를 숫자로 입력해 주세요.' }).int().positive(),
});
export type AddParticipantSchema = z.infer<typeof addParticipantSchema>;

export const upsertRefLinkSchema = z.object({
  refLink: z.string().url('올바른 URL 을 입력해 주세요.'),
});
export type UpsertRefLinkSchema = z.infer<typeof upsertRefLinkSchema>;
