import { auth } from "@clerk/nextjs/server";
import { isOwner } from "@/lib/hidden-admins";
import { notFound } from "next/navigation";

// Per-member activity is the deep behavioral trace across every table
// the member touches. Owner-only — regular admins can still moderate
// via the members list but don't get the raw feed.
export default function MemberActivityLayout({ children }: { children: React.ReactNode }) {
  const { userId } = auth();
  if (!isOwner(userId)) notFound();
  return <>{children}</>;
}
