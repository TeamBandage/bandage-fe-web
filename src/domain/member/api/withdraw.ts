import { apiClient } from '@/global/api/apiClient';
import { useAuthStore } from '@/global/store/authStore';

export async function withdraw(): Promise<void> {
  try {
    await apiClient.delete<null>('/api/v1/members/me');
  } finally {
    useAuthStore.getState().clear();
  }
}
