"use client";

import { useEffect, useMemo, useState } from "react";
import { formatSom } from "../lib/format";
import { minFreeBeds } from "../lib/occupancy";
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

export default function BookingModal({
  room,
  roomBookings = [],
  onClose,
  onSubmit,
  defaultCheckIn = "",
  defaultCheckOut = "",
}) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(TAJIKISTAN_PHONE_PREFIX);
  const [people, setPeople] = useState(1);
  const [prepayment, setPrepayment] = useState(0);
  const [checkIn, setCheckIn] = useState(defaultCheckIn);
  const [checkOut, setCheckOut] = useState(defaultCheckOut);
  const [discountPercent, setDiscountPercent] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setCheckIn(defaultCheckIn);
    setCheckOut(defaultCheckOut);
    setName("");
    setPhone(TAJIKISTAN_PHONE_PREFIX);
    setPeople(1);
    setPrepayment(0);
    setDiscountPercent(0);
    setSubmitting(false);
  }, [room?.id, defaultCheckIn, defaultCheckOut]);

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

  const maxPeopleAllowed = useMemo(() => {
    if (!room || !checkIn || !checkOut || checkIn > checkOut) return Number(room.capacity) || 0;
    const free = minFreeBeds(room, roomBookings, checkIn, checkOut);
    return Math.min(Number(room.capacity) || 0, free);
  }, [room, roomBookings, checkIn, checkOut]);

  useEffect(() => {
    setPeople((p) => {
      const cap = maxPeopleAllowed;
      if (cap < 1) return 1;
      return Math.min(Math.max(1, p), cap);
    });
  }, [maxPeopleAllowed]);

  const handleSubmit = async () => {
    if (submitting) return;
    if (!name) return alert("Введите имя");
    if (!checkIn || !checkOut) return alert("Укажите даты заезда и выезда");
    if (checkIn > checkOut) return alert("Дата выезда не может быть раньше заезда");

    if (maxPeopleAllowed < 1 || people > maxPeopleAllowed) {
      return alert("Недостаточно свободных мест на эти даты");
    }

    setSubmitting(true);
    try {
      await onSubmit({
        guest_name: name,
        guest_phone: formatTajikPhoneForApi(phone),
        people_count: people,
        prepayment: prepaymentAmount,
        debt: debtAmount,
        discount_percent: normalizeDiscountPercent(discountPercent),
        check_in: checkIn,
        check_out: checkOut,
      });
      alert("Бронь успешно оформлена.");
      onClose();
    } catch {
      /* ошибка уже обработана в родителе */
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-end sm:items-center justify-center z-50 sm:p-4">
      <button
        type="button"
        aria-label="Закрыть"
        className="absolute inset-0 cursor-default"
        onClick={() => !submitting && onClose()}
      />
      <div className="relative w-full max-w-md sm:max-w-lg bg-white rounded-t-[20px] sm:rounded-2xl p-5 sm:p-6 shadow-[0_-8px_32px_rgba(0,0,0,0.12)] sm:shadow-2xl animate-slideUp pb-[max(1.25rem,env(safe-area-inset-bottom))] max-h-[90dvh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-lg font-semibold tracking-tight">Бронирование</h2>
          <button
            type="button"
            onClick={() => !submitting && onClose()}
            disabled={submitting}
            className="text-gray-500 text-xl leading-none w-10 h-10 flex items-center justify-center rounded-full hover:bg-gray-100 active:bg-gray-200 disabled:opacity-40"
          >
            ✕
          </button>
        </div>

        {/* Room info */}
        <div className="mb-4 p-3 rounded-2xl bg-gray-100 text-sm text-gray-800 space-y-1">
          <p>
            🛏 {room.number} • {formatSom(room.price)} за {PRICE_PERIOD_DAYS} сут.{" "}
            <span className="text-gray-600">(1 чел.)</span> · {room.capacity} мест
          </p>
          {checkIn && checkOut && checkIn <= checkOut && (
            <p className="text-xs text-gray-600">
              {maxPeopleAllowed < 1
                ? "На эти даты нет свободных мест"
                : `Можно зачислить на эти даты: до ${maxPeopleAllowed} чел.`}
            </p>
          )}
        </div>

        <p className="text-[11px] text-gray-500 mb-2">
          Сутки и поиск на номерах: заезд и выезд включительно (30.03–08.04 = 10 суток, 9 ночей).
        </p>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div>
            <p className="text-xs text-gray-500 mb-1">Заезд</p>
            <input
              type="date"
              value={checkIn}
              onChange={(e) => setCheckIn(e.target.value)}
              className="w-full p-3 rounded-2xl bg-gray-100 outline-none text-sm"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 mb-1">Выезд</p>
            <input
              type="date"
              value={checkOut}
              onChange={(e) => setCheckOut(e.target.value)}
              className="w-full p-3 rounded-2xl bg-gray-100 outline-none text-sm"
            />
          </div>
        </div>

        {/* Name */}
        <input
          placeholder="Имя клиента"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full mb-4 p-3 rounded-2xl bg-gray-100 outline-none focus:ring-2 focus:ring-black/10"
        />

        <input
          placeholder="+992 92 778 1020"
          value={phone}
          onChange={(e) => setPhone(formatTajikPhoneDisplay(e.target.value))}
          inputMode="numeric"
          className="w-full mb-4 p-3 rounded-2xl bg-gray-100 outline-none focus:ring-2 focus:ring-black/10"
        />

        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-800">Гостей</span>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setPeople(Math.max(1, people - 1))}
              className="w-10 h-10 rounded-full bg-gray-200 text-lg font-medium active:scale-95"
            >
              −
            </button>
            <span className="min-w-[1.5rem] text-center font-medium">{people}</span>
            <button
              type="button"
              onClick={() => setPeople(Math.min(maxPeopleAllowed, people + 1))}
              className="w-10 h-10 rounded-full bg-gray-200 text-lg font-medium active:scale-95"
            >
              +
            </button>
          </div>
        </div>

        <div className="mb-4 space-y-2 rounded-2xl bg-gray-50 border border-gray-100 p-3">
          <p className="text-xs text-gray-500">Оплата за период</p>
          {stayDays > 0 ? (
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
            <p className="text-xs text-gray-400">Выберите даты заезда и выезда — посчитаем сумму</p>
          )}
          <div>
            <p className="text-xs text-gray-500 mb-1">Скидка</p>
            <select
              value={discountPercent}
              onChange={(e) => setDiscountPercent(Number(e.target.value))}
              className="w-full p-3 rounded-2xl bg-white border border-gray-100 text-sm outline-none focus:ring-2 focus:ring-black/10"
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
              placeholder="0"
              value={prepayment}
              onChange={(e) => setPrepayment(e.target.value)}
              type="number"
              min="0"
              className="w-full p-3 rounded-2xl bg-white border border-gray-100 outline-none focus:ring-2 focus:ring-black/10"
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
          onClick={handleSubmit}
          disabled={submitting}
          aria-busy={submitting}
          className="w-full bg-black text-white py-3.5 rounded-2xl font-semibold active:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
        >
          {submitting && (
            <span
              className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              aria-hidden
            />
          )}
          {submitting ? "Отправка…" : "Забронировать"}
        </button>
      </div>

      <style jsx>{`
        .animate-slideUp {
          animation: slideUp 0.28s cubic-bezier(0.32, 0.72, 0, 1);
        }
        @keyframes slideUp {
          from {
            transform: translateY(100%);
            opacity: 0.96;
          }
          to {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
