"use client";

import { FormEvent, useRef, useState } from "react";

type ResultState =
  | { type: "success"; title: string; detail: string; checkedInAt: string }
  | { type: "error"; title: string; detail: string }
  | { type: "info"; title: string; detail: string };

type ApiResponse = {
  ok?: boolean;
  code?: string;
  message?: string;
  participantName?: string;
  checkedInAt?: string;
};

function extractParticipantCode(rawValue: string): string {
  const raw = rawValue.trim();
  if (!raw) return "";
  try {
    const parsed: unknown = JSON.parse(raw);
    if (parsed && typeof parsed === "object") {
      const payload = parsed as Record<string, unknown>;
      const candidate = payload.participantCode ?? payload.participantId ?? payload.id;
      if (typeof candidate === "string" && candidate.trim()) return candidate.trim();
    }
  } catch {
    // QR payload may simply be a participant code.
  }
  return raw;
}

function formatTime(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", {
    dateStyle: "medium",
    timeStyle: "medium",
  }).format(date);
}

export default function CheckInPage() {
  const [value, setValue] = useState("");
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultState>({
    type: "info",
    title: "입장 확인 대기 중",
    detail: "참가자 QR 코드를 스캔하거나 코드를 입력해 주세요.",
  });
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    const participantCode = extractParticipantCode(value);
    if (!participantCode) {
      setResult({ type: "error", title: "코드가 비어 있습니다", detail: "QR 코드를 다시 스캔하거나 참가자 코드를 입력해 주세요." });
      inputRef.current?.focus();
      return;
    }

    setBusy(true);
    setResult({ type: "info", title: "확인 중", detail: "참가자 등록 정보와 입장 기록을 확인하고 있습니다." });

    try {
      const response = await fetch("/api/check-in", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ participantCode }),
      });
      const payload = (await response.json()) as ApiResponse;

      if (!response.ok || !payload.ok || !payload.checkedInAt) {
        const messages: Record<string, { title: string; detail: string }> = {
          NOT_FOUND: { title: "등록되지 않은 참가자", detail: "QR 코드가 참가자 등록 정보와 일치하지 않습니다." },
          ALREADY_CHECKED_IN: { title: "이미 입장 처리된 참가자", detail: payload.message ?? "기존 입장 기록이 있어 중복 처리하지 않았습니다." },
          INVALID_INPUT: { title: "QR 코드 확인 필요", detail: payload.message ?? "유효한 참가자 코드가 아닙니다." },
          CONFIGURATION_ERROR: { title: "시스템 설정 오류", detail: "관리자에게 입장 시스템 설정을 확인해 달라고 요청해 주세요." },
        };
        const known = messages[payload.code ?? ""];
        setResult({
          type: "error",
          title: known?.title ?? "입장 확인 실패",
          detail: known?.detail ?? payload.message ?? "잠시 후 다시 시도해 주세요.",
        });
      } else {
        setResult({
          type: "success",
          title: "입장 확인 완료",
          detail: payload.participantName ? `${payload.participantName}님, 입장이 기록되었습니다.` : "참가자 입장이 기록되었습니다.",
          checkedInAt: payload.checkedInAt,
        });
      }
    } catch {
      setResult({
        type: "error",
        title: "서버에 연결할 수 없습니다",
        detail: "네트워크 상태를 확인해 주세요. 서버 응답을 확인하기 전에는 입장 완료로 처리하지 마세요.",
      });
    } finally {
      setBusy(false);
      setValue("");
      inputRef.current?.focus();
    }
  }

  return (
    <main className="shell">
      <header className="topbar">
        <div className="brand-mark" aria-hidden="true">N</div>
        <div>
          <p className="eyebrow">NEXUS EVENT PLATFORM</p>
          <h1>QR Check-in</h1>
          <p className="subtitle">제24회 배재대학교 경영대학 학술제</p>
        </div>
      </header>

      <section className="intro">
        <p className="eyebrow">EVENT STAFF</p>
        <h2>참가자 입장 확인</h2>
        <p>QR 코드를 확인하고 중복 입장을 방지합니다. 입장 기록은 서버에서 확인됩니다.</p>
      </section>

      <section className="panel" aria-labelledby="scan-title">
        <div className="panel-heading">
          <div>
            <p className="step-label">STEP 01</p>
            <h2 id="scan-title">QR 코드 스캔 또는 입력</h2>
          </div>
          <span className="secure-label"><span /> 서버 확인</span>
        </div>
        <form onSubmit={handleSubmit}>
          <label htmlFor="participant-code">참가자 QR 코드 / 참가자 코드</label>
          <div className="input-row">
            <input
              ref={inputRef}
              id="participant-code"
              name="participantCode"
              value={value}
              onChange={(event) => setValue(event.target.value)}
              placeholder="QR 리더기를 사용하거나 코드를 입력하세요"
              autoComplete="off"
              autoFocus
              disabled={busy}
              aria-describedby="scan-help"
            />
            <button type="submit" disabled={busy}>
              {busy ? "확인 중…" : "입장 확인"}
            </button>
          </div>
          <p className="help" id="scan-help">키보드 입력형 QR 리더기는 입력창에 코드를 전송한 뒤 확인 버튼을 눌러 사용합니다.</p>
        </form>

        <div className={`result result--${result.type}`} role="status" aria-live="polite">
          <div className="result-icon" aria-hidden="true">
            {result.type === "success" ? "✓" : result.type === "error" ? "!" : "i"}
          </div>
          <div className="result-copy">
            <h3>{result.title}</h3>
            <p>{result.detail}</p>
            {result.type === "success" && <p className="timestamp">입장 시각: <strong>{formatTime(result.checkedInAt)}</strong></p>}
          </div>
        </div>
      </section>

      <section className="notice">
        <div className="notice-icon" aria-hidden="true">i</div>
        <div>
          <h2>운영 안내</h2>
          <p>등록되지 않은 코드, 이미 입장한 참가자, 네트워크 오류를 각각 구분해 표시합니다. 오류가 발생하면 성공으로 간주하지 말고 담당자에게 확인해 주세요.</p>
        </div>
      </section>

      <footer>입장 데이터는 서버의 기록을 기준으로 처리합니다. 브라우저 저장 정보만으로 입장 여부를 판단하지 않습니다.</footer>
    </main>
  );
}
