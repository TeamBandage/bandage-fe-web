'use client';

import { Check, ExternalLink, Pencil, Trash2, X } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDeleteSongRefLink } from '@/domain/practice-song/hooks/useDeleteSongRefLink';
import { useUpsertSongRefLink } from '@/domain/practice-song/hooks/useUpsertSongRefLink';
import { useToast } from '@/hooks/useToast';

type Props = {
  practiceId: string;
  songId: string;
  refLink?: string | null;
};

export function SongRefLinkEditor({ practiceId, songId, refLink }: Props) {
  const toast = useToast();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(refLink ?? '');

  const upsertMutation = useUpsertSongRefLink(songId, {
    practiceId,
    onSuccess: () => {
      toast.success('참조 링크가 저장되었습니다.');
      setEditing(false);
    },
    onError: (err) => toast.error(err.message || '참조 링크 저장에 실패했습니다.'),
  });

  const deleteMutation = useDeleteSongRefLink(songId, {
    practiceId,
    onSuccess: () => toast.success('참조 링크가 삭제되었습니다.'),
    onError: (err) => toast.error(err.message || '참조 링크 삭제에 실패했습니다.'),
  });

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <Input
          placeholder="https://..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="flex-1"
        />
        <Button
          size="sm"
          onClick={() => upsertMutation.mutate(value.trim())}
          loading={upsertMutation.isPending}
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

  if (refLink) {
    return (
      <div className="flex items-center gap-2">
        <a
          href={refLink}
          target="_blank"
          rel="noopener noreferrer"
          className="text-accent-hi inline-flex items-center gap-1 text-sm hover:underline"
        >
          <ExternalLink className="h-3 w-3" />
          <span className="truncate">{refLink}</span>
        </a>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setValue(refLink);
            setEditing(true);
          }}
        >
          <Pencil className="h-3 w-3" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          className="text-danger hover:opacity-80"
          onClick={() => deleteMutation.mutate()}
          loading={deleteMutation.isPending}
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </div>
    );
  }

  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => {
        setValue('');
        setEditing(true);
      }}
    >
      참조 링크 추가
    </Button>
  );
}
