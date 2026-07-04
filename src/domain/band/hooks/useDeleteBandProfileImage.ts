import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteBandProfileImage } from '@/domain/band/api/deleteBandProfileImage';
import type { BandInfoResponse } from '@/domain/band/types/res';
import { queryKeys } from '@/global/config/queryKeys';

interface Options {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

export function useDeleteBandProfileImage(bandId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => deleteBandProfileImage(bandId),
    onMutate: () => {
      const key = queryKeys.band.detail(bandId);
      const prev = queryClient.getQueryData<BandInfoResponse | null>(key);
      if (prev) {
        queryClient.setQueryData<BandInfoResponse>(key, { ...prev, profileImg: undefined });
      }
      return { prev };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.band.detail(bandId) });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.my()] });
      queryClient.invalidateQueries({ queryKey: [...queryKeys.band.list()] });
      options?.onSuccess?.();
    },
    onError: (_err, _v, context) => {
      const ctx = context as { prev?: BandInfoResponse | null } | undefined;
      if (ctx?.prev !== undefined) {
        queryClient.setQueryData(queryKeys.band.detail(bandId), ctx.prev);
      }
      options?.onError?.(_err);
    },
  });
}
