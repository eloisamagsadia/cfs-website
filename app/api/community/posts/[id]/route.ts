import { NextRequest, NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient();
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  await (((supabase.from("community_posts") as any) as any) as any).delete().eq("id", params.id).eq("user_id", userId);
  return NextResponse.json({ success:true });
}
