import { NextRequest, NextResponse } from "next/server";
import { PREMIUM_VOICES } from "@/lib/tts";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const gender = searchParams.get("gender");
  const locale = searchParams.get("locale");

  let voices = PREMIUM_VOICES;

  if (gender) {
    voices = voices.filter((v) => v.gender === gender);
  }

  if (locale) {
    voices = voices.filter((v) => v.locale === locale);
  }

  return NextResponse.json(voices);
}
