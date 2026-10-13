import { z } from "zod";

export const checkInRequestSchema = z.object({
  participantCode: z.string().trim().min(1).max(512),
});

export type CheckInRequest = z.infer<typeof checkInRequestSchema>;
