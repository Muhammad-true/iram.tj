import { eachStayDayYmd } from "./dates";

/**
 * В каталоге (room_types.price) цена за одного человека за стандартный период —
 * PRICE_PERIOD_DAYS суток (не за одну ночь). Итог брони = тариф × сутки/период × число гостей.
 */
export const PRICE_PERIOD_DAYS = 10;

/** Допустимые скидки к сумме по тарифу (в процентах). */
export const DISCOUNT_PERCENT_OPTIONS = [0, 5, 10];

/** 0, 5 или 10 — иначе 0. */
export function normalizeDiscountPercent(value) {
  const x = Math.trunc(Number(value) || 0);
  if (x === 5 || x === 10) return x;
  return 0;
}

/** Итог после скидки от полной суммы (округление до целых сом). */
export function totalAfterDiscountPercent(grossTotal, discountPercent) {
  const g = Math.max(0, Math.trunc(Number(grossTotal) || 0));
  const d = normalizeDiscountPercent(discountPercent);
  if (d < 1) return g;
  return Math.max(0, Math.round((g * (100 - d)) / 100));
}

/**
 * Число суток по брони: заезд и выезд включительно (как в occupancy и на бэкенде).
 */
export function countNightsStay(checkIn, checkOut) {
  const cin = String(checkIn || "").slice(0, 10);
  const cout = String(checkOut || "").slice(0, 10);
  if (!cin || !cout || cin > cout) return 0;
  return eachStayDayYmd(cin, cout).length;
}

/** Ночи проживания при сутках [check_in, check_out] вкл.: на одну меньше (10 суток → 9 ночей). */
export function stayNightsFromInclusiveStayDays(stayDays) {
  const d = Math.max(0, Math.trunc(Number(stayDays) || 0));
  return Math.max(0, d - 1);
}

/**
 * Сумма за выбранный период: за 1 чел. пропорционально суткам; умножается на peopleCount.
 */
export function totalStayPriceFromCatalog(roomPrice, stayDays, peopleCount = 1) {
  const p = Math.trunc(Number(roomPrice) || 0);
  const n = Math.max(0, Math.trunc(Number(stayDays) || 0));
  const g = Math.max(0, Math.trunc(Number(peopleCount) || 0));
  if (n < 1 || g < 1) return 0;
  const perGuest = Math.round((p * n) / PRICE_PERIOD_DAYS);
  return Math.max(0, Math.round(perGuest * g));
}

/** Сумма по тарифу с учётом скидки (списки и сверка). */
export function tariffTotalForBookingDates(
  roomPrice,
  checkIn,
  checkOut,
  peopleCount = 1,
  discountPercent = 0
) {
  const gross = totalStayPriceFromCatalog(roomPrice, countNightsStay(checkIn, checkOut), peopleCount);
  return totalAfterDiscountPercent(gross, discountPercent);
}
