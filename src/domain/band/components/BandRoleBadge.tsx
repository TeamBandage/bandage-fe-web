import { Badge, type BadgeVariant } from '@/components/ui/badge';
import type { BandRole } from '@/global/types';

const roleLabel: Record<BandRole, string> = {
  LEADER: '리더',
  ADMIN: '관리자',
  MEMBER: '멤버',
};

const roleVariant: Record<BandRole, BadgeVariant> = {
  LEADER: 'accent',
  ADMIN: 'success',
  MEMBER: 'default',
};

export function BandRoleBadge({ role }: { role: BandRole }) {
  return <Badge variant={roleVariant[role]}>{roleLabel[role]}</Badge>;
}
