import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { checkInRequestSchema } from "@/lib/check-in/schema";

export const runtime = "nodejs";

type ParticipantRow = {
  id: string;
  name: string;
  is_active: boolean;
};

function errorResponse(status: number, code: string, message: string) {
  return NextResponse.json({ ok: false, code, message }, { status });
}

function getSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) return null;
  // Server-only client: never import this key into a client component.
  return createClient(url, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

export async function POST(request: Request) {
  let rawBody: unknown;
  try {
    rawBody = await request.json();
  } catch {
    return errorResponse(400, "INVALID_INPUT", "요청 형식이 올바르지 않습니다.");
  }

  const parsed = checkInRequestSchema.safeParse(rawBody);
  if (!parsed.success) {
    return errorResponse(400, "INVALID_INPUT", "참가자 코드를 입력해 주세요.");
  }

  const eventId = process.env.CHECKIN_EVENT_ID;
  const supabase = getSupabaseAdmin();
  if (!eventId || !supabase) {
    return errorResponse(503, "CONFIGURATION_ERROR", "입장 시스템이 아직 설정되지 않았습니다.");
  }

  const participantCode = parsed.data.participantCode;

  const { data: participant, error: participantError } = await supabase
    .from("participants")
    .select("id, name, is_active")
    .eq("event_id", eventId)
    .eq("participant_code", participantCode)
    .maybeSingle<ParticipantRow>();

  if (participantError) {
    return errorResponse(500, "SERVER_ERROR", "참가자 등록 정보를 확인하지 못했습니다.");
  }
  if (!participant || !participant.is_active) {
    return errorResponse(404, "NOT_FOUND", "등록되었거나 활성화된 참가자 코드를 찾을 수 없습니다.");
  }

  // The database UNIQUE(event_id, participant_id) constraint is the source of
  // truth. It prevents two simultaneous requests from creating duplicate rows.
  const { data: checkIn, error: insertError } = await supabase
    .from("check_ins")
    .insert({
      event_id: eventId,
      participant_id: participant.id,
    })
    .select("checked_in_at")
    .single<{ checked_in_at: string }>();

  if (insertError) {
    if (insertError.code === "23505") {
      const { data: existing, error: existingError } = await supabase
        .from("check_ins")
        .select("checked_in_at")
        .eq("event_id", eventId)
        .eq("participant_id", participant.id)
        .maybeSingle<{ checked_in_at: string }>();

      if (existingError) {
        return errorResponse(500, "SERVER_ERROR", "기존 입장 기록을 확인하지 못했습니다.");
      }

      return NextResponse.json(
        {
          ok: false,
          code: "ALREADY_CHECKED_IN",
          message: existing?.checked_in_at
            ? `이미 입장 처리되었습니다. 입장 시각: ${existing.checked_in_at}`
            : "이미 입장 처리된 참가자입니다.",
          checkedInAt: existing?.checked_in_at ?? null,
        },
        { status: 409 },
      );
    }
    return errorResponse(500, "SERVER_ERROR", "입장 기록을 저장하지 못했습니다.");
  }

  return NextResponse.json({
    ok: true,
    code: "CHECKED_IN",
    participantName: participant.name,
    checkedInAt: checkIn.checked_in_at,
  });
}
