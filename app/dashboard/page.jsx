"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Старый URL — перенаправление на номера. */
export default function DashboardRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/rooms");
  }, [router]);
  return (
    <main className="min-h-dvh bg-[#f2f2f7] flex items-center justify-center p-4">
      <p className="text-sm text-gray-500">Переход…</p>
    </main>
  );
}
