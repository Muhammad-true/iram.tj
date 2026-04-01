"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { api } from "../../lib/api";
import { addDaysYmd, todayYmd } from "../../lib/dates";
import { formatDateTimeRu, formatSom } from "../../lib/format";
import { formatTajikPhoneDisplay } from "../../lib/phone";

const DIFF_LABELS = {
  check_in: "Заезд",
  check_out: "Выезд",
  people_count: "Гостей",
  prepayment: "Предоплата",
  debt: "Долг",
  discount_percent: "Скидка %",
  payment_method: "Способ оплаты",
  room_id: "ID номера",
  room_number: "Номер комнаты",
  guest_name: "Гость",
  guest_phone: "Телефон",
};

function formatPm(v) {
  if (v === "card") return "карта";
  if (v === "cash") return "наличные";
  return v != null ? String(v) : "—";
}

function formatDiffValue(key, v) {
  if (v === null || v === undefined) return "—";
  if (key === "prepayment" || key === "debt") return formatSom(v);
  if (key === "payment_method") return formatPm(v);
  if (key === "guest_phone" || key === "actor_phone") return formatTajikPhoneDisplay(v);
  return String(v);
}

function DiffLines({ diff }) {
  if (!diff || typeof diff !== "object") return null;
  const keys = Object.keys(diff);
  if (keys.length === 0) {
    return <p className="text-xs text-gray-400">Без изменений полей (повторное сохранение)</p>;
  }
  return (
    <ul className="text-xs text-gray-700 space-y-0.5 mt-1">
      {keys.map((k) => {
        const pair = diff[k];
        if (!Array.isArray(pair) || pair.length < 2) return null;
        const label = DIFF_LABELS[k] || k;
        return (
          <li key={k}>
            <span className="text-gray-500">{label}:</span>{" "}
            <span className="line-through text-gray-400">{formatDiffValue(k, pair[0])}</span>
            {" → "}
            <span className="font-medium">{formatDiffValue(k, pair[1])}</span>
          </li>
        );
      })}
    </ul>
  );
}

function SnapshotBlock({ snap }) {
  if (!snap || typeof snap !== "object") return null;
  return (
    <div className="text-xs text-gray-600 space-y-0.5 mt-1 pl-2 border-l-2 border-gray-200">
      <p>
        <span className="text-gray-500">Номер:</span> №{snap.room_number ?? "—"} ·{" "}
        <span className="text-gray-500">гость:</span> {snap.guest_name || "—"}
      </p>
      <p>
        <span className="text-gray-500">Заезд / выезд:</span> {snap.check_in ?? "—"} — {snap.check_out ?? "—"} ·{" "}
        {snap.people_count ?? "—"} чел.
      </p>
      <p>
        <span className="text-gray-500">Оформил бронь (в карточке):</span>{" "}
        {snap.booking_user_name || "—"}
        {snap.booking_user_id != null ? ` (#${snap.booking_user_id})` : ""}
      </p>
      <p>
        <span className="text-gray-500">Предоплата:</span> {formatSom(snap.prepayment)} ·{" "}
        <span className="text-gray-500">долг:</span> {formatSom(snap.debt)} ·{" "}
        <span className="text-gray-500">всего учтено:</span> {formatSom(snap.total_accounted)}
        {Number(snap.discount_percent) > 0 ? ` · скидка ${snap.discount_percent}%` : ""}
      </p>
      <p>
        <span className="text-gray-500">Оплата:</span> {formatPm(snap.payment_method)}
      </p>
    </div>
  );
}

