import { describe, expect, it } from "vitest";
import { checkInRequestSchema } from "./schema";

describe("checkInRequestSchema", () => {
  it("accepts a non-empty participant code", () => {
    expect(checkInRequestSchema.safeParse({ participantCode: " NEXUS-TEST-001 " }).success).toBe(true);
  });

  it("rejects missing or blank codes", () => {
    expect(checkInRequestSchema.safeParse({}).success).toBe(false);
    expect(checkInRequestSchema.safeParse({ participantCode: "   " }).success).toBe(false);
  });

  it("rejects codes that exceed the maximum length", () => {
    expect(checkInRequestSchema.safeParse({ participantCode: "x".repeat(513) }).success).toBe(false);
  });
});
