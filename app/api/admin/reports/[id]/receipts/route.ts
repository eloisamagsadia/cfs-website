import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { PutObjectCommand } from "@aws-sdk/client-s3";
import sharp from "sharp";
import { createAdminClient } from "@/lib/supabase/admin";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";

function isAdmin(role?: string) {
  return ["admin", "super_admin"].includes(role ?? "");
}

function slugify(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);
}

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

async function optimizeImage(buffer: Buffer, mimeType: string) {
  if (!ALLOWED_IMAGE_TYPES.includes(mimeType)) return { buffer, ext: "bin", contentType: mimeType };
  const optimized = await sharp(buffer)
    .resize(1600, 1600, { fit: "inside", withoutEnlargement: true })
    .webp({ quality: 85 })
    .toBuffer();
  return { buffer: optimized, ext: "webp", contentType: "image/webp" };
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

  const isPdf = file.type === "application/pdf";
  const rawBuffer = Buffer.from(await file.arrayBuffer());

  let uploadBuffer: Buffer;
  let contentType: string;
  let ext: string;

  if (isPdf) {
    uploadBuffer = rawBuffer;
    contentType = "application/pdf";
    ext = "pdf";
  } else {
    const optimized = await optimizeImage(rawBuffer, file.type);
    uploadBuffer = optimized.buffer;
    contentType = optimized.contentType;
    ext = optimized.ext;
  }

  const nameSlug = slugify(projectName);
  const key = `reports/receipts/${params.id}/${nameSlug}-${Date.now()}.${ext}`;

  await r2.send(new PutObjectCommand({
    Bucket: R2_BUCKET,
    Key: key,
    Body: uploadBuffer,
    ContentType: contentType,
  }));

  const publicUrl = `${R2_PUBLIC_URL}/${key}`;

  const supabase = createAdminClient();
  const { data: receipt, error: dbErr } = await supabase
    .from("report_receipts")
    .insert({
      report_id: params.id,
      project_name: projectName,
      item_description: itemDescription,
      file_url: publicUrl,
      file_name: projectName,
    })
    .select()
    .single();

  if (dbErr) return NextResponse.json({ error: dbErr.message }, { status: 500 });
  return NextResponse.json({ receipt });
}
