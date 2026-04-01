"use client";

import { useEffect, useMemo, useState } from "react";
import { formatDateTimeRu, formatSom } from "../lib/format";
import { minFreeBedsExcluding } from "../lib/occupancy";
import { formatTajikPhoneDisplay, formatTajikPhoneForApi, TAJIKISTAN_PHONE_PREFIX } from "../lib/phone";
import {
  DISCOUNT_PERCENT_OPTIONS,
  PRICE_PERIOD_DAYS,
  countNightsStay,
  normalizeDiscountPercent,
  stayNightsFromInclusiveStayDays,
  totalAfterDiscountPercent,
  totalStayPriceFromCatalog,
} from "../lib/pricing";

export default function BookingEditModal({
  booking,
  room,
  roomBookings = [],
  onClose,
  onSubmit,
  onDelete,
  onOpenGuestProfile,
}) {
  const [guestName, setGuestName] = useState("");
  const [guestPhone, setGuestPhone] = useState(TAJIKISTAN_PHONE_PREFIX);
  const [people, setPeople] = useState(1);
  const [prepayment, setPrepayment] = useState(0);
  const [checkIn, setCheckIn] = useState("");
  const [checkOut, setCheckOut] = useState("");
  const [discountPercent, setDiscountPercent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!booking) return;
    setGuestName(String(booking.guest_name || "").trim());
    setGuestPhone(formatTajikPhoneDisplay(booking.guest_phone));
    setPeople(Number(booking.people_count) || 1);
    setPrepayment(Number(booking.prepayment) || 0);
    setCheckIn(String(booking.check_in || "").slice(0, 10));
    setCheckOut(String(booking.check_out || "").slice(0, 10));
    setDiscountPercent(normalizeDiscountPercent(booking.discount_percent));
    setSubmitting(false);
  }, [booking]);

  const maxPeopleAllowed = useMemo(() => {
    if (!room || !booking) return 99;
    if (!checkIn || !checkOut || checkIn > checkOut) return Number(room.capacity) || 99;
    const free = minFreeBedsExcluding(room, roomBookings, checkIn, checkOut, booking.id);
    return Math.min(Number(room.capacity) || 0, free);
  }, [room, roomBookings, checkIn, checkOut, booking]);

  useEffect(() => {
    setPeople((p) => {
      const cap = maxPeopleAllowed;
      if (cap < 1) return 1;
      return Math.min(Math.max(1, p), cap);
    });
  }, [maxPeopleAllowed]);

  const stayDays = useMemo(() => countNightsStay(checkIn, checkOut), [checkIn, checkOut]);
  const stayNights = useMemo(() => stayNightsFromInclusiveStayDays(stayDays), [stayDays]);

  const grossTotal = useMemo(
    () => totalStayPriceFromCatalog(room?.price, stayDays, people),
    [room?.price, stayDays, people]
  );

  const totalForPeriod = useMemo(
    () => totalAfterDiscountPercent(grossTotal, discountPercent),
    [grossTotal, discountPercent]
  );

  const prepaymentAmount = useMemo(() => Math.max(0, Math.trunc(Number(prepayment) || 0)), [prepayment]);

  const debtAmount = useMemo(() => {
    if (stayDays < 1) return 0;
    return Math.max(0, totalForPeriod - prepaymentAmount);
  }, [stayDays, totalForPeriod, prepaymentAmount]);

  const handleDelete = async () => {
    if (submitting || !onDelete) return;
    if (
      !window.confirm(
        `Удалить бронь №${booking.id}?\nДанные нельзя восстановить.`
      )
    ) {
      return;
    }
    setSubmitting(true);
    try {
      await onDelete();
    } catch (e) {
      alert(e.message || "Не удалось удалить бронь");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSave = async () => {
    if (submitting) return;
    if (!guestName.trim()) return alert("Введите имя гостя");
    if (!checkIn || !checkOut) return alert("Укажите даты");
    if (checkIn > checkOut) return alert("Выезд не может быть раньше заезда");
    if (maxPeopleAllowed < 1 || people > maxPeopleAllowed) {
      return alert("Недостаточно свободных мест на эти даты");
    }
    setSubmitting(true);
    try {
      await onSubmit({
        guest_name: guestName.trim(),
        guest_phone: formatTajikPhoneForApi(guestPhone),
        people_count: people,
        prepayment: prepaymentAmount,
        debt: debtAmount,
        discount_percent: normalizeDiscountPercent(discountPercent),
        check_in: checkIn,
        check_out: checkOut,
      });
      alert("Бронь сохранена.");
      onClose();
    } catch {
      /* родитель показывает alert */
    } finally {
      setSubmitting(false);
    }
  };

  if (!booking) return null;

  return (
    <div className="fixed inset-0 bg-black/45 backdrop-blur-sm flex items-end sm:items-center justify-center z-[60] sm:p-4">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 cursor-default"
        onClick={() => !submitting && onClose()}
      />
      <div className="relative w-full max-w-md sm:max-w-lg bg-white rounded-t-[20px] sm:rounded-2xl p-5 sm:p-6 shadow-[0_-8px_32px_rgba(0,0,0,0.14)] sm:shadow-2xl pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[90dvh] overflow-y-auto">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-semibold">Бронь №{booking.id}</h2>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="text-gray-500 text-xl w-10 h-10 rounded-full hover:bg-gray-100 disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        <div className="mb-4 p-3 rounded-2xl bg-gray-100 text-xs text-gray-700 space-y-1">
          <p>
            Номер <span className="font-semibold">№{booking.room_number}</span>
          </p>
          {booking.user_name && (
            <p>
              Оформил: <span className="font-medium">{booking.user_name}</span>
            </p>
          )}
          <p>Создано: {formatDateTimeRu(booking.created_at)}</p>
          {Number(booking.guest_id) > 0 && (
            <p>
              ID гостя: <span className="font-mono font-medium">{booking.guest_id}</span>
            </p>
          )}
        </div>

        {onOpenGuestProfile && Number(booking.guest_id) > 0 && (
          <button
            type="button"
            onClick={() => onOpenGuestProfile(Number(booking.guest_id))}
            disabled={submitting}
            className="w-full mb-3 py-2.5 rounded-xl border border-gray-200 text-sm font-medium text-gray-800 hover:bg-gray-50 disabled:opacity-50"
          >
            Полная информация о клиенте
          </button>
        )}

        <p className="text-[11px] text-gray-500 mb-2">
          10 суток = 9 ночей; заезд и выезд включительно (как в поиске: 30.03–08.04 = 10 суток).
        </p>
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <p className="text-xs text-gray-500 mb-1">Заезд</p>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-gray-100 text-sm outline-none"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Выезд</p>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-gray-100 text-sm outline-none"
            />
          </div>
        </div>

        <input
          placeholder="Имя гостя"
          value={guestName}
          onChange={(e) => setGuestName(e.target.value)}
          className="w-full mb-3 p-3 rounded-2xl bg-gray-100 outline-none text-sm"
        />
        <input
          placeholder="+992 92 778 1020"
          value={guestPhone}
          onChange={(e) => setGuestPhone(formatTajikPhoneDisplay(e.target.value))}
          inputMode="numeric"
          className="w-full mb-3 p-3 rounded-2xl bg-gray-100 outline-none text-sm"
        />

        <div className="flex justify-between items-center mb-3">
          <span className="text-sm text-gray-800">Гостей</span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setPeople(Math.max(1, people - 1))}
              className="w-9 h-9 rounded-full bg-gray-200 text-lg"
            >
              −
            </button>
            <span className="min-w-[1.25rem] text-center font-medium">{people}</span>
            <button
              type="button"
              onClick={() => setPeople(Math.min(maxPeopleAllowed, people + 1))}
              className="w-9 h-9 rounded-full bg-gray-200 text-lg"
            >
              +
            </button>
          </div>
        </div>

        <div className="mb-3 space-y-2 rounded-xl bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs text-gray-500">Оплата за период</p>
          {stayDays > 0 && room ? (
            <>
              <p className="text-sm text-gray-800">
                <span className="font-semibold">{formatSom(totalForPeriod)}</span>
                <span className="text-gray-500 text-xs ml-1">
                  ({people} чел. · {stayDays} сут., {stayNights} ноч. · {formatSom(room.price)} за {PRICE_PERIOD_DAYS}{" "}
                  сут./чел.)
                </span>
              </p>
              {normalizeDiscountPercent(discountPercent) > 0 && (
                <p className="text-xs text-gray-500">
                  Без скидки: {formatSom(grossTotal)} · −{normalizeDiscountPercent(discountPercent)}%
                </p>
              )}
            </>
          ) : (
            <p className="text-xs text-gray-400">Укажите даты для расчёта суммы</p>
          )}
          <div>
            <p className="text-xs text-gray-500 mb-1">Скидка</p>
            <select
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-full p-2.5 rounded-xl bg-white border border-gray-100 text-sm outline-none"
            >
              {DISCOUNT_PERCENT_OPTIONS.map((p) => (
                <option key={p} value={p}>
                  {p}%
                </option>
              ))}
            </select>
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Предоплата</p>
            <input
              type="number"
              min="0"
              value={prepayment}
              onChange={(e) => setPrepayment(e.target.value)}
              className="w-full p-2.5 rounded-xl bg-white border border-gray-100 text-sm"
            />
          </div>
          <div className="flex justify-between items-baseline pt-1 border-t border-gray-100">
            <span className="text-xs text-gray-600">Долг (к доплате)</span>
            <span className={`text-sm font-semibold tabular-nums ${debtAmount > 0 ? "text-amber-800" : "text-emerald-700"}`}>
              {formatSom(debtAmount)}
            </span>
          </div>
        </div>

        <button
          type="button"
          onClick={handleSave}
          disabled={submitting}
          aria-busy={submitting}
          className="w-full py-3.5 rounded-2xl bg-black text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
        >
          {submitting && (
            <span
              className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              aria-hidden
            />
          )}
          {submitting ? "Сохранение…" : "Сохранить"}
        </button>

        {onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={submitting}
            className="w-full mt-2 py-3 rounded-2xl border border-red-200 text-red-700 text-sm font-medium hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Удалить бронь
          </button>
        )}
      </div>
    </div>
  );
}
