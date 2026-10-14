import { describe, expect, it } from "vitest";
import { mockParticipants } from "../data/mock-participants";
import { processMockCheckIn } from "./mock-check-in-service";

describe("processMockCheckIn", () => {
  const fixedDate = new Date("2026-10-14T10:00:00.000Z");

  it("accepts a registered active participant and records a timestamp", () => {
    const result = processMockCheckIn("NEXUS-001", mockParticipants, new Set(), fixedDate);
    expect(result.status).toBe("SUCCESS");
    expect(result.participant?.name).toBe("김민서");
    expect(result.checkedInAt).toBe(fixedDate.toISOString());
  });

  it("prevents a duplicate check-in", () => {
    const result = processMockCheckIn("NEXUS-002", mockParticipants, new Set(["NEXUS-002"]), fixedDate);
    expect(result.status).toBe("ALREADY_CHECKED_IN");
  });

  it("rejects unknown and inactive participants", () => {
    expect(processMockCheckIn("UNKNOWN", mockParticipants, new Set(), fixedDate).status).toBe("NOT_FOUND");
    expect(processMockCheckIn("NEXUS-004", mockParticipants, new Set(), fixedDate).status).toBe("NOT_FOUND");
  });

  it("rejects blank input and extracts JSON QR payloads", () => {
    expect(processMockCheckIn("   ", mockParticipants, new Set(), fixedDate).status).toBe("ERROR");
    expect(processMockCheckIn('{"participantCode":"NEXUS-001"}', mockParticipants, new Set(), fixedDate).status).toBe("SUCCESS");
  });
});
