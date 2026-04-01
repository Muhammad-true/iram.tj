"use client";

import { useCallback, useEffect, useState } from "react";
import { api } from "../lib/api";
import { formatDateTimeRu, formatSom } from "../lib/format";
import { formatTajikPhoneDisplay } from "../lib/phone";

function paymentLabel(pm) {
  if (pm === "card") return "Карта";
  if (pm === "cash") return "Наличные";
  return pm || "—";
}

export default function GuestDetailModal({ guestId, onClose }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);

  const load = useCallback(async () => {
    if (!guestId) return;
    setErr(null);
    setLoading(true);
    try {
      const d = await api.get(`/guests/${guestId}`);
      setData(d);
    } catch (e) {
      setErr(e.message || "Не удалось загрузить");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [guestId]);

  useEffect(() => {
    load();
  }, [load]);

  if (!guestId) return null;

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] sm:p-4">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
      />
      <div className="relative w-full max-w-md sm:max-w-lg bg-white rounded-t-[20px] sm:rounded-2xl p-5 sm:p-6 shadow-[0_-8px_32px_rgba(0,0,0,0.14)] sm:shadow-2xl pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[90dvh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Клиент</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-500 text-xl w-10 h-10 rounded-full hover:bg-gray-100"
          >
            ✕
          </button>
        </div>

        {loading && <p className="text-sm text-gray-500 py-6">Загрузка…</p>}

        {err && (
          <div className="rounded-2xl bg-red-50 text-red-800 text-sm px-4 py-3 border border-red-100 mb-3">
            {err}
          </div>
        )}

        {!loading && !err && data && (
          <>
            <div className="mb-4 p-4 rounded-2xl bg-gray-100 space-y-2 text-sm">
              <p>
                <span className="text-gray-500">ID</span>{" "}
                <span className="font-mono font-medium">{data.id}</span>
              </p>
              <p>
                <span className="text-gray-500">ФИО</span>{" "}
                <span className="font-semibold text-gray-900">{data.full_name || "—"}</span>
              </p>
              <p>
                <span className="text-gray-500">Телефон</span>{" "}
                <span className="font-medium">{data.phone?.trim() ? formatTajikPhoneDisplay(data.phone) : "—"}</span>
              </p>
              {data.booking_id != null && (
                <p className="text-xs text-gray-600">
                  Привязка к брони в карточке гостя:{" "}
                  <span className="font-mono">#{data.booking_id}</span>
                </p>
              )}
              <p className="text-xs text-gray-500 pt-1 border-t border-gray-200/80">
                Всего броней в системе с этим гостём:{" "}
                <span className="font-medium text-gray-800">{data.bookings_count ?? 0}</span>
              </p>
            </div>

            <h3 className="text-sm font-semibold text-gray-800 mb-2">Брони</h3>
            {(!data.bookings || data.bookings.length === 0) ? (
              <p className="text-sm text-gray-500">Нет броней с этим гостём</p>
            ) : (
              <ul className="space-y-3">
                {data.bookings.map((b) => (
                  <li
                    key={b.id}
                    className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-sm space-y-1"
                  >
                    <p className="font-medium text-gray-900">
                      Бронь №{b.id} · номер {b.room_number}
                    </p>
                    <p className="text-gray-600">
                      {b.check_in} — {b.check_out} · {b.people_count} чел.
                    </p>
                    <p className="text-xs text-gray-600">
                      Предоплата {formatSom(b.prepayment)} · долг {formatSom(b.debt)} ·{" "}
                      {paymentLabel(b.payment_method)}
                      {Number(b.discount_percent) > 0 ? ` · скидка ${b.discount_percent}%` : ""}
                    </p>
                    {b.user_name && (
                      <p className="text-xs text-gray-500">Оформил: {b.user_name}</p>
                    )}
                    <p className="text-xs text-gray-400">
                      Создано: {formatDateTimeRu(b.created_at)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </>
        )}

        {!loading && err && (
          <button
            type="button"
            onClick={load}
            className="mt-2 w-full py-3 rounded-2xl bg-gray-100 text-sm font-medium"
          >
            Повторить
          </button>
        )}
      </div>
    </div>
  );
}
