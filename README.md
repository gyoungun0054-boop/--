# NEXUS QR Check-in

이 저장소는 NEXUS Event Platform의 QR 입장 확인 기능을 별도로 검토하고 실행하기 위한 Next.js 시제품입니다.

> **중요:** 이 코드는 공식 팀 저장소 `paichai-nexus/nexus-event-platform`에 병합된 코드가 아닙니다. GitHub 연동 권한이 공식 저장소에서 읽기 전용으로 확인되어, 현재는 개인 저장소에서 구현 및 검토하고 있습니다.

## 구현 범위

- QR 리더기 또는 수동 입력을 통한 참가자 코드 수신
- JSON QR 페이로드의 `participantCode`, `participantId`, `id` 필드 처리
- Zod를 이용한 입력 검증
- Supabase에 등록된 활성 참가자만 입장 처리
- 등록되지 않은 코드, 중복 입장, 설정 오류, 서버/네트워크 오류 구분
- 서버가 반환한 입장 시각 표시
- 데이터베이스 UNIQUE 제약으로 동시 요청 중복 입장 방지
- 반응형 입장 확인 화면 및 Vitest 입력 검증 테스트

## 실행 준비

필요한 환경: Node.js 20 이상 권장, npm, Supabase 프로젝트.

1. 저장소를 내려받고 의존성을 설치합니다.

   ```bash
   npm install
   ```

2. `.env.example`을 참고해 로컬 `.env.local`을 만들고 값을 설정합니다.

   ```text
   NEXT_PUBLIC_SUPABASE_URL=Supabase 프로젝트 URL
   SUPABASE_SERVICE_ROLE_KEY=서버 전용 서비스 역할 키
   CHECKIN_EVENT_ID=사전에 생성한 행사 UUID
   ```

   실제 키를 GitHub에 커밋하지 마세요. `SUPABASE_SERVICE_ROLE_KEY`는 서버에서만 사용하며 브라우저 코드에 노출하면 안 됩니다.

3. Supabase SQL Editor에서 `supabase/schema.sql`을 실행합니다. `participants`와 `check_ins` 테이블을 생성한 뒤, 행사 ID에 맞는 테스트 참가자를 별도 환경에서 등록합니다.

4. 실행합니다.

   ```bash
   npm run dev
   ```

   브라우저에서 `http://localhost:3000`을 엽니다.

5. 정적 입력 검증 테스트와 타입 검사를 실행합니다.

   ```bash
   npm test
   npm run typecheck
   npm run build
   ```

## 데이터베이스 동작

- 참가자는 `event_id + participant_code` 조합으로 조회됩니다.
- 입장 기록은 `check_ins` 테이블에 기록됩니다.
- `UNIQUE(event_id, participant_id)` 제약으로 같은 참가자의 중복 기록을 데이터베이스가 차단합니다.
- 입장 시각은 브라우저 시계가 아니라 데이터베이스의 `checked_in_at` 값을 사용합니다.
- 서비스 역할 키를 쓰는 API는 서버에서만 실행됩니다.

## 현재 제한사항 / 공식 프로젝트 통합 전 확인할 것

- 카메라 QR 스캔 UI는 포함하지 않았습니다. 요구사항 우선순위에 따라 QR 리더기 입력 및 처리 흐름을 먼저 구현했습니다.
- 실제 행사 ID와 참가자 데이터를 구성하지 않았습니다. 공개 저장소에 실제 개인정보를 추가하지 마세요.
- 행사 운영 전에 공식 팀의 최종 기술 스택, DB 규칙, 인증·권한 정책, 테스트 기준과 일치하는지 개발 리드의 리뷰가 필요합니다.
- 이 데모의 API는 행사에 맞는 인증/요청 제한 정책과 운영 로그 정책을 적용한 후에만 현장 배포 대상으로 검토해야 합니다.
- 브라우저 네트워크 오류가 나면 입장 성공으로 표시하지 않습니다. 재시도 전에는 담당자가 서버의 입장 기록을 확인해야 합니다.

## 담당 기능

이경운 — QR Check-in: 참가자 확인, 중복 입장 방지, 성공/실패 상태, 입장 시각 기록 UI.
