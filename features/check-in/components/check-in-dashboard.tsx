"use client";

import { FormEvent, useMemo, useRef, useState } from "react";
import QRCodeScanner from "@/components/qr-code-scanner";
import type { CheckInLog, CheckInStatus } from "@/types/check-in";
import { mockParticipants, mockRecentLogs } from "../data/mock-participants";
import { normalizeParticipantCode, processMockCheckIn } from "../services/mock-check-in-service";
import styles from "./check-in-dashboard.module.css";

const statusLabels: Record<CheckInStatus, string> = {
  SUCCESS: "입장 완료",
  ALREADY_CHECKED_IN: "중복 입장",
  NOT_FOUND: "미등록 참가자",
  ERROR: "확인 오류",
};
const liveMode = process.env.NEXT_PUBLIC_CHECKIN_MODE === "live";

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("ko-KR", { dateStyle: "medium", timeStyle: "medium" }).format(date);
}

function badgeClass(status: CheckInStatus) {
  if (status === "SUCCESS") return styles.badgeSuccess;
  if (status === "ALREADY_CHECKED_IN") return styles.badgeDuplicate;
  return styles.badgeError;
}

export default function CheckInDashboard() {
  const [code, setCode] = useState("");
  const [logs, setLogs] = useState<CheckInLog[]>(liveMode ? [] : mockRecentLogs);
  const [result, setResult] = useState<CheckInLog | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const checkedInCodes = useMemo(
    () => new Set(logs.filter((log) => log.status === "SUCCESS" || log.status === "ALREADY_CHECKED_IN").map((log) => log.participantCode.toUpperCase())),
    [logs],
  );
  const successCount = logs.filter((log) => log.status === "SUCCESS").length;
  const failureCount = logs.filter((log) => log.status !== "SUCCESS").length;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (submitting) return;
    setSubmitting(true);

    try {
      let log: CheckInLog;
      if (liveMode) {
        const participantCode = normalizeParticipantCode(code);
        const response = await fetch("/api/check-in", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ participantCode }),
        });
        const payload = await response.json().catch(() => ({})) as {
          ok?: boolean;
          code?: string;
          message?: string;
          participantName?: string;
          checkedInAt?: string | null;
        };
        const status: CheckInStatus = response.ok
          ? "SUCCESS"
          : payload.code === "ALREADY_CHECKED_IN"
            ? "ALREADY_CHECKED_IN"
            : payload.code === "NOT_FOUND"
              ? "NOT_FOUND"
              : "ERROR";
        log = {
          id: `live-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
          participantCode: participantCode || "(빈 코드)",
          participantName: payload.participantName ?? (status === "NOT_FOUND" ? "확인 불가" : "참가자"),
          status,
          message: payload.message ?? (response.ok ? "입장 확인 완료" : "서버에서 입장을 확인하지 못했습니다."),
          checkedInAt: payload.checkedInAt ?? new Date().toISOString(),
        };
      } else {
        log = processMockCheckIn(code, mockParticipants, checkedInCodes).log;
      }

      setResult(log);
      setLogs((current) => [log, ...current].slice(0, 12));
      if (log.status === "SUCCESS") setCode("");
    } catch {
      const log: CheckInLog = {
        id: `network-error-${Date.now()}`,
        participantCode: normalizeParticipantCode(code) || "(빈 코드)",
        participantName: "확인 불가",
        status: "ERROR",
        message: "서버에 연결할 수 없습니다. 네트워크와 서버 설정을 확인해 주세요.",
        checkedInAt: new Date().toISOString(),
      };
      setResult(log);
      setLogs((current) => [log, ...current].slice(0, 12));
    } finally {
      setSubmitting(false);
      inputRef.current?.focus();
    }
  }

  function handleScan(decoded: string) {
    setCode(decoded);
    setResult(null);
    inputRef.current?.focus();
  }

  return (
    <main className={styles.layout}>
      <header className={styles.header}>
        <div className={styles.brand} aria-hidden="true">N</div>
        <div>
          <p className={styles.eyebrow}>NEXUS EVENT PLATFORM</p>
          <h1 className={styles.title}>QR Check-in</h1>
          <p className={styles.subtitle}>행사 참가자 입장 관리 · 담당: 이경운</p>
        </div>
      </header>

      <section className={styles.intro}>
        <p className={styles.eyebrow}>EVENT STAFF / ADMIN</p>
        <h2>참가자 입장 확인</h2>
        <p>QR 코드를 스캔하거나 참가자 코드를 직접 입력하세요. 등록 여부와 중복 입장을 확인하고 입장 시각을 기록합니다.</p>
      </section>

      <section className={styles.stats} aria-label="입장 처리 요약">
        <div className={styles.stat}><p className={styles.statLabel}>입장 성공 기록</p><p className={styles.statValue}>{successCount}</p></div>
        <div className={styles.stat}><p className={styles.statLabel}>확인/실패 기록</p><p className={styles.statValue}>{failureCount}</p></div>
        <div className={styles.stat}><p className={styles.statLabel}>{liveMode ? "처리 기록" : "테스트 참가자"}</p><p className={styles.statValue}>{liveMode ? logs.length : mockParticipants.filter((item) => item.isActive).length}{liveMode ? "건" : "명"}</p></div>
      </section>

      <div className={styles.columns}>
        <section className={styles.panel} aria-labelledby="checkin-heading">
          <h2 className={styles.panelTitle} id="checkin-heading">QR 스캔 및 입장 확인</h2>
          <p className={styles.panelDescription}>카메라 사용이 불가능하면 키보드형 QR 리더기 또는 직접 입력을 사용하세요.</p>
          <div className={styles.cameraWrap}>
            <QRCodeScanner onScan={handleScan} />
          </div>
          <div className={styles.divider}>또는 코드 직접 입력</div>
          <form onSubmit={handleSubmit}>
            <label className={styles.label} htmlFor="participant-code">참가자 QR 코드 / 참가자 코드</label>
            <div className={styles.formRow}>
              <input
                ref={inputRef}
                className={styles.input}
                id="participant-code"
                name="participantCode"
                value={code}
                onChange={(event) => setCode(event.target.value)}
                placeholder="예: NEXUS-001"
                autoComplete="off"
                aria-describedby="input-help"
              />
              <button className={styles.primaryButton} type="submit" disabled={submitting}>{submitting ? "확인 중…" : "입장 확인"}</button>
            </div>
            <p className={styles.help} id="input-help">{liveMode ? "실제 서버 모드입니다. 등록된 행사 참가자 코드만 사용할 수 있습니다." : "테스트 코드: NEXUS-001, NEXUS-002, NEXUS-003. NEXUS-004는 비활성 상태입니다."}</p>
          </form>

          {result && (
            <div className={`${styles.result} ${result.status === "SUCCESS" ? styles.success : result.status === "ERROR" ? styles.info : styles.error}`} role="status" aria-live="polite">
              <div className={styles.resultIcon} aria-hidden="true">{result.status === "SUCCESS" ? "✓" : result.status === "ERROR" ? "i" : "!"}</div>
              <div>
                <h3 className={styles.resultTitle}>{statusLabels[result.status]}</h3>
                <p className={styles.resultText}>{result.participantName !== "확인 불가" ? `${result.participantName} · ` : ""}{result.message}</p>
                <p className={styles.timestamp}>처리 시각: {formatTime(result.checkedInAt)}</p>
              </div>
            </div>
          )}
        </section>

        <section className={styles.panel} aria-labelledby="recent-heading">
          <div className={styles.logHeader}>
            <h2 id="recent-heading">최근 처리 기록</h2>
            <span className={styles.logCount}>현재 화면의 최대 12건</span>
          </div>
          {logs.length === 0 ? (
            <p className={styles.empty}>아직 처리 기록이 없습니다.</p>
          ) : (
            <ol className={styles.logList}>
              {logs.map((log) => (
                <li className={styles.logItem} key={log.id}>
                  <div>
                    <p className={styles.logName}>{log.participantName}</p>
                    <p className={styles.logCode}>{log.participantCode}</p>
                  </div>
                  <span className={`${styles.badge} ${badgeClass(log.status)}`}>{statusLabels[log.status]}</span>
                  <span className={styles.logTime}>{formatTime(log.checkedInAt)} · {log.message}</span>
                </li>
              ))}
            </ol>
          )}
          <div className={styles.note}>{liveMode ? "실제 서버 모드입니다. 이 목록은 현재 화면에서 처리한 기록만 보여주며, 새로고침 후 전체 기록을 불러오지는 않습니다." : "Mock Data 모드입니다. 새로고침하면 테스트 기록이 초기화되며 실제 데이터베이스에는 저장되지 않습니다."}</div>
        </section>
      </div>
      <div className={styles.note}>카메라 스캔은 브라우저 권한과 HTTPS 또는 localhost가 필요합니다. QR 인식만으로 입장 처리하지 않으며, 담당자가 확인 버튼을 눌러야 처리됩니다.</div>
    </main>
  );
}
