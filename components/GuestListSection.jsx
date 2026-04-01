"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import GuestDetailModal from "./GuestDetailModal";
import { api } from "../lib/api";
import { formatTajikPhoneDisplay } from "../lib/phone";

export default function GuestListSection() {
  const [guests, setGuests] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [detailId, setDetailId] = useState(null);
  const [filterTypeId, setFilterTypeId] = useState("");
  const [filterRoomId, setFilterRoomId] = useState("");

  const fetchMeta = useCallback(async () => {
    try {
      const [r, rt] = await Promise.all([
        api.get("/rooms"),
        api.get("/room-types").catch(() => []),
      ]);
      setRooms(Array.isArray(r) ? r : []);
      setRoomTypes(Array.isArray(rt) ? rt : []);
    } catch {
      setRooms([]);
      setRoomTypes([]);
    }
  }, []);

  const fetchGuests = useCallback(async () => {
    setErr(null);
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterTypeId) params.set("type_id", filterTypeId);
      if (filterRoomId) params.set("room_id", filterRoomId);
      const qs = params.toString();
      const g = await api.get(`/guests${qs ? `?${qs}` : ""}`);
      setGuests(Array.isArray(g) ? g : []);
    } catch (e) {
      setErr(e.message || "Ошибка загрузки");
      setGuests([]);
    } finally {
      setLoading(false);
    }
  }, [filterTypeId, filterRoomId]);

  useEffect(() => {
    fetchMeta();
  }, [fetchMeta]);

  useEffect(() => {
    fetchGuests();
  }, [fetchGuests]);

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

  if (loading && guests.length === 0 && !err) {
    return (
      <section className="rounded-[22px] bg-white/80 border border-white/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-gray-500">Загрузка клиентов…</p>
      </section>
    );
  }

  if (err && guests.length === 0) {
    return (
      <section className="rounded-[22px] bg-white/80 border border-white/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-red-600">{err}</p>
        <button
          type="button"
          onClick={fetchGuests}
          className="mt-3 px-4 py-2 rounded-xl bg-gray-100 text-sm font-medium"
        >
          Повторить
        </button>
      </section>
    );
  }

  return (
    <section className="rounded-[22px] bg-white/80 border border-white/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <h2 className="font-semibold text-lg">Клиенты</h2>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <label className="flex flex-col gap-1 text-xs text-gray-600 min-w-[10rem]">
            Тип номера
            <select
              value={filterTypeId}
              onChange={(e) => {
                setFilterTypeId(e.target.value);
                setFilterRoomId("");
              }}
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
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
              className="rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm text-gray-900"
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
      </div>

      {loading ? (
        <p className="mt-3 text-sm text-gray-500">Обновление списка…</p>
      ) : null}
      {err && guests.length > 0 ? (
        <p className="mt-2 text-sm text-amber-700">{err} (показан предыдущий список)</p>
      ) : null}

      <ul className="mt-3 space-y-2">
        {guests.length === 0 ? (
          <li className="text-sm text-gray-500">Нет записей по выбранным фильтрам</li>
        ) : (
          guests.map((g) => {
            const roomLabel =
              g.room_number != null && String(g.room_number).trim() !== ""
                ? `№${g.room_number}`
                : null;
            const typeLabel =
              g.room_type_title != null && String(g.room_type_title).trim() !== ""
                ? String(g.room_type_title)
                : g.room_type_code
                  ? String(g.room_type_code)
                  : null;

            return (
              <li
                key={g.id}
                className="p-3 rounded-xl bg-gray-50 text-sm flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between"
              >
                <div>
                  <p className="font-medium">{g.full_name}</p>
                  <p className="text-gray-600">{g.phone ? formatTajikPhoneDisplay(g.phone) : "—"}</p>
                  <p className="text-gray-700 text-sm mt-1">
                    {roomLabel ? (
                      <span>
                        Комната {roomLabel}
                        {typeLabel ? ` · ${typeLabel}` : ""}
                      </span>
                    ) : (
                      <span className="text-gray-500">Комната не указана (нет брони в карточке)</span>
                    )}
                  </p>
                  <p className="text-gray-500 text-xs mt-0.5">
                    {g.booking_id != null ? `Бронь в карточке #${g.booking_id}` : "Без привязки к брони"}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setDetailId(g.id)}
                  className="shrink-0 px-3 py-2 rounded-xl bg-white border border-gray-200 text-sm font-medium text-gray-800 hover:bg-gray-50"
                >
                  Полная информация
                </button>
              </li>
            );
          })
        )}
      </ul>

      {detailId != null && (
        <GuestDetailModal guestId={detailId} onClose={() => setDetailId(null)} />
      )}
    </section>
  );
}
