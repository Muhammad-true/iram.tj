"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { api } from "../lib/api";
import { addDaysYmd, todayYmd } from "../lib/dates";
import { formatSom } from "../lib/format";

export default function UpcomingBookings({ daysAhead = 30 }) {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const from = todayYmd();
      const to = addDaysYmd(from, Math.max(0, daysAhead - 1));
      const qs = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const data = await api.get(`/bookings${qs}`);
      const list = Array.isArray(data) ? data : [];
      list.sort((a, b) => String(a.check_in).localeCompare(String(b.check_in)));
      setRows(list);
    } catch (e) {
      setErr(e.message || "Ошибка");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [daysAhead]);

  useEffect(() => {
    load();
  }, [load]);

  if (loading) {
    return (
      <section className="rounded-[22px] bg-white/80 border border-white/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-gray-500">Загрузка броней…</p>
      </section>
    );
  }

  if (err) {
    return (
      <section className="rounded-[22px] bg-white/80 border border-white/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-red-600">{err}</p>
        <button type="button" onClick={load} className="mt-2 text-sm underline">
          Повторить
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-[22px] bg-white/80 border border-white/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      <div className="flex justify-between items-start gap-2 mb-3">
        <div>
          <h2 className="font-semibold text-lg">Ближайшие брони</h2>
          <p className="text-xs text-gray-500 mt-0.5">С {todayYmd()} на {daysAhead} дней вперёд</p>
        </div>
        <Link href="/bookings" className="text-sm font-medium text-gray-700 underline underline-offset-2">
          Все
        </Link>
      </div>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">Нет броней в этом окне</p>
      ) : (
        <ul className="space-y-2 max-h-[320px] overflow-y-auto pr-1">
          {rows.map((b) => (
            <li key={b.id} className="p-3 rounded-xl bg-gray-50 text-sm border border-gray-100/90">
              <p className="font-medium">
                №{b.room_number} · {b.guest_name || "Гость"}
              </p>
              <p className="text-gray-600 text-xs mt-1">
                {b.check_in} — {b.check_out} · {b.people_count} чел.
              </p>
              <p className="text-gray-500 text-xs mt-1">
                Предоплата {formatSom(b.prepayment)} · долг {formatSom(b.debt)}
                {Number(b.discount_percent) > 0 ? ` · скидка ${b.discount_percent}%` : ""}
                {b.user_name && ` · ${b.user_name}`}
              </p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
