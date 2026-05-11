import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function DELETE(req: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error:"Unauthorized" }, { status:401 });
  await supabase.from("community_posts").delete().eq("id", params.id).eq("user_id", userId);
  return NextResponse.json({ success:true });
}