export default function AuditBookingsPage() {
  const { user, loading } = useRequireAuth({ requireSuperadmin: true });
  const [from, setFrom] = useState(() => addDaysYmd(todayYmd(), -30));
  const [to, setTo] = useState(() => todayYmd());
  const [bookingFilter, setBookingFilter] = useState("");
  const [rows, setRows] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    setErr(null);
    setDataLoading(true);
    try {
      const qs = new URLSearchParams();
      if (from && to && from <= to) {
        qs.set("from", from);
        qs.set("to", to);
      }
      const id = Math.trunc(Number(bookingFilter) || 0);
      if (id > 0) qs.set("booking_id", String(id));
      const q = qs.toString();
      const data = await api.get(`/audit/bookings${q ? `?${q}` : ""}`);
      setRows(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Ошибка загрузки");
      setRows([]);
    } finally {
      setDataLoading(false);
    }
  }, [from, to, bookingFilter]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, load]);

  const actionStyle = useMemo(
    () => ({
      create: "bg-emerald-100 text-emerald-900",
      update: "bg-amber-100 text-amber-950",
      delete: "bg-red-100 text-red-900",
    }),
    []
  );

  if (loading || !user) {
    return (
      <main className="min-h-dvh bg-[#f2f2f7] flex items-center justify-center p-4">
        <p className="text-sm text-gray-500">Загрузка…</p>
      </main>
    );
  }

  return (
    <AppShell title="Журнал броней" user={user}>
      <p className="text-sm text-gray-600 mb-4">
        Все действия с бронями: кто и когда оформил или изменил, предоплата и долг, изменение дат (например сократили
        срок до 6 дней), удаление. Виден администратор, который выполнил действие в системе.
      </p>

      <div className="mb-4 rounded-[22px] bg-white/80 border border-white/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)] space-y-3">
        <div className="flex flex-wrap gap-2 items-center">
          <label className="text-sm text-gray-600">
            С{" "}
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="ml-1 p-2 rounded-xl bg-gray-100 text-sm"
            />
          </label>
          <label className="text-sm text-gray-600">
            По{" "}
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="ml-1 p-2 rounded-xl bg-gray-100 text-sm"
            />
          </label>
          <label className="text-sm text-gray-600 flex items-center gap-2">
            Бронь №
            <input
              type="number"
              min={1}
              placeholder="все"
              value={bookingFilter}
              onChange={(e) => setBookingFilter(e.target.value)}
              className="w-24 p-2 rounded-xl bg-gray-100 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => load()}
            className="px-3 py-2 rounded-xl bg-gray-900 text-white text-sm font-medium"
          >
            Обновить
          </button>
        </div>
        <p className="text-xs text-gray-500">
          Без пересечения дат журнал показывает до 800 последних записей. С фильтром по датам — события за период.
        </p>
      </div>

      {err && (
        <div className="mb-4 rounded-2xl bg-red-50 text-red-800 text-sm px-4 py-3 border border-red-100">{err}</div>
      )}

      {dataLoading ? (
        <p className="text-sm text-gray-500">Загрузка…</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">Записей нет</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((row) => {
            const p = row.payload || {};
            const act = row.action || "";
            return (
              <li
                key={row.id}
                className="rounded-[22px] border border-white/60 bg-white/75 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
              >
                <div className="flex flex-wrap items-center gap-2 justify-between">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`text-xs font-semibold px-2 py-0.5 rounded-lg uppercase tracking-wide ${
                        actionStyle[act] || "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {act === "create" ? "Создание" : act === "update" ? "Изменение" : act === "delete" ? "Удаление" : act}
                    </span>
                    <span className="text-sm font-medium text-gray-900">Бронь №{row.booking_id}</span>
                  </div>
                  <time className="text-xs text-gray-500 tabular-nums">{formatDateTimeRu(row.created_at)}</time>
                </div>
                <p className="text-sm text-gray-700 mt-2">
                  <span className="text-gray-500">Действие выполнил:</span>{" "}
                  <span className="font-medium">{p.actor_name || "—"}</span>
                  {p.actor_phone ? ` · ${formatTajikPhoneDisplay(p.actor_phone)}` : ""}
                </p>
                {act === "update" && <DiffLines diff={p.diff} />}
                {(act === "create" || act === "delete") && <SnapshotBlock snap={p.snapshot} />}
                {act === "update" && p.snapshot && (
                  <details className="mt-2">
                    <summary className="text-xs text-gray-500 cursor-pointer">Состояние после изменения</summary>
                    <SnapshotBlock snap={p.snapshot} />
                  </details>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </AppShell>
  );
}
