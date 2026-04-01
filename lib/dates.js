export function addDaysYmd(ymd, days) {
  const d = new Date(ymd + "T12:00:00");
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Полуинтервал [start, end) — даты YYYY-MM-DD (например окно просмотра «с» / «по»). */
export function eachNightYmd(checkIn, checkOut) {
  const out = [];
  let d = String(checkIn).slice(0, 10);
  const end = String(checkOut).slice(0, 10);
  while (d < end) {
    out.push(d);
    d = addDaysYmd(d, 1);
  }
  return out;
}

/** Календарные дни проживания по брони: заезд и выезд включительно. */
export function eachStayDayYmd(checkIn, checkOut) {
  const cin = String(checkIn).slice(0, 10);
  const cout = String(checkOut).slice(0, 10);
  if (!cin || !cout || cin > cout) return [];
  return eachNightYmd(cin, addDaysYmd(cout, 1));
}

/** Окно поиска/просмотра: обе границы включительно (30.03–08.04 → 10 календарных дней). */
export function eachSearchWindowDayYmd(fromInclusive, toInclusive) {
  const a = String(fromInclusive).slice(0, 10);
  const b = String(toInclusive).slice(0, 10);
  if (!a || !b || a > b) return [];
  return eachNightYmd(a, addDaysYmd(b, 1));
}

export function todayYmd() {
  return new Date().toISOString().slice(0, 10);
}
