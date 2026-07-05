import { useMutation } from '@tanstack/react-query';

import { createJamsFromSetlist } from '../api';
import type { SetlistToJamRequest } from '../types/req';

export function useCreateJamsFromSetlist(setlistId: string) {
  return useMutation({
    mutationFn: (body: SetlistToJamRequest) => createJamsFromSetlist(setlistId, body),
  });
}
