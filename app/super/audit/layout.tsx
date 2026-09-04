import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { isOwner } from "@/lib/hidden-admins";

// Owner-only route. Non-owner super_admins bounce to /super rather than
// hit an empty-with-error client page.
export default function AuditLayout({ children }: { children: React.ReactNode }) {
  const { userId } = auth();
  if (!isOwner(userId)) redirect("/super");
  return <>{children}</>;
}
