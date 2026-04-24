import { apiClient } from '@/global/api/apiClient';
import { useAuthStore } from '@/global/store/authStore';

export async function logout(): Promise<void> {
  try {
    await apiClient.delete<null>('/api/v1/auth/logout');
  } finally {
    useAuthStore.getState().clear();
  }
}
