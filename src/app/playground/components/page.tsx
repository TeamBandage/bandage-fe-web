'use client';

import { type ReactNode } from 'react';

import { Avatar } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  BottomSheet,
  BottomSheetBody,
  BottomSheetContent,
  BottomSheetFooter,
  BottomSheetHeader,
  BottomSheetTitle,
  BottomSheetTrigger,
} from '@/components/ui/bottom-sheet';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Chip } from '@/components/ui/chip';
import {
  Dialog,
  DialogBody,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Spinner } from '@/components/ui/spinner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import type { SessionType } from '@/global/types';

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-foreground-sub text-sm font-semibold tracking-wide uppercase">{title}</h2>
      {children}
    </section>
  );
}

const sessions: SessionType[] = [
  'VOCAL',
  'CHORUS',
  'GUITAR',
  'BASS',
  'DRUM',
  'PERCUSSION',
  'SYNTH',
  'ETC',
];

export default function ComponentsPlaygroundPage() {
  return (
    <main className="mx-auto max-w-5xl space-y-10 p-6">
      <header className="space-y-2">
        <h1 className="text-foreground text-2xl font-bold">UI Primitives Playground</h1>
        <p className="text-foreground-sub text-sm">
          Task 4에서 구현한 UI 프리미티브의 variant/size 조합을 시각 검증하는 페이지.
        </p>
      </header>

      <Section title="Button">
        <div className="flex flex-wrap items-center gap-3">
          <Button>Primary</Button>
          <Button variant="secondary">Secondary</Button>
          <Button variant="ghost">Ghost</Button>
          <Button variant="danger">Danger</Button>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <Button size="sm">Small</Button>
          <Button size="md">Medium</Button>
          <Button size="lg">Large</Button>
          <Button loading>저장 중…</Button>
          <Button disabled>비활성</Button>
        </div>
      </Section>

      <Section title="Spinner">
        <div className="flex items-center gap-4">
          <Spinner size="sm" />
          <Spinner size="md" />
          <Spinner size="lg" />
        </div>
      </Section>

      <Section title="Input / Textarea / Select">
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <Input label="이메일" placeholder="you@bandage.com" hint="로그인에 사용됩니다." />
          <Input label="비밀번호" type="password" error="8자 이상 입력해 주세요." required />
          <Textarea label="밴드 소개" placeholder="우리 밴드를 소개해 주세요." required />
          <Select
            label="세션"
            placeholder="세션을 선택하세요"
            options={sessions.map((s) => ({ value: s, label: s }))}
          />
        </div>
      </Section>

      <Section title="Card">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Card header="멤버 카드" footer="2024년 가입">
            <p className="text-foreground-sub text-sm">
              카드 컴포넌트는 header/footer/padding/interactive 속성을 지원합니다.
            </p>
          </Card>
          <Card interactive>
            <p className="text-foreground text-sm font-medium">Interactive Card</p>
            <p className="text-foreground-muted text-xs">호버 시 card-hover 토큰으로 전환</p>
          </Card>
        </div>
      </Section>

      <Section title="Badge">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Default</Badge>
          <Badge variant="accent">Accent</Badge>
          <Badge variant="success">Success</Badge>
          <Badge variant="warn">Warn</Badge>
          <Badge variant="danger">Danger</Badge>
        </div>
      </Section>

      <Section title="Chip (Session)">
        <div className="flex flex-wrap items-center gap-2">
          {sessions.map((s) => (
            <Chip key={s} session={s}>
              {s}
            </Chip>
          ))}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Chip interactive onClick={() => undefined}>
            Interactive
          </Chip>
          <Chip interactive selected onClick={() => undefined}>
            Selected
          </Chip>
        </div>
      </Section>

      <Section title="Avatar">
        <div className="flex flex-wrap items-center gap-3">
          <Avatar size="sm" fallback="홍길동" />
          <Avatar size="md" fallback="김밴드" />
          <Avatar size="lg" fallback="Sunwoo Jung" />
          <Avatar
            size="xl"
            fallback="W J"
            src="https://i.pravatar.cc/128?u=bandage"
            alt="pravatar"
          />
        </div>
      </Section>

      <Section title="Skeleton">
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-20 w-full" rounded="lg" />
          <div className="flex gap-2">
            <Skeleton className="h-10 w-10" rounded="pill" />
            <Skeleton className="h-10 flex-1" />
          </div>
        </div>
      </Section>

      <Section title="Tabs">
        <Tabs defaultValue="info" className="max-w-md">
          <TabsList>
            <TabsTrigger value="info">정보</TabsTrigger>
            <TabsTrigger value="members">멤버</TabsTrigger>
            <TabsTrigger value="songs">곡</TabsTrigger>
          </TabsList>
          <TabsContent value="info">
            <Card>정보 탭 콘텐츠</Card>
          </TabsContent>
          <TabsContent value="members">
            <Card>멤버 탭 콘텐츠</Card>
          </TabsContent>
          <TabsContent value="songs">
            <Card>곡 탭 콘텐츠</Card>
          </TabsContent>
        </Tabs>
      </Section>

      <Section title="Dialog">
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="secondary">Dialog 열기</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>밴드 삭제</DialogTitle>
              <DialogDescription>
                삭제된 밴드는 복구할 수 없습니다. 계속 진행할까요?
              </DialogDescription>
            </DialogHeader>
            <DialogBody>연관된 합주/공연/신청 내역도 함께 비활성화됩니다.</DialogBody>
            <DialogFooter>
              <Button variant="ghost">취소</Button>
              <Button variant="danger">삭제</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </Section>

      <Section title="BottomSheet">
        <BottomSheet>
          <BottomSheetTrigger asChild>
            <Button variant="secondary">BottomSheet 열기</Button>
          </BottomSheetTrigger>
          <BottomSheetContent>
            <BottomSheetHeader>
              <BottomSheetTitle>세션 선택</BottomSheetTitle>
            </BottomSheetHeader>
            <BottomSheetBody>
              <div className="flex flex-wrap gap-2">
                {sessions.map((s) => (
                  <Chip key={s} session={s}>
                    {s}
                  </Chip>
                ))}
              </div>
            </BottomSheetBody>
            <BottomSheetFooter>
              <Button>확인</Button>
            </BottomSheetFooter>
          </BottomSheetContent>
        </BottomSheet>
      </Section>
    </main>
  );
}
