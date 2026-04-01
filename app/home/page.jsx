"use client";

import Link from "next/link";
import AppShell from "../../components/AppShell";
import GuestListSection from "../../components/GuestListSection";
import HomeStatsSection from "../../components/HomeStatsSection";
import UpcomingBookings from "../../components/UpcomingBookings";
import { useRequireAuth } from "../../hooks/useRequireAuth";

export default function HomePage() {
  const { user, loading } = useRequireAuth();

  if (loading || !user) {
    return (
      <main className="min-h-dvh bg-[#f2f2f7] flex items-center justify-center p-4">
        <p className="text-sm text-gray-500">Загрузка…</p>
      </main>
    );
  }

  return (
    <AppShell title="Главная" user={user}>
      <div className="mb-4 rounded-[22px] bg-gradient-to-br from-gray-900 to-gray-800 text-white p-4 shadow-lg">
        <p className="text-sm font-medium opacity-90">Быстрый старт</p>
        <p className="text-xs opacity-75 mt-1 mb-3">Подбор свободного номера по датам и типичному сроку ~10 дней</p>
        <Link
          href="/rooms"
          className="inline-flex items-center justify-center w-full py-3 rounded-2xl bg-white text-gray-900 text-sm font-semibold"
        >
          Номера и занятость
        </Link>
      </div>

      {user.role === "superadmin" && (
        <div className="mb-4">
          <HomeStatsSection daysAhead={7} />
        </div>
      )}

      <div className="mb-4">
        <UpcomingBookings daysAhead={30} />
      </div>

      <GuestListSection />
    </AppShell>
  );
}
