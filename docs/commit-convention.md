# Commit Convention

이 저장소는 **Conventional Commits**를 사용합니다.

## 빠른 시작

1. 훅 설치  
`pnpm setup:hooks`
2. git commit 템플릿 설정  
`pnpm setup:gitmessage`
3. 템플릿 기반 커밋 작성  
`pnpm commit`

## 기본 형식

제목(필수):

```text
<type>(<scope>): <한국어 한 줄 요약>
```

- type: `feat|fix|docs|style|refactor|perf|test|chore|ci`
- scope: 선택 (예: `yacht`, `online`, `ui`, `i18n`, `infra`)
- subject: 비워둘 수 없음, 최대 100자

본문(선택, 권장):

```text
배경:
- ...

변경:
- ...

검증:
- ...
```

푸터(선택):

```text
Refs: #123
BREAKING CHANGE: ...
```

## 예시

```text
feat(online): 리매치 대기 상태 동기화 개선

배경:
- 두 플레이어가 다시 대결을 눌러도 시작이 지연되는 경우가 있었다.

변경:
- 리매치 브로드캐스트 처리 흐름을 정리하고 상태 초기화 순서를 조정했다.

검증:
- 로컬 2브라우저 환경에서 리매치 5회 반복 테스트

Refs: #87
```

```text
fix(ui): 대기방 닉네임 입력 UX 복원

배경:
- 자동 생성 흐름 이후 닉네임 입력이 사라져 사용자 식별이 어려웠다.

변경:
- 대기방 패널에 닉네임 입력 필드를 복원하고 localStorage 반영을 추가했다.

검증:
- pnpm -C apps/web build
```

```text
ci(infra): 커밋 메시지 lint 훅 추가

변경:
- commit-msg 훅에서 commitlint를 실행하도록 설정했다.
```

## 자주 발생하는 에러

- `type must be one of [...]`  
  : 허용되지 않은 type을 사용했습니다.
- `subject may not be empty`  
  : 제목 요약(subject)을 비워둘 수 없습니다.
- `header must not be longer than 100 characters`  
  : 제목이 100자를 초과했습니다.
- `scope must be lower-case`  
  : scope는 소문자만 허용됩니다.

## 추천 scope

- `yacht`
- `online`
- `ui`
- `i18n`
- `infra`
- `ci`
- `deps`
