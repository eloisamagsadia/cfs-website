import { ListObjectsV2Command } from "@aws-sdk/client-s3";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { r2, R2_BUCKET, R2_PUBLIC_URL, deleteFromR2 } from "@/lib/r2";

async function requireAdmin() {
  const { userId, sessionClaims } = auth();
  if (!userId) return null;
  const role = (sessionClaims?.metadata as { role?: string })?.role;
  if (role !== "admin") return null;
  return userId;
}

export async function GET(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const folder = searchParams.get("folder") ?? "";
  try {
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: folder ? `${folder}/` : undefined,
      MaxKeys: 500,
    });
    const response = await r2.send(command);
    const items = (response.Contents ?? [])
      .filter(obj => obj.Key && obj.Key !== `${folder}/`)
      .map(obj => {
        const key = obj.Key!;
        const parts = key.split("/");
        const folderName = parts.length > 1 ? parts[0] : "root";
        const fileName = parts[parts.length - 1];
        const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
        const isImage = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext);
        const isPdf = ext === "pdf";
        return {
          key,
          url: `${R2_PUBLIC_URL}/${key}`,
          folder: folderName,
          name: fileName,
          size: obj.Size ?? 0,
          lastModified: obj.LastModified?.toISOString() ?? "",
          type: isImage ? "image" : isPdf ? "pdf" : "other",
          ext,
        };
      })
      .sort((a, b) => b.lastModified.localeCompare(a.lastModified));
    return NextResponse.json({ items, total: items.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const userId = await requireAdmin();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  try {
    const { keys } = await req.json() as { keys: string[] };
    if (!keys?.length) return NextResponse.json({ error: "No keys provided" }, { status: 400 });
    await Promise.all(keys.map(key => deleteFromR2(`${R2_PUBLIC_URL}/${key}`)));
    return NextResponse.json({ deleted: keys.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
