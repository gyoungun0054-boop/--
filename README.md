# NEXUS QR Check-in

NEXUS Event Platform에서 이경운 담당 QR 입장 확인 기능을 검토하기 위한 개인 저장소 시제품입니다.

> **현재 상태:** 개인 저장소에서 기능 개발 중이며 공식 팀 저장소 `paichai-nexus/nexus-event-platform`에는 병합되지 않았습니다. 공식 저장소는 현재 GitHub 연결에서 읽기 권한만 확인되어 직접 푸시할 수 없습니다.

## 구현 범위

- `/admin/check-in` 관리자 입장 확인 화면
- 카메라 QR 스캔 및 QR 리더기/직접 입력 fallback
- 일반 텍스트 코드와 JSON QR payload(`participantCode`, `participantId`, `id`) 처리
- 등록·활성 참가자 조회, 중복 입장 방지
- `SUCCESS`, `ALREADY_CHECKED_IN`, `NOT_FOUND`, `ERROR` 결과 상태
- 처리 시각 및 최근 처리 기록 UI
- 반응형 데스크톱/모바일 레이아웃
- Mock Data 우선 동작과 Vitest 단위 테스트
- Supabase API 및 schema 예제

## 빠른 실행 (Mock Data UI)

필요 환경: Node.js 22 권장, npm.

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000/admin/check-in](http://localhost:3000/admin/check-in)을 엽니다.

테스트 코드:
- `NEXUS-001`: 입장 성공
- `NEXUS-002`: 이미 입장 처리된 참가자 (중복 테스트)
- `NEXUS-003`: 이미 입장 처리된 참가자 (최근 기록에 포함)
- `NEXUS-004`: 비활성 참가자 → 입장 거절
- `UNKNOWN`: 등록되지 않은 참가자

Mock Data는 화면 흐름 확인용입니다. 새로고침하면 기록이 초기화되고 실제 데이터베이스에는 저장되지 않습니다.

## 실제 Supabase API 모드

1. Supabase 프로젝트를 만들고 SQL Editor에서 `supabase/schema.sql`을 적용합니다.
2. `events` 레코드를 별도로 관리하지 않는 현재 스키마 기준으로 사용할 UUID를 정해 `participants.event_id`에 넣고, 해당 참가자 행들을 준비합니다. 이 UUID를 `CHECKIN_EVENT_ID`로 지정합니다.
3. 로컬 `.env.local`에 다음 값을 설정합니다.

```dotenv
NEXT_PUBLIC_CHECKIN_MODE=live
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
SUPABASE_SERVICE_ROLE_KEY=YOUR_SERVER_ONLY_SERVICE_ROLE_KEY
CHECKIN_EVENT_ID=YOUR_EVENT_UUID
```

4. 서버를 재시작하고 `/admin/check-in`에서 등록된 참가자 코드를 테스트합니다.

**보안:** `SUPABASE_SERVICE_ROLE_KEY`는 서버 전용 비밀키입니다. 브라우저 변수에 넣거나 GitHub에 커밋하지 마세요. 실제 참가자 개인정보를 공개 저장소에 넣지 마세요.

실제 API는 중복 입장을 DB의 unique constraint로 막습니다. 다만 UI의 최근 기록은 현재 화면에서 처리한 최대 12건만 보여주며, 새로고침 후 DB 기록을 불러오는 조회 API는 아직 없습니다. 행사 현장 운영 전에는 관리자 인증/권한 검토와 실제 데이터로 통합 테스트가 필요합니다.

## 검사 명령

```bash
npm test
npm run typecheck
npm run build
```

GitHub Actions의 `.github/workflows/qr-check-in-ci.yml`도 테스트, 타입 검사, 프로덕션 빌드를 실행합니다. 실제 결과는 [Pull Request Checks](https://github.com/gyoungun0054-boop/--/pull/1/checks)에서 확인하세요.

## 카메라 제한

카메라 사용에는 브라우저 권한과 HTTPS 또는 `localhost`가 필요합니다. QR을 읽었다고 자동 입장 처리하지 않고, 담당자가 입장 확인 버튼을 눌러야 합니다. 카메라를 사용할 수 없으면 직접 입력 또는 키보드형 QR 리더기를 이용할 수 있습니다.

## 제출 및 배포 상태

- 개인 저장소 PR: 열려 있음
- GitHub Actions 테스트 / 타입 검사 / 프로덕션 빌드: 마지막 확인 시 통과
- 공식 NEXUS 팀 저장소 반영: 미완료 (현재 연결은 읽기 권한)
- Supabase 프로젝트 및 행사 참가자 데이터 설정: 사용자 계정에서 설정 필요
- 실제 카메라/모바일 브라우저 테스트: 이 환경에서 미실행

현장 입장에 사용하기 전에 팀의 인증 정책, 권한 관리, DB 규칙, 감사 로그 및 운영 테스트를 확인해야 합니다.
