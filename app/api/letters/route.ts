import { NextResponse } from "next/server";
import { getColetLetters } from "@/lib/letters";

export async function GET() {
  const letters = await getColetLetters();
  return NextResponse.json({ letters });
}
