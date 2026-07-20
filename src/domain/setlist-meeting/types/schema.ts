import { z } from 'zod';

export const addSongSchema = z.object({
  title: z.string().min(1, '곡명을 입력해 주세요.').max(100, '곡명은 100자 이하로 입력해 주세요.'),
  artist: z.string().min(1, '아티스트를 입력해 주세요.').max(100),
  album: z
    .string()
    .max(100)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  note: z
    .string()
    .max(500)
    .optional()
    .or(z.literal('').transform(() => undefined)),
  reference: z
    .string()
    .url('올바른 URL을 입력해 주세요.')
    .max(500)
    .optional()
    .or(z.literal('').transform(() => undefined)),
});
export type AddSongSchema = z.infer<typeof addSongSchema>;

export const createMeetingSchema = z.object({
  title: z.string().min(1, '회의 제목을 입력해 주세요.').max(80),
  bandName: z.string().min(1, '연결할 밴드 이름을 입력해 주세요.').max(40),
});
export type CreateMeetingSchema = z.infer<typeof createMeetingSchema>;
