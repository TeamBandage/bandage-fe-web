import { redirect } from 'next/navigation';

import { ROUTES } from '@/global/config/routes';

export default function RootPage() {
  redirect(ROUTES.HOME);
}
