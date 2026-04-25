import { cn } from './cn';

const BASE =
  'flex gap-s-3 p-s-3 rounded-lg border border-transparent bg-transparent transition-colors duration-fast cursor-pointer';
const HOVER = 'hover:bg-card hover:border-border-hi';

const SELECTED = {
  accent: 'bg-accent-dim border-accent/25 hover:bg-accent-dim',
  amber: 'bg-amber-dim border-amber/25 hover:bg-amber-dim',
} as const;

export type ListItemSelectedTone = keyof typeof SELECTED;

export function listItemClasses(
  selected = false,
  tone: ListItemSelectedTone = 'accent',
  extra?: string,
) {
  return cn(BASE, selected ? SELECTED[tone] : HOVER, extra);
}
