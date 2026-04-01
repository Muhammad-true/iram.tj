"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { addDaysYmd, todayYmd } from "../lib/dates";

function StatCard({ label, value, hint, tone = "gray" }) {
  const toneCls =
    tone === "emerald"
      ? "from-emerald-50 to-white border-emerald-100 text-emerald-900"
      : tone === "sky"
        ? "from-sky-50 to-white border-sky-100 text-sky-900"
        : "from-violet-50 to-white border-violet-100 text-violet-900";
  return (
    <div className={`rounded-2xl border bg-gradient-to-br p-3 ${toneCls}`}>
      <p className="text-[11px] text-gray-500">{label}</p>
      <p className="mt-1 text-2xl font-black tabular-nums">{value}</p>
      <p className="mt-1 text-[11px] text-gray-500">{hint}</p>
    </div>
  );
}

function StatCardSkeleton() {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-3 animate-pulse">
      <div className="h-3 w-28 bg-gray-200 rounded" />
      <div className="h-7 w-16 bg-gray-200 rounded mt-2" />
      <div className="h-3 w-24 bg-gray-100 rounded mt-2" />
    </div>
  );
}

export default function HomeStatsSection({ daysAhead = 7 }) {
  const [stats, setStats] = useState({
    currentGuests: 0,
    freePlaces: 0,
    arrivalsWeek: 0,
    totalPlaces: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [err, setErr] = useState(null);

  const loadStats = useCallback(async (mode = "initial") => {
    if (mode === "initial") setLoading(true);
    if (mode === "refresh") setRefreshing(true);
    setErr(null);
    try {
      const today = todayYmd();
      const tomorrow = addDaysYmd(today, 1);
      const weekEnd = addDaysYmd(today, daysAhead);
      const [rooms, activeToday, weekWindow] = await Promise.all([
        api.get("/rooms"),
        api.get(`/bookings?from=${encodeURIComponent(today)}&to=${encodeURIComponent(tomorrow)}`),
        api.get(`/bookings?from=${encodeURIComponent(today)}&to=${encodeURIComponent(weekEnd)}`),
      ]);
      const roomList = Array.isArray(rooms) ? rooms : [];
      const activeList = Array.isArray(activeToday) ? activeToday : [];
      const weekList = Array.isArray(weekWindow) ? weekWindow : [];

      const totalPlaces = roomList.reduce((s, r) => s + (Number(r.capacity) || 0), 0);
      const currentGuests = activeList.reduce((s, b) => s + (Number(b.people_count) || 0), 0);
      const arrivalsWeek = weekList
        .filter((b) => {
          const d = String(b?.check_in || "").slice(0, 10);
          return d >= today && d < weekEnd;
        })
        .reduce((s, b) => s + (Number(b.people_count) || 0), 0);

      setStats({
        currentGuests,
        freePlaces: Math.max(0, totalPlaces - currentGuests),
        arrivalsWeek,
        totalPlaces,
      });
    } catch (e) {
      setErr(e?.message || "Ошибка загрузки статистики");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [daysAhead]);

  useEffect(() => {
    loadStats("initial");
  }, [loadStats]);

  return (
    <section className="rounded-[22px] bg-white/80 border border-white/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h2 className="font-semibold text-lg">Статистика санатория</h2>
          <p className="text-xs text-gray-500 mt-0.5">Текущее заселение и заезды на {daysAhead} дней</p>
        </div>
        <button
          type="button"
          onClick={() => loadStats("refresh")}
          disabled={loading || refreshing}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {(loading || refreshing) && (
            <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-gray-300 border-t-gray-700 animate-spin" />
          )}
          {loading || refreshing ? "Обновляем…" : "Обновить"}
        </button>
      </div>

      {err && (
        <div className="mb-3 rounded-xl border border-red-100 bg-red-50 px-3 py-2 text-sm text-red-700">
          {err}
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <StatCardSkeleton />
          <StatCardSkeleton />
          <StatCardSkeleton />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
          <StatCard
            label="Сейчас проживает"
            value={stats.currentGuests}
            hint={`из ${stats.totalPlaces} мест`}
            tone="emerald"
          />
          <StatCard
            label="Свободных мест"
            value={stats.freePlaces}
            hint="доступно на сегодня"
            tone="sky"
          />
          <StatCard
            label={`Заезды на ${daysAhead} дней`}
            value={stats.arrivalsWeek}
            hint="планируемый приток"
            tone="violet"
          />
        </div>
      )}
    </section>
  );
}
