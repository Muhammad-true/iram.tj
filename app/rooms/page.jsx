"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import AppShell from "../../components/AppShell";
import BookingEditModal from "../../components/BookingEditModal";
import GuestDetailModal from "../../components/GuestDetailModal";
import BookingModal from "../../components/BookingModal";
import RoomsList from "../../components/RoomsList";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { api } from "../../lib/api";
import { addDaysYmd, todayYmd } from "../../lib/dates";
import { minFreeBeds } from "../../lib/occupancy";
import { PRICE_PERIOD_DAYS } from "../../lib/pricing";

/** Окно дат на экране номеров (совпадает с периодом тарифа в каталоге). */
const DEFAULT_STAY_DAYS = PRICE_PERIOD_DAYS;

export default function RoomsPage() {
  const { user, loading } = useRequireAuth();
  const [rooms, setRooms] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [roomTypes, setRoomTypes] = useState([]);
  const [dataLoading, setDataLoading] = useState(false);
  const [err, setErr] = useState(null);
  const [selectedRoom, setSelectedRoom] = useState(null);
  const [editingBooking, setEditingBooking] = useState(null);
  const [guestDetailId, setGuestDetailId] = useState(null);
  const [onlyFree, setOnlyFree] = useState(false);
  /** Пустая строка — все типы; иначе code из room_types (например old_2p_1800, lux_1p_4000). */
  const [filterTypeCode, setFilterTypeCode] = useState("");
  const [viewFrom, setViewFrom] = useState(todayYmd);
  /** Последний день окна включительно: 10 календарных дней = заезд + (10 − 1) дней. */
  const [viewTo, setViewTo] = useState(() => addDaysYmd(todayYmd(), DEFAULT_STAY_DAYS - 1));

  const fetchData = useCallback(async () => {
    setErr(null);
    setDataLoading(true);
    try {
      const from = viewFrom;
      const to = viewTo;
      if (from > to) {
        setErr("Дата «по» не может быть раньше «с»");
        setBookings([]);
        setRooms([]);
        return;
      }
      const qs = `?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`;
      const [r, b, rt] = await Promise.all([
        api.get("/rooms"),
        api.get(`/bookings${qs}`),
        api.get("/room-types").catch(() => []),
      ]);
      setRooms(Array.isArray(r) ? r : []);
      setBookings(Array.isArray(b) ? b : []);
      setRoomTypes(Array.isArray(rt) ? rt : []);
    } catch (e) {
      setErr(e.message || "Ошибка загрузки");
      setRooms([]);
      setBookings([]);
    } finally {
      setDataLoading(false);
    }
  }, [viewFrom, viewTo]);

  useEffect(() => {
    if (!user) return;
    fetchData();
  }, [user, fetchData]);

  const bookingsByRoomId = useMemo(() => {
    const m = new Map();
    for (const bk of bookings) {
      if (bk?.room_id == null) continue;
      if (!m.has(bk.room_id)) m.set(bk.room_id, []);
      m.get(bk.room_id).push(bk);
    }
    for (const arr of m.values()) {
      arr.sort((a, b) => String(a.check_in).localeCompare(String(b.check_in)));
    }
    return m;
  }, [bookings]);

  const typeFilterOptions = useMemo(() => {
    if (roomTypes.length > 0) return roomTypes;
    const codes = [...new Set(rooms.map((r) => r.type).filter(Boolean))];
    return codes.map((code) => ({ code, title: String(code) }));
  }, [roomTypes, rooms]);

  const roomsInScope = useMemo(() => {
    if (!filterTypeCode) return rooms;
    const want = String(filterTypeCode).toLowerCase();
    return rooms.filter((r) => String(r.type || "").toLowerCase() === want);
  }, [rooms, filterTypeCode]);

  const { freeCount, totalRooms } = useMemo(() => {
    const total = roomsInScope.length;
    const from = viewFrom;
    const to = viewTo;
    if (from > to) return { freeCount: 0, totalRooms: total };
    let free = 0;
    for (const r of roomsInScope) {
      const bks = bookingsByRoomId.get(r.id) ?? [];
      if (minFreeBeds(r, bks, from, to) > 0) free += 1;
    }
    return { freeCount: free, totalRooms: total };
  }, [roomsInScope, bookingsByRoomId, viewFrom, viewTo]);

  const roomsForList = useMemo(() => {
    if (!onlyFree) return roomsInScope;
    const from = viewFrom;
    const to = viewTo;
    if (from > to) return [];
    return roomsInScope.filter((r) => {
      const bks = bookingsByRoomId.get(r.id) ?? [];
      return minFreeBeds(r, bks, from, to) > 0;
    });
  }, [roomsInScope, bookingsByRoomId, onlyFree, viewFrom, viewTo]);

  const setPeriodFromArrival = (arrivalYmd) => {
    setViewFrom(arrivalYmd);
    setViewTo(addDaysYmd(arrivalYmd, DEFAULT_STAY_DAYS - 1));
  };

  const handleBook = async (data) => {
    try {
      await api.post("/bookings", {
        room_id: selectedRoom.id,
        ...data,
      });
      await fetchData();
    } catch (e) {
      alert(e.message || "Ошибка бронирования");
      throw e;
    }
  };

  const handleDeleteBooking = async (bookingId) => {
    if (!confirm("Удалить бронирование?")) return;
    try {
      await api.delete(`/bookings/${bookingId}`);
      await fetchData();
    } catch (e) {
      alert(e.message || "Не удалось удалить");
    }
  };

  const handleUpdateRoom = async (room, nextType) => {
    try {
      await api.patch(`/rooms/${room.id}`, { type: nextType });
      await fetchData();
    } catch (e) {
      alert(e.message || "Не удалось обновить комнату");
    }
  };

  const handleSaveBookingEdit = async (patch) => {
    if (!editingBooking) return;
    try {
      await api.patch(`/bookings/${editingBooking.id}`, patch);
      await fetchData();
    } catch (e) {
      alert(e.message || "Не удалось сохранить бронь");
      throw e;
    }
  };

  if (loading || !user) {
    return (
      <main className="min-h-dvh bg-[#f2f2f7] flex items-center justify-center p-4">
        <p className="text-sm text-gray-500">Загрузка…</p>
      </main>
    );
  }

  const showEditor = user.role === "superadmin";
  const title = showEditor ? "Номера и цены" : "Номера";

  return (
    <AppShell title={title} user={user}>
      <div className="mb-4 rounded-[22px] bg-white/80 border border-white/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <p className="text-sm text-gray-800 font-medium">Подбор номера по датам</p>
        <p className="text-xs text-gray-500 mt-1 mb-3">
          Период «с»–«по»: обе даты включительно (как у брони: 30.03–08.04 = 10 суток, 9 ночей). Видны брони, которые с
          ним пересекаются. Свободные места — по койко-местам. По умолчанию{" "}
          <span className="font-medium text-gray-700">{DEFAULT_STAY_DAYS} календарных дней</span> от «с».
        </p>
        <div className="flex flex-wrap gap-2 items-center mb-3">
          <label className="text-sm text-gray-600">
            заезд (с){" "}
            <input
              type="date"
              value={viewFrom}
              onChange={(e) => {
                const v = e.target.value;
                setViewFrom(v);
                setViewTo(addDaysYmd(v, DEFAULT_STAY_DAYS - 1));
              }}
              className="ml-1 p-2 rounded-xl bg-gray-100 text-sm"
            />
          </label>
          <label className="text-sm text-gray-600">
            выезд (по){" "}
            <input
              type="date"
              value={viewTo}
              onChange={(e) => setViewTo(e.target.value)}
              className="ml-1 p-2 rounded-xl bg-gray-100 text-sm"
            />
          </label>
          <button
            type="button"
            onClick={() => fetchData()}
            className="px-3 py-2 rounded-xl bg-gray-100 text-sm font-medium"
          >
            Обновить
          </button>
        </div>
        <div className="flex flex-wrap gap-2 items-center mb-2">
          <span className="text-xs text-gray-500">Быстро:</span>
          <button
            type="button"
            onClick={() => setPeriodFromArrival(todayYmd())}
            className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-medium"
          >
            с сегодня, {DEFAULT_STAY_DAYS} дн.
          </button>
          <button
            type="button"
            onClick={() => setPeriodFromArrival(addDaysYmd(todayYmd(), 1))}
            className="px-3 py-1.5 rounded-xl bg-gray-100 text-xs font-medium"
          >
            с завтра, {DEFAULT_STAY_DAYS} дн.
          </button>
        </div>
        {!dataLoading && !err && totalRooms > 0 && (
          <p className="text-sm text-gray-800">
            <span className="font-semibold text-emerald-700">{freeCount}</span> свободно из{" "}
            <span className="font-medium">{totalRooms}</span>{" "}
            {filterTypeCode
              ? `номеров в типе «${typeFilterOptions.find((x) => x.code === filterTypeCode)?.title || filterTypeCode}»`
              : "номеров"}{" "}
            на выбранные даты
          </p>
        )}
        {!dataLoading && !err && filterTypeCode && totalRooms === 0 && (
          <p className="text-sm text-amber-800 mt-1">В выбранном типе нет номеров.</p>
        )}
        <div className="mt-3 flex flex-wrap gap-3 items-end">
          <label className="text-sm text-gray-600 flex flex-col gap-1 min-w-[12rem]">
            <span className="text-xs text-gray-500">Тип номера</span>
            <select
              value={filterTypeCode}
              onChange={(e) => setFilterTypeCode(e.target.value)}
              className="p-2 rounded-xl bg-gray-100 text-sm outline-none border border-transparent focus:border-gray-300"
            >
              <option value="">Все типы</option>
              {typeFilterOptions.map((rt) => (
                <option key={rt.code} value={rt.code}>
                  {rt.title || rt.code}
                </option>
              ))}
            </select>
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer select-none pb-2">
            <input
              type="checkbox"
              className="rounded border-gray-300"
              checked={onlyFree}
              onChange={(e) => setOnlyFree(e.target.checked)}
            />
            Только свободные
          </label>
        </div>
      </div>

      <RoomsList
        rooms={roomsForList}
        bookingsByRoomId={bookingsByRoomId}
        viewFrom={viewFrom}
        viewTo={viewTo}
        loading={dataLoading}
        err={err}
        showRoomEditor={showEditor}
        roomTypeOptions={roomTypes}
        groupByType={!filterTypeCode}
        onBook={(room) => {
          setEditingBooking(null);
          setSelectedRoom(room);
        }}
        onEditBooking={(bk) => {
          setSelectedRoom(null);
          setEditingBooking(bk);
        }}
        onDeleteBooking={handleDeleteBooking}
        onSaveRoom={showEditor ? handleUpdateRoom : () => {}}
      />

      {selectedRoom && (
        <BookingModal
          room={selectedRoom}
          roomBookings={bookingsByRoomId.get(selectedRoom.id) ?? []}
          defaultCheckIn={viewFrom}
          defaultCheckOut={viewTo >= viewFrom ? viewTo : addDaysYmd(viewFrom, DEFAULT_STAY_DAYS - 1)}
          onClose={() => setSelectedRoom(null)}
          onSubmit={handleBook}
        />
      )}

      {guestDetailId != null && (
        <GuestDetailModal guestId={guestDetailId} onClose={() => setGuestDetailId(null)} />
      )}

      {editingBooking && (
        <BookingEditModal
          booking={editingBooking}
          room={rooms.find((r) => r.id === editingBooking.room_id)}
          roomBookings={bookingsByRoomId.get(editingBooking.room_id) ?? []}
          onClose={() => setEditingBooking(null)}
          onSubmit={handleSaveBookingEdit}
          onOpenGuestProfile={(id) => {
            setEditingBooking(null);
            setGuestDetailId(id);
          }}
          onDelete={async () => {
            await api.delete(`/bookings/${editingBooking.id}`);
            await fetchData();
            setEditingBooking(null);
          }}
        />
      )}
    </AppShell>
  );
}
