"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Props = {
  tables: string | string[];
  channel?: string;
  debounceMs?: number;
};

export default function RealtimeRefresh({ tables, channel, debounceMs = 400 }: Props) {
  const router = useRouter();

  useEffect(() => {
    const list = Array.isArray(tables) ? tables : [tables];
    if (list.length === 0) return;

    const supabase = createClient();
    const channelName = channel ?? `refresh:${list.join(",")}`;
    let ch = supabase.channel(channelName);
    let timer: ReturnType<typeof setTimeout> | null = null;

    const schedule = () => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => router.refresh(), debounceMs);
    };

    for (const table of list) {
      ch = ch.on(
        "postgres_changes",
        { event: "*", schema: "public", table },
        schedule,
      );
    }

    ch.subscribe();

    return () => {
      if (timer) clearTimeout(timer);
      supabase.removeChannel(ch);
    };
  }, [Array.isArray(tables) ? tables.join(",") : tables, channel, debounceMs, router]);

  return null;
}
