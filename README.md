# NEXUS QR Check-in

NEXUS Event Platform에서 이경운 담당 QR 입장 확인 기능을 검토하기 위한 개인 저장소 시제품입니다.

> **현재 상태:** 개인 저장소에서 기능 개발 중이며 공식 팀 저장소 `paichai-nexus/nexus-event-platform`에는 병합되지 않았습니다. 팀 저장소 권한/통합은 별도로 확인해야 합니다.

## 구현 범위

- `/admin/check-in` 관리자 입장 확인 화면
- 카메라 QR 스캔 및 QR 리더기/직접 입력 fallback
- 일반 텍스트 코드와 JSON QR payload(`participantCode`, `participantId`, `id`) 처리
- 등록·활성 참가자 조회, 중복 입장 방지
- `SUCCESS`, `ALREADY_CHECKED_IN`, `NOT_FOUND`, `ERROR` 결과 상태
- 처리 시각 및 최근 입장 로그 UI
- 반응형 데스크톱/모바일 레이아웃
- Mock Data 우선 동작과 Vitest 단위 테스트
- 별도 Supabase API/schema 예제는 실제 DB 연결을 위한 기반으로 보존

## 빠른 실행 (Mock Data UI)

필요 환경: Node.js 20 이상, npm.

```bash
npm install
npm run dev
```

브라우저에서 [http://localhost:3000/admin/check-in](http://localhost:3000/admin/check-in)을 엽니다.

테스트 코드:
- `NEXUS-001`: 입장 성공
- `NEXUS-002`: 이미 입장 처리된 참가자 (중복 테스트)
- `NEXUS-003`: 이미 입장 처리된 참가자 (최근 기록에 포함)
- `NEXUS-004`: 비활성 참가자 → 미등록/비활성 처리
- `UNKNOWN`: 등록되지 않은 참가자

Mock Data는 브라우저 화면 흐름 확인용입니다. 새로고침하면 기록이 초기화되고 실제 데이터베이스에는 저장되지 않습니다.

## 검사 명령

```bash
npm test
npm run typecheck
npm run build
```

GitHub Actions의 `.github/workflows/qr-check-in-ci.yml`도 테스트, 타입 검사, 프로덕션 빌드를 실행하도록 구성되어 있습니다. 실제 실행 결과는 Pull Request의 Checks에서 확인해야 합니다.

## 카메라 제한

카메라 사용에는 브라우저 권한과 HTTPS 또는 `localhost`가 필요합니다. QR을 읽었다고 자동 입장 처리하지 않고, 담당자가 입장 확인 버튼을 눌러야 처리합니다. 카메라를 사용할 수 없으면 직접 입력 또는 키보드형 QR 리더기를 이용할 수 있습니다.

## 실제 Supabase 연결 (별도 단계)

실제 데이터베이스 API 예제는 `app/api/check-in/route.ts`, 테이블 정의는 `supabase/schema.sql`, 환경변수 이름은 `.env.example`에 있습니다.

1. Supabase SQL Editor에서 schema를 적용하고 행사/참가자 데이터를 준비합니다.
2. 로컬 `.env.local`에 `NEXT_PUBLIC_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `CHECKIN_EVENT_ID`를 설정합니다.
3. **중요:** 현재 `/admin/check-in` 화면은 Mock Data 서비스에 연결되어 있고, 기존 `/api/check-in`은 Supabase API를 사용합니다. UI를 실제 행사 운영에 쓰기 전 서비스 교체, 인증/권한 검토, DB 통합 테스트가 필요합니다.
4. 실제 서비스 역할 키와 참가자 개인정보를 GitHub에 커밋하지 마세요.

## 제출 및 배포 상태

- 개인 저장소 PR: 기능 검토용
- 공식 NEXUS 팀 저장소 반영: 미완료
- 실제 Supabase 행사 데이터 설정: 미완료
- 카메라/모바일 브라우저에서 실제 QR 테스트: 이 환경에서 미실행
- CI 자동 테스트/빌드: GitHub Actions 결과 확인 필요

현장 입장에 사용하기 전에 팀의 인증 정책, 권한 관리, DB 규칙, 감사 로그 및 운영 테스트를 확인해야 합니다.
