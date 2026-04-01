"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import AppShell from "../../components/AppShell";
import BookingEditModal from "../../components/BookingEditModal";
import GuestDetailModal from "../../components/GuestDetailModal";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { api } from "../../lib/api";
import { addDaysYmd, todayYmd } from "../../lib/dates";
import { formatDateTimeRu, formatSom } from "../../lib/format";
import { formatTajikPhoneDisplay } from "../../lib/phone";
import {
  countNightsStay,
  PRICE_PERIOD_DAYS,
  stayNightsFromInclusiveStayDays,
  tariffTotalForBookingDates,
} from "../../lib/pricing";

export default function BookingsPage() {
  const { user, loading } = useRequireAuth();
  const [from, setFrom] = useState(() => todayYmd());
  const [to, setTo] = useState(() => addDaysYmd(todayYmd(), 59));
  const [allRows, setAllRows] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [editing, setEditing] = useState(null);
  const [guestDetailId, setGuestDetailId] = useState(null);
  const [filterTypeId, setFilterTypeId] = useState("");
  const [filterRoomId, setFilterRoomId] = useState("");

  const load = useCallback(async () => {
    setErr(null);
    setDataLoading(true);
    try {
      if (from > to) {
        setErr("Дата «по» не может быть раньше «с» (обе границы включительно)");
        setAllRows([]);
        return;
      }
      const qs = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const [b, r, rt] = await Promise.all([
        api.get(`/bookings${qs}`),
        api.get("/rooms"),
        api.get("/room-types").catch(() => []),
      ]);
      const list = Array.isArray(b) ? b : [];
      list.sort((a, x) => String(a.check_in).localeCompare(String(x.check_in)));
      setAllRows(list);
      setRooms(Array.isArray(r) ? r : []);
      setRoomTypes(Array.isArray(rt) ? rt : []);
    } catch (e) {
      setErr(e.message || "Ошибка загрузки");
      setAllRows([]);
    } finally {
      setDataLoading(false);
    }
  }, [from, to]);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, load]);

  const rows = useMemo(() => {
    let list = allRows;
    if (filterTypeId) {
      const tid = Number(filterTypeId);
      list = list.filter((b) => Number(b.room_type_id) === tid);
    }
    if (filterRoomId) {
      const rid = Number(filterRoomId);
      list = list.filter((b) => Number(b.room_id) === rid);
    }
    return list;
  }, [allRows, filterTypeId, filterRoomId]);

  const roomsForSelect = useMemo(() => {
    if (!filterTypeId) return rooms;
    const tid = Number(filterTypeId);
    return rooms.filter((r) => Number(r.type_id) === tid);
  }, [rooms, filterTypeId]);

  useEffect(() => {
    if (!filterRoomId || !filterTypeId) return;
    const r = rooms.find((x) => String(x.id) === filterRoomId);
    if (r && Number(r.type_id) !== Number(filterTypeId)) {
      setFilterRoomId("");
    }
  }, [filterTypeId, filterRoomId, rooms]);

  const saveEdit = async (patch) => {
    if (!editing) return;
    try {
      await api.patch(`/bookings/${editing.id}`, patch);
      await load();
    } catch (e) {
      alert(e.message || "Не удалось сохранить");
      throw e;
    }
  };

  const removeBooking = async (id) => {
    await api.delete(`/bookings/${id}`);
    await load();
  };

  const confirmDeleteFromList = async (b) => {
    const label = `${b.guest_name || "гость"}, ${b.check_in} — ${b.check_out}`;
    if (
      !window.confirm(
        `Удалить бронь №${b.id} (${label})?\nЭто действие нельзя отменить.`
      )
    ) {
      return;
    }
    try {
      await removeBooking(b.id);
    } catch (e) {
      alert(e.message || "Не удалось удалить бронь");
    }
  };

  const editingRoom = editing ? rooms.find((x) => x.id === editing.room_id) : undefined;
  const roomBookingsForEdit = useMemo(() => {
    if (!editing) return [];
    return allRows.filter((b) => b.room_id === editing.room_id);
  }, [editing, allRows]);

  if (loading || !user) {
    return (
      <main className="min-h-dvh bg-[#f2f2f7] flex items-center justify-center p-4">
        <p className="text-sm text-gray-500">Загрузка…</p>
      </main>
    );
  }

  return (
    <AppShell title="Брони" user={user}>
      <div className="mb-4 rounded-[22px] bg-white/80 border border-white/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-gray-800 font-medium mb-2">Период</p>
        <p className="text-xs text-gray-500 mb-2">«С» и «по» включительно — как у брони и поиска номеров.</p>
        <div className="flex flex-wrap gap-2 items-center">
          <input
            type="date"
            value={from}
            onChange={(e) => setFrom(e.target.value)}
            className="p-2 rounded-xl bg-gray-100 text-sm"
          />
          <span className="text-gray-400">—</span>
          <input
            type="date"
            value={to}
            onChange={(e) => setTo(e.target.value)}
            className="p-2 rounded-xl bg-gray-100 text-sm"
          />
          <button
            type="button"
            onClick={() => load()}
            className="px-3 py-2 rounded-xl bg-gray-100 text-sm font-medium"
          >
            Обновить
          </button>
        </div>
        <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end sm:gap-3">
          <p className="text-sm text-gray-800 font-medium w-full sm:w-auto sm:mr-2">Фильтры</p>
          <label className="flex flex-col gap-1 text-xs text-gray-600 min-w-[10rem]">
            Тип номера
            <select
              value={filterTypeId}
              onChange={(e) => {
                setFilterTypeId(e.target.value);
                setFilterRoomId("");
              }}
              className="p-2 rounded-xl bg-gray-100 text-sm text-gray-900 border border-gray-200/80"
            >
              <option value="">Все типы</option>
              {roomTypes.map((t) => (
                <option key={t.id} value={String(t.id)}>
                  {t.title || t.code}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-xs text-gray-600 min-w-[10rem]">
            Номер
            <select
              value={filterRoomId}
              onChange={(e) => setFilterRoomId(e.target.value)}
              className="p-2 rounded-xl bg-gray-100 text-sm text-gray-900 border border-gray-200/80"
            >
              <option value="">Все номера</option>
              {roomsForSelect.map((r) => (
                <option key={r.id} value={String(r.id)}>
                  №{r.number}
                </option>
              ))}
            </select>
          </label>
        </div>
        <Link href="/rooms" className="inline-block mt-3 text-sm text-gray-700 underline underline-offset-2">
          К номерам и подбору дат
        </Link>
      </div>

      {err && (
        <div className="mb-4 rounded-2xl bg-red-50 text-red-800 text-sm px-4 py-3 border border-red-100">{err}</div>
      )}

      {dataLoading ? (
        <p className="text-sm text-gray-500">Загрузка…</p>
      ) : allRows.length === 0 ? (
        <p className="text-sm text-gray-500">Нет броней в выбранном окне</p>
      ) : rows.length === 0 ? (
        <p className="text-sm text-gray-500">Нет броней по выбранным фильтрам</p>
      ) : (
        <ul className="space-y-3">
          {rows.map((b) => {
            const typeLabel =
              b.room_type_title != null && String(b.room_type_title).trim() !== ""
                ? String(b.room_type_title)
                : b.room_type_code
                  ? String(b.room_type_code)
                  : null;
            return (
            <li
              key={b.id}
              className="rounded-[22px] border border-white/60 bg-white/75 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    №{b.room_number}
                    {typeLabel ? ` · ${typeLabel}` : ""} · {b.guest_name || "Гость"}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    {b.check_in} — {b.check_out} · {b.people_count} чел.
                  </p>
                  {(b.guest_phone || b.guest_id) && (
                    <p className="text-xs text-gray-500 mt-1">
                      {b.guest_phone ? `Тел.: ${formatTajikPhoneDisplay(b.guest_phone)}` : null}
                      {b.guest_phone && b.guest_id ? " · " : null}
                      {b.guest_id ? `ID гостя: ${b.guest_id}` : null}
                    </p>
                  )}
                  {Number(b.guest_id) > 0 && (
                    <button
                      type="button"
                      onClick={() => setGuestDetailId(Number(b.guest_id))}
                      className="mt-2 text-sm font-medium text-gray-800 underline underline-offset-2"
                    >
                      Полная информация о клиенте
                    </button>
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Предоплата {formatSom(b.prepayment)} · долг {formatSom(b.debt)}
                    {Number(b.discount_percent) > 0 ? ` · скидка ${b.discount_percent}%` : ""}
                  </p>
                  {(() => {
                    const room = rooms.find((r) => r.id === b.room_id);
                    const stayDays = countNightsStay(b.check_in, b.check_out);
                    if (!room || stayDays < 1) return null;
                    const stayNights = stayNightsFromInclusiveStayDays(stayDays);
                    const tariff = tariffTotalForBookingDates(
                      room.price,
                      b.check_in,
                      b.check_out,
                      b.people_count,
                      b.discount_percent
                    );
                    const accounted =
                      Math.trunc(Number(b.prepayment) || 0) + Math.trunc(Number(b.debt) || 0);
                    const diff = accounted !== tariff;
                    return (
                      <p className="text-xs text-gray-600 mt-1">
                        По тарифу сейчас: <span className="font-medium">{formatSom(tariff)}</span>{" "}
                        <span className="text-gray-400">
                          ({stayDays} сут., {stayNights} ноч. · каталог {formatSom(room.price)} за {PRICE_PERIOD_DAYS}{" "}
                          сут.
                          {Number(b.discount_percent) > 0 ? ` · скидка ${b.discount_percent}%` : ""})
                        </span>
                        {diff && (
                          <span className="block text-amber-700 mt-0.5">
                            Предоплата+долг ≠ сумме по тарифу — возможно меняли тариф или суммы вручную.
                          </span>
                        )}
                      </p>
                    );
                  })()}
                  {b.user_name && <p className="text-xs text-gray-500 mt-1">Оформил: {b.user_name}</p>}
                  <p className="text-xs text-gray-400 mt-1">Создано: {formatDateTimeRu(b.created_at)}</p>
                </div>
                <div className="shrink-0 flex flex-col gap-2 items-stretch sm:items-end">
                  <button
                    type="button"
                    onClick={() => setEditing(b)}
                    className="px-3 py-2 rounded-xl bg-gray-100 text-sm font-medium"
                  >
                    Изменить
                  </button>
                  <button
                    type="button"
                    onClick={() => confirmDeleteFromList(b)}
                    className="px-3 py-2 rounded-xl border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </li>
            );
          })}
        </ul>
      )}

      {guestDetailId != null && (
        <GuestDetailModal guestId={guestDetailId} onClose={() => setGuestDetailId(null)} />
      )}

      {editing && (
        <BookingEditModal
          booking={editing}
          room={editingRoom}
          roomBookings={roomBookingsForEdit}
          onClose={() => setEditing(null)}
          onSubmit={saveEdit}
          onOpenGuestProfile={(id) => {
            setEditing(null);
            setGuestDetailId(id);
          }}
          onDelete={async () => {
            await removeBooking(editing.id);
            setEditing(null);
          }}
        />
      )}
    </AppShell>
  );
}
