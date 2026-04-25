import { Badge, type BadgeVariant } from '@/components/ui/badge';
import type { BandRole } from '@/global/types';

const roleLabel: Record<BandRole, string> = {
  LEADER: '리더',
  ADMIN: '관리자',
  MEMBER: '멤버',
};

// design/dist/css/components.css role-badge 와 동일: 리더=amber(주황), 관리자=accent(파랑), 멤버=default(회색)
const roleVariant: Record<BandRole, BadgeVariant> = {
  LEADER: 'amber',
  ADMIN: 'accent',
  MEMBER: 'default',
};

export function BandRoleBadge({ role }: { role: BandRole }) {
  return <Badge variant={roleVariant[role]}>{roleLabel[role]}</Badge>;
}
