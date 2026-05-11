import { NextRequest, NextResponse } from "next/server";
import { createPaymentLink, tocentavos } from "@/lib/paymongo";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  const supabase = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
  const { userId } = auth();
  if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { type, referenceId, amount, description } = await req.json();

  if (!type || !referenceId || !amount) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const link = await createPaymentLink({
    amount: tocentavos(amount),
    description,
    referenceId,
    type,
    remarks: `CFS ${type} - ${referenceId}`,
  });

  return NextResponse.json({ checkoutUrl: link.checkoutUrl });
}
