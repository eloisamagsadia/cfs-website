import { NextResponse } from "next/server";
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const next = searchParams.get("next") ?? "/members";
  return NextResponse.redirect(new URL(next, req.url));
}
