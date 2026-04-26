'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, X } from 'lucide-react';
import { useState, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  ResponsiveSheet,
  ResponsiveSheetBody,
  ResponsiveSheetClose,
  ResponsiveSheetContent,
  ResponsiveSheetFooter,
  ResponsiveSheetHeader,
  ResponsiveSheetTitle,
  ResponsiveSheetTrigger,
} from '@/components/ui/responsive-sheet';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/useToast';

import { DEFAULT_SESSIONS } from '../mock/seed';
import { useSetlistStore } from '../store/setlistStore';
import type { SessionDef } from '../types';
import { addSongSchema, type AddSongSchema } from '../types/schema';

export interface AddSongModalProps {
  meetingId: string;
  trigger: ReactNode;
}

function makeSessionId(label: string, existing: SessionDef[]): string {
  const base = label
    .replace(/[^A-Za-z0-9가-힣]/g, '')
    .slice(0, 4)
    .toUpperCase();
  let id = base || `S${existing.length + 1}`;
  let n = 1;
  while (existing.some((s) => s.id === id)) {
    id = `${base}${n++}`;
  }
  return id;
}

export function AddSongModal({ meetingId, trigger }: AddSongModalProps) {
  const [open, setOpen] = useState(false);
  const [extras, setExtras] = useState<SessionDef[]>([]);
  const [extraDraft, setExtraDraft] = useState('');
  const addSong = useSetlistStore((s) => s.addSong);
  const currentUserId = useSetlistStore((s) => s.currentUserId);
  const toast = useToast();

  const form = useForm<AddSongSchema>({
    resolver: zodResolver(addSongSchema),
    defaultValues: { title: '', artist: '', album: '', note: '' },
    mode: 'onTouched',
  });

  const reset = () => {
    form.reset();
    setExtras([]);
    setExtraDraft('');
  };

  const addExtra = () => {
    const label = extraDraft.trim();
    if (!label) return;
    const all = [...DEFAULT_SESSIONS, ...extras];
    const id = makeSessionId(label, all);
    const short = label.slice(0, 2);
    setExtras((prev) => [...prev, { id, label, short, need: 1, custom: true }]);
    setExtraDraft('');
  };

  const removeExtra = (id: string) => setExtras((prev) => prev.filter((s) => s.id !== id));

  const onSubmit = form.handleSubmit((values) => {
    addSong(meetingId, {
      title: values.title,
      artist: values.artist,
      album: values.album,
      note: values.note,
      proposerId: currentUserId,
      sessions: [...DEFAULT_SESSIONS, ...extras],
    });
    toast.success('곡이 추가되었습니다.');
    setOpen(false);
    reset();
  });

  return (
    <ResponsiveSheet
      open={open}
      onOpenChange={(v) => {
        setOpen(v);
        if (!v) reset();
      }}
    >
      <ResponsiveSheetTrigger asChild>{trigger}</ResponsiveSheetTrigger>
      <ResponsiveSheetContent>
        <ResponsiveSheetHeader>
          <ResponsiveSheetTitle>곡 추가</ResponsiveSheetTitle>
        </ResponsiveSheetHeader>
        <form onSubmit={onSubmit}>
          <ResponsiveSheetBody>
            <div className="gap-s-3 flex flex-col">
              <Input
                label="곡명"
                required
                error={form.formState.errors.title?.message}
                placeholder="예: Vicarious"
                autoFocus
                {...form.register('title')}
              />
              <Input
                label="아티스트"
                required
                error={form.formState.errors.artist?.message}
                placeholder="예: Tool"
                {...form.register('artist')}
              />
              <Input
                label="앨범"
                error={form.formState.errors.album?.message}
                placeholder="선택"
                {...form.register('album')}
              />
              <Textarea
                label="추천자 의견"
                error={form.formState.errors.note?.message}
                rows={3}
                placeholder="이 곡을 추천하는 이유, 합주 시 유의사항 등"
                {...form.register('note')}
              />

              <div>
                <div className="text-foreground-sub text-caption mb-s-2 font-semibold">
                  세션 구성
                </div>
                <div className="text-foreground-muted text-micro mb-s-2">
                  기본 4세션(보컬/기타/베이스/드럼) 외에 필요한 세션을 추가할 수 있습니다.
                </div>
                <div className="gap-s-2 flex">
                  <Input
                    value={extraDraft}
                    onChange={(e) => setExtraDraft(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        addExtra();
                      }
                    }}
                    placeholder="예: 키보드, 퍼커션"
                  />
                  <Button type="button" variant="secondary" size="sm" onClick={addExtra}>
                    <Plus className="h-4 w-4" /> 추가
                  </Button>
                </div>
                {extras.length > 0 && (
                  <ul className="gap-s-2 mt-s-2 flex flex-wrap">
                    {extras.map((s) => (
                      <li
                        key={s.id}
                        className="bg-amber-dim text-amber border-amber/30 px-s-2 gap-s-1 text-micro inline-flex items-center rounded-full border py-0.5 font-bold"
                      >
                        {s.label}
                        <button
                          type="button"
                          onClick={() => removeExtra(s.id)}
                          aria-label={`${s.label} 세션 제거`}
                          className="hover:text-foreground"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </ResponsiveSheetBody>
          <ResponsiveSheetFooter>
            <ResponsiveSheetClose asChild>
              <Button type="button" variant="ghost">
                취소
              </Button>
            </ResponsiveSheetClose>
            <Button type="submit" variant="primary" disabled={!form.formState.isValid}>
              곡 추가
            </Button>
          </ResponsiveSheetFooter>
        </form>
      </ResponsiveSheetContent>
    </ResponsiveSheet>
  );
}
