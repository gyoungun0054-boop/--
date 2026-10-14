import type { CheckInLog, CheckInResult, Participant } from "@/types/check-in";

export function normalizeParticipantCode(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "";

  try {
    const payload: unknown = JSON.parse(trimmed);
    if (payload && typeof payload === "object") {
      const record = payload as Record<string, unknown>;
      const code = record.participantCode ?? record.participantId ?? record.id;
      if (typeof code === "string" && code.trim()) return code.trim().toUpperCase();
    }
  } catch {
    // QR codes can contain a plain participant code instead of JSON.
  }

  return trimmed.toUpperCase();
}

export function processMockCheckIn(
  rawCode: string,
  participants: Participant[],
  checkedInCodes: ReadonlySet<string>,
  now = new Date(),
): CheckInResult {
  const code = normalizeParticipantCode(rawCode);
  const participant = participants.find((item) => item.code.toUpperCase() === code);
  let status: CheckInResult["status"];
  let message: string;

  if (!code) {
    status = "ERROR";
    message = "QR 코드 또는 참가자 코드를 입력해 주세요.";
  } else if (!participant || !participant.isActive) {
    status = "NOT_FOUND";
    message = "등록되었거나 활성화된 참가자를 찾을 수 없습니다.";
  } else if (checkedInCodes.has(participant.code.toUpperCase())) {
    status = "ALREADY_CHECKED_IN";
    message = "이미 입장 처리된 참가자입니다. 중복 기록은 생성하지 않았습니다.";
  } else {
    status = "SUCCESS";
    message = "참가자 입장이 확인되었습니다.";
  }

  const timestamp = now.toISOString();
  const log: CheckInLog = {
    id: `mock-${now.getTime()}-${Math.random().toString(36).slice(2, 8)}`,
    participantCode: code || "(빈 코드)",
    participantName: participant?.name ?? "확인 불가",
    status,
    message,
    checkedInAt: timestamp,
  };

  return { status, participant, message, checkedInAt: timestamp, log };
}
