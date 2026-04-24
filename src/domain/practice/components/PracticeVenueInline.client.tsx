'use client';

import { Check, MapPin, Pencil, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useUpdateVenue } from '@/domain/practice/hooks/useUpdateVenue';
import { useToast } from '@/hooks/useToast';

type Props = {
  practiceId: string;
  venue?: string | null;
};

export function PracticeVenueInline({ practiceId, venue }: Props) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(venue ?? '');
  const toast = useToast();

  const mutation = useUpdateVenue(practiceId, {
    onSuccess: () => {
      toast.success('장소가 수정되었습니다.');
      setEditing(false);
    },
    onError: (err) => toast.error(err.message || '장소 수정에 실패했습니다.'),
  });

  if (!editing) {
    return (
      <div className="flex items-center gap-2">
        <MapPin className="text-foreground-muted h-4 w-4" aria-hidden="true" />
        <span className="text-foreground text-sm">{venue ?? '장소 미지정'}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setValue(venue ?? '');
            setEditing(true);
          }}
        >
          <Pencil className="h-3 w-3" />
          수정
        </Button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="장소"
        className="max-w-xs"
      />
      <Button
        size="sm"
        onClick={() => mutation.mutate({ venue: value.trim() })}
        loading={mutation.isPending}
        disabled={value.trim().length === 0}
      >
        <Check className="h-3 w-3" />
      </Button>
      <Button size="sm" variant="ghost" onClick={() => setEditing(false)}>
        <X className="h-3 w-3" />
      </Button>
    </div>
  );
}
