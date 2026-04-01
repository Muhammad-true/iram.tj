"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, loadAuthToken, setAuthToken } from "../lib/api";

export default function Home() {
  const router = useRouter();
  const [done, setDone] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = loadAuthToken();
      if (!token) {
        router.replace("/login");
        return;
      }
      try {
        const me = await api.get("/me");
        if (cancelled) return;
        router.replace("/home");
      } catch {
        setAuthToken(null);
        router.replace("/login");
      } finally {
        if (!cancelled) setDone(true);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  return (
    <main className="min-h-dvh bg-[#f2f2f7] flex items-center justify-center p-4">
      <p className="text-sm text-gray-500">{done ? "" : "Загрузка…"}</p>
    </main>
  );
}
