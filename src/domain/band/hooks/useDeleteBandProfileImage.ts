import { useMutation, useQueryClient } from '@tanstack/react-query';

import { deleteBandProfileImage } from '@/domain/band/api/deleteBandProfileImage';
import { queryKeys } from '@/global/config/queryKeys';

interface Options {
  onSuccess?: () => void;
  onError?: (err: Error) => void;
}

export function useDeleteBandProfileImage(bandId: string, options?: Options) {
  const queryClient = useQueryClient();
  return useMutation<void, Error, void>({
    mutationFn: () => deleteBandProfileImage(bandId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.band.detail(bandId) });
      options?.onSuccess?.();
    },
    onError: options?.onError,
  });
}
