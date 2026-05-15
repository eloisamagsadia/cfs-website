import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { r2, R2_BUCKET, R2_PUBLIC_URL } from "@/lib/r2";

const FOLDERS = ["avatars", "community", "products", "events", "reports", "projects", "badges", "gallery"];

export async function GET() {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const grouped: Record<string, { key: string; url: string; size: number; uploaded: string }[]> = {};
  let totalSize = 0;

  for (const folder of FOLDERS) {
    const prefix = `${folder}/${userId}/`;
    const command = new ListObjectsV2Command({
      Bucket: R2_BUCKET,
      Prefix: prefix,
    });

    const { Contents = [] } = await r2.send(command);

    if (Contents.length > 0) {
      grouped[folder] = Contents.map(obj => ({
        key: obj.Key!,
        url: `${R2_PUBLIC_URL}/${obj.Key}`,
        size: obj.Size ?? 0,
        uploaded: obj.LastModified?.toISOString() ?? "",
      }));
      totalSize += Contents.reduce((sum, obj) => sum + (obj.Size ?? 0), 0);
    }
  }

  return NextResponse.json({ media: grouped, totalSize });
}

export async function DELETE(req: NextRequest) {
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { key } = await req.json();

  // Security: ensure the key belongs to this user
  if (!key.includes(`/${userId}/`)) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await r2.send(new DeleteObjectCommand({ Bucket: R2_BUCKET, Key: key }));
  return NextResponse.json({ success: true });
}
