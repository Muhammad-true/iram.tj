"use client";

import AppShell from "../../components/AppShell";
import GuestListSection from "../../components/GuestListSection";
import { useRequireAuth } from "../../hooks/useRequireAuth";

export default function GuestsPage() {
  const { user, loading } = useRequireAuth();

  if (loading || !user) {
    return (
      <main className="min-h-dvh bg-[#f2f2f7] flex items-center justify-center p-4">
        <p className="text-sm text-gray-500">Загрузка…</p>
      </main>
    );
  }

  return (
    <AppShell title="Гости" user={user}>
      <GuestListSection />
    </AppShell>
  );
}
