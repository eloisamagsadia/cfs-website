import { NextRequest, NextResponse } from "next/server";
import { auth, clerkClient } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

const db = () => createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

export async function POST(req: NextRequest) {
  const { userId, sessionClaims } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const callerRole = (sessionClaims?.metadata as { role?: string })?.role;
  if (callerRole !== "super_admin") {
    return NextResponse.json({ error: "Only super admin can delete users" }, { status: 403 });
  }

  const { targetUserId } = await req.json();
  if (!targetUserId) return NextResponse.json({ error: "Missing targetUserId" }, { status: 400 });
  if (targetUserId === userId) return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });

  // Delete from Clerk
  try {
    await clerkClient.users.deleteUser(targetUserId);
  } catch (e: any) {
    console.error("[delete] Clerk delete failed:", e?.message ?? e);
    return NextResponse.json({ error: `Clerk delete failed: ${e?.message ?? "unknown"}` }, { status: 500 });
  }

  // Delete from Supabase (CASCADE handles related rows)
  const { error: dbError } = await db().from("profiles").delete().eq("id", targetUserId);
  if (dbError) {
    console.error("[delete] Supabase delete failed:", dbError.message);
    return NextResponse.json({ error: `DB delete failed: ${dbError.message}` }, { status: 500 });
  }

  await db().from("mod_actions").insert({
    mod_id: userId,
    action_type: "delete_user",
    target_type: "member",
    target_id: targetUserId,
    notes: "User deleted by super admin",
  });

  return NextResponse.json({ ok: true });
}
