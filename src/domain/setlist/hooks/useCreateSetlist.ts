import { useMutation } from '@tanstack/react-query';

import { createSetlist } from '../api';
import type { SetlistCreateRequest } from '../types/req';

export function useCreateSetlist() {
  return useMutation({
    mutationFn: (body: SetlistCreateRequest) => createSetlist(body),
  });
}
