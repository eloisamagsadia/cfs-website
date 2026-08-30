"use client";
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  initial: number;
  role?: string;
  format?: (n: number) => string | number;
}

export default function LiveMemberCount({ initial, role, format }: Props) {
  const [count, setCount] = useState<number>(initial);

  useEffect(() => {
    const supabase = createClient();
    const channelName = role ? `profiles-count:${role}` : "profiles-count";
    const filter = role ? `role=eq.${role}` : undefined;
    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "profiles", ...(filter ? { filter } : {}) },
        () => setCount(c => c + 1)
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "profiles", ...(filter ? { filter } : {}) },
        () => setCount(c => Math.max(0, c - 1))
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "profiles" },
        async (payload) => {
          if (!role) return;
          const oldRole = (payload.old as any)?.role;
          const newRole = (payload.new as any)?.role;
          if (oldRole === role && newRole !== role) setCount(c => Math.max(0, c - 1));
          if (oldRole !== role && newRole === role) setCount(c => c + 1);
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [role]);

  return <>{format ? format(count) : count}</>;
}
