import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteFromR2 } from "@/lib/r2";

function isAdmin(role?: string) {
  return ["admin", "super_admin"].includes(role ?? "");
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string; receiptId: string } }
) {
  const { userId, sessionClaims } = auth();
  if (!userId || !isAdmin((sessionClaims?.metadata as any)?.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();

  const { data: receipt } = await supabase
    .from("report_receipts")
    .select("file_url")
    .eq("id", params.receiptId)
    .eq("report_id", params.id)
    .single();

  if (receipt?.file_url) {
    await deleteFromR2(receipt.file_url).catch(() => {});
  }

  const { error } = await supabase
    .from("report_receipts")
    .delete()
    .eq("id", params.receiptId)
    .eq("report_id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ ok: true });
}
