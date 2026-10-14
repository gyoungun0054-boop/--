import type { CheckInLog, Participant } from "@/types/check-in";

/**
 * Fake attendees for local UI validation only. Do not replace these with real
 * attendee details in a public repository.
 */
export const mockParticipants: Participant[] = [
  { id: "mock-participant-001", code: "NEXUS-001", name: "김민서", isActive: true },
  { id: "mock-participant-002", code: "NEXUS-002", name: "박지훈", isActive: true },
  { id: "mock-participant-003", code: "NEXUS-003", name: "이서연", isActive: true },
  { id: "mock-participant-004", code: "NEXUS-004", name: "최도윤", isActive: false },
];

const minutesAgo = (minutes: number) => new Date(Date.now() - minutes * 60_000).toISOString();

/** Demo history: NEXUS-002 has already checked in, for duplicate-flow testing. */
export const mockRecentLogs: CheckInLog[] = [
  {
    id: "mock-log-001",
    participantCode: "NEXUS-002",
    participantName: "박지훈",
    status: "SUCCESS",
    message: "입장 확인 완료",
    checkedInAt: minutesAgo(3),
  },
  {
    id: "mock-log-002",
    participantCode: "NEXUS-003",
    participantName: "이서연",
    status: "SUCCESS",
    message: "입장 확인 완료",
    checkedInAt: minutesAgo(8),
  },
];
