# .taskmaster/tasks

이 디렉토리는 task-master 가 관리하는 태스크 정의와, 그로부터 생성되는 마크다운 파일을 담습니다.

## 구조

```
.taskmaster/tasks/
├── tasks.json          # 단일 소스 오브 트루스 (모든 tag의 태스크를 포함)
├── master/             # tag: master (MVP 1차 초기 구현 — 전부 done)
│   ├── task_001.md
│   ├── ...
│   └── task_010.md
└── mvp-1-fix/          # tag: mvp-1-fix (MVP 1차 디자인·반응형 보정)
    ├── task_001_mvp-1-fix.md
    ├── ...
    └── task_009_mvp-1-fix.md
```

- `tasks.json` 은 task-master CLI 가 읽고 쓰는 파일이라 **루트 경로 고정**입니다. 이동하지 마세요.
- tag 별로 `task_*.md` 파일을 물리 디렉토리로 분리하여 마일스톤 단위 리뷰/아카이브 가 용이하도록 조직합니다.

## 현재 tag

- `master` — 초기 MVP 1차 구현(#3~#12, #28, #30 이슈 기반). 모든 태스크 `done` 처리됨.
- `mvp-1-fix` — MVP 1차 디자인/반응형 보정(#32~#40 이슈 기반). 진행 중.

## 재생성 시 주의 (task-master generate)

`task-master generate` 는 현재 tag 의 `task_*.md` 파일을 **이 디렉토리 루트에** 다시 쓰기 때문에, 생성 후 수동으로 해당 tag 의 폴더로 옮겨야 합니다:

```bash
# mvp-1-fix tag 에서 generate 후
task-master tags use mvp-1-fix
task-master generate
mv task_*_mvp-1-fix.md mvp-1-fix/

# master tag 에서 generate 후 (접미사 없음)
task-master tags use master
task-master generate
mv task_0*.md master/     # mvp-1-fix 파일과 패턴이 겹치지 않게 주의
```

생성되는 파일은 `tasks.json` 의 파생물이므로, 태스크 변경 시 `tasks.json` 을 통해 관리하고 `generate` 로 재출력하면 됩니다.

## tag 전환

```bash
task-master tags            # tag 목록
task-master tags use <name> # tag 전환
task-master list            # 현재 tag 의 태스크 목록
```
