import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createAdminClient } from "@/lib/supabase/admin";

function isAdmin(role?: string) {
  return ["admin", "super_admin"].includes(role ?? "");
}

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, sessionClaims } = auth();
  if (!userId || !isAdmin((sessionClaims?.metadata as any)?.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("report_receipts")
    .select("*")
    .eq("report_id", params.id)
    .order("uploaded_at", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ receipts: data ?? [] });
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  const { userId, sessionClaims } = auth();
  if (!userId || !isAdmin((sessionClaims?.metadata as any)?.role))
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file") as File | null;
  const projectName = form.get("project_name") as string | null;
  const itemDescription = form.get("item_description") as string | null;

  if (!file || !projectName || !itemDescription)
    return NextResponse.json({ error: "Missing fields" }, { status: 400 });

  const supabase = createAdminClient();

  const ext = file.name.split(".").pop() ?? "bin";
  const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
  const path = `${params.id}/${slug(projectName)}/${slug(itemDescription)}-${Date.now()}.${ext}`;

  const { error: storageErr } = await supabase.storage
    .from("report-receipts")
    .upload(path, file, { contentType: file.type, upsert: false });

  if (storageErr) return NextResponse.json({ error: storageErr.message }, { status: 500 });

  const { data: { publicUrl } } = supabase.storage.from("report-receipts").getPublicUrl(path);

  const { data: receipt, error: dbErr } = await supabase
    .from("report_receipts")
    .insert({
      report_id: params.id,
      project_name: projectName,
      item_description: itemDescription,
      file_url: publicUrl,
      file_name: file.name,
    })
    .select()
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ receipt });
}
