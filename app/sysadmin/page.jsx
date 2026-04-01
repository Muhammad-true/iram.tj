"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/** Старый URL — перенаправление на главную. */
export default function SysadminRedirect() {
  const router = useRouter();
  useEffect(() => {
    router.replace("/home");
  }, [router]);
  return (
    <main className="min-h-dvh bg-[#f2f2f7] flex items-center justify-center p-4">
      <p className="text-sm text-gray-500">Переход…</p>
    </main>
  );
}
