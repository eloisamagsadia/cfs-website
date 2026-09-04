import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isOwner } from "@/lib/hidden-admins";

export default function BackupLayout({ children }: { children: React.ReactNode }) {
  const { userId } = auth();
  if (!isOwner(userId)) redirect("/super");
  return <>{children}</>;
}
