"use client";

import { useMemo } from "react";
import {
  TYPE_STYLES,
  normalizeType,
  getPriceTierStyle,
  PRICE_TIER_ORDER,
  PRICE_TIER_STYLES,
} from "../lib/roomUi";
import { formatSom } from "../lib/format";
import { minFreeBeds, maxOccupiedPeopleInRange } from "../lib/occupancy";
import { PRICE_PERIOD_DAYS } from "../lib/pricing";

function MiniMeter({ free, cap }) {
  const c = Math.max(1, cap);
  const n = Math.min(8, c);
  const filled = Math.round((Math.min(Math.max(free, 0), c) / c) * n);
  return (
    <div className="flex gap-px h-1.5 w-full rounded-full overflow-hidden bg-black/10" title={`${free} из ${cap} мест свободно`}>
      {Array.from({ length: n }).map((_, i) => (
        <span
          key={i}
          className={`flex-1 rounded-[1px] ${i < filled ? "bg-emerald-500" : "bg-red-400/90"}`}
        />
      ))}
    </div>
  );
}

function RoomCard({
  room,
  typeSelectList,
  bookingsByRoomId,
  viewFrom,
  viewTo,
  showRoomEditor,
  onBook,
  onEditBooking,
  onDeleteBooking,
  onSaveRoom,
}) {
  const t = normalizeType(room.type ?? room.room_type);
  const tierStyle = getPriceTierStyle(room.price);
  const style = tierStyle || TYPE_STYLES[t] || TYPE_STYLES.default;
  const typeTitle =
    typeSelectList.find((x) => x.code === room.type)?.title || (room.type ? String(room.type) : "—");
  const bks = bookingsByRoomId.get(room.id) ?? [];
  const from = viewFrom;
  const to = viewTo;
  const rangeOk = from <= to;
  const cap = Number(room.capacity) || 0;
  const freeBeds = rangeOk ? minFreeBeds(room, bks, from, to) : 0;
  const maxOcc = rangeOk ? maxOccupiedPeopleInRange(bks, from, to) : 0;
  const full = rangeOk && freeBeds <= 0;
  const hasBookings = bks.length > 0;

  return (
    <li className={`relative flex flex-col rounded-lg overflow-hidden ${style.card}`}>
      <div className="px-2 pt-2 pb-1.5 flex flex-col flex-1 min-h-0">
        <span className="text-lg sm:text-xl font-bold leading-none tracking-tight text-gray-900">
          №{room.number}
        </span>

        {rangeOk ? (
          <>
            <p
              className={`mt-1.5 text-xl font-black tabular-nums leading-none ${
                full ? "text-red-600" : "text-emerald-600"
              }`}
            >
              {full ? "0" : freeBeds}
              <span className="text-xs font-bold text-gray-400 ml-0.5">своб.</span>
            </p>
            <p className="text-[10px] text-gray-500 tabular-nums mt-0.5">
              {maxOcc}/{cap} занято
            </p>
            <div className="mt-1.5">
              <MiniMeter free={freeBeds} cap={cap} />
            </div>
          </>
        ) : (
          <p className="text-[10px] text-gray-400 mt-1">Укажите даты</p>
        )}

        <p className={`text-[10px] mt-1.5 tabular-nums ${tierStyle?.priceClass ?? "text-gray-600"}`}>
          {formatSom(room.price)} / {PRICE_PERIOD_DAYS} сут. / чел.
        </p>

        {!full && rangeOk ? (
          <button
            type="button"
            onClick={() => onBook(room)}
            className="mt-2 w-full py-1.5 rounded-md bg-gray-900 text-white text-[11px] font-semibold active:opacity-90"
          >
            + бронь
          </button>
        ) : rangeOk ? (
          <p className="mt-2 text-center text-[10px] text-red-600/90 font-medium">полно</p>
        ) : null}
      </div>

      {(hasBookings || showRoomEditor) && (
        <div className="border-t border-black/[0.06] bg-black/[0.02]">
          {hasBookings && (
            <details className="group">
              <summary className="cursor-pointer list-none px-2 py-1 text-[10px] text-gray-600 hover:bg-black/[0.04] flex items-center justify-between gap-1">
                <span>
                  Брони <span className="font-semibold text-gray-800">({bks.length})</span>
                </span>
                <span className="text-gray-400 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-2 pb-2 space-y-1.5 max-h-40 overflow-y-auto">
                {bks.map((bk) => (
                  <div key={bk.id} className="rounded-md bg-white/80 border border-white/60 p-1.5 text-[10px] leading-snug">
                    <p className="font-medium text-gray-900 truncate">{bk.guest_name || "Гость"}</p>
                    <p className="text-gray-500">
                      {bk.check_in}→{bk.check_out} · {bk.people_count} чел.
                    </p>
                    <div className="flex gap-1 mt-1">
                      <button
                        type="button"
                        onClick={() => onEditBooking?.(bk)}
                        className="flex-1 py-0.5 rounded bg-gray-200/80 text-gray-900 font-medium"
                      >
                        Изм.
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteBooking(bk.id)}
                        className="flex-1 py-0.5 rounded bg-red-100 text-red-800 font-medium"
                      >
                        Удл.
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </details>
          )}
          {showRoomEditor && (
            <details className="group border-t border-black/[0.04]">
              <summary className="cursor-pointer list-none px-2 py-1 text-[10px] text-gray-600 hover:bg-black/[0.04] flex items-center justify-between gap-1">
                <span className="truncate min-w-0 text-left font-medium text-gray-800" title={typeTitle}>
                  {typeTitle}
                </span>
                <span className="text-gray-400 shrink-0 group-open:rotate-180 transition-transform">▼</span>
              </summary>
              <div className="px-2 pb-2 flex flex-col gap-1">
                <select
                  defaultValue={String(room.type || typeSelectList[0]?.code || "")}
                  id={`type-${room.id}`}
                  className="w-full p-1 rounded-md bg-white border border-gray-200 text-[10px] outline-none"
                >
                  {typeSelectList.map((opt) => (
                    <option key={opt.code} value={opt.code}>
                      {opt.title || opt.code}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={() => {
                    const nextType = document.getElementById(`type-${room.id}`)?.value;
                    onSaveRoom(room, nextType);
                  }}
                  className="w-full py-1 rounded-md bg-gray-800 text-white text-[10px] font-medium"
                >
                  Сохранить
                </button>
              </div>
            </details>
          )}
        </div>
      )}
    </li>
  );
}

const GRID =
  "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-8 gap-2 sm:gap-3 md:gap-4";

function groupRoomsByType(rooms, typeSelectList) {
  const map = new Map();
  for (const r of rooms) {
    const raw = String(r.type || "").trim();
    const key = raw || "__none__";
    if (!map.has(key)) map.set(key, []);
    map.get(key).push(r);
  }
  const orderIdx = new Map(
    typeSelectList.map((t, i) => [String(t.code || "").toLowerCase(), i])
  );
  const keys = [...map.keys()].sort((a, b) => {
    if (a === "__none__") return 1;
    if (b === "__none__") return -1;
    const la = a.toLowerCase();
    const lb = b.toLowerCase();
    const ia = orderIdx.has(la) ? orderIdx.get(la) : 1000;
    const ib = orderIdx.has(lb) ? orderIdx.get(lb) : 1000;
    if (ia !== ib) return ia - ib;
    return a.localeCompare(b, "ru");
  });
  return keys.map((codeKey) => {
    const list = map.get(codeKey);
    list.sort((a, b) => String(a.number).localeCompare(String(b.number), "ru", { numeric: true }));
    const title =
      codeKey === "__none__"
        ? "Без типа"
        : typeSelectList.find((x) => String(x.code).toLowerCase() === codeKey.toLowerCase())?.title || codeKey;
    return { codeKey, title, rooms: list };
  });
}

export default function RoomsList({
  rooms,
  bookingsByRoomId,
  viewFrom,
  viewTo,
  loading,
  err,
  showRoomEditor,
  roomTypeOptions = [],
  groupByType = false,
  onBook,
  onEditBooking,
  onDeleteBooking,
  onSaveRoom,
}) {
  const typeSelectList = roomTypeOptions.length > 0 ? roomTypeOptions : [];
  const sections = useMemo(
    () => (groupByType && rooms.length > 0 ? groupRoomsByType(rooms, typeSelectList) : null),
    [groupByType, rooms, typeSelectList]
  );

  if (loading) {
    return <p className="text-gray-500 text-sm">Загрузка…</p>;
  }

  if (!err && rooms.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-6 text-center rounded-xl bg-white/60 border border-white/50">
        Нет номеров по текущему фильтру
      </p>
    );
  }

  const cardProps = {
    typeSelectList,
    bookingsByRoomId,
    viewFrom,
    viewTo,
    showRoomEditor,
    onBook,
    onEditBooking,
    onDeleteBooking,
    onSaveRoom,
  };

  return (
    <>
      {err && (
        <div className="mb-3 rounded-xl bg-red-50 text-red-800 text-sm px-3 py-2 border border-red-100">
          {err}
        </div>
      )}

      <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-2 text-[11px] sm:text-xs md:text-sm text-gray-600 md:gap-x-4">
        <span className="font-semibold text-gray-800 w-full sm:w-auto">Цвет по цене (сом/сут.):</span>
        {PRICE_TIER_ORDER.map((key) => {
          const s = PRICE_TIER_STYLES[key];
          return (
            <span key={key} className="inline-flex items-center gap-1.5" title={s.legendHint}>
              <span className={`w-3 h-3 rounded-full shrink-0 ring-1 ring-white/90 ${s.typeDot}`} />
              <span className="whitespace-nowrap">
                {s.legendShort}{" "}
                <span className="text-gray-400 font-normal">({s.legendHint})</span>
              </span>
            </span>
          );
        })}
      </div>

      {sections ? (
        <div className="space-y-8">
          {sections.map(({ codeKey, title, rooms: blockRooms }) => (
            <section key={codeKey} className="space-y-3">
              <div className="flex flex-wrap items-end gap-x-3 gap-y-1 border-b border-gray-200/80 pb-2">
                <h2 className="text-sm font-semibold text-gray-900 tracking-tight">{title}</h2>
                <span className="text-xs text-gray-500 tabular-nums">{blockRooms.length} ном.</span>
              </div>
              <ul className={GRID}>
                {blockRooms.map((room) => (
                  <RoomCard key={room.id} room={room} {...cardProps} />
                ))}
              </ul>
            </section>
          ))}
        </div>
      ) : (
        <ul className={GRID}>
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} {...cardProps} />
          ))}
        </ul>
      )}
    </>
  );
}
