import { eachSearchWindowDayYmd } from "./dates";

/** Макс. занятых мест в любой календарный день окна [from, to] включительно (как в поиске номеров). */
export function maxOccupiedPeopleInRange(bookingsForRoom, from, to) {
  let max = 0;
  for (const night of eachSearchWindowDayYmd(from, to)) {
    let s = 0;
    for (const b of bookingsForRoom) {
      const bi = String(b.check_in).slice(0, 10);
      const bo = String(b.check_out).slice(0, 10);
      if (bi <= night && night <= bo) s += Number(b.people_count) || 0;
    }
    if (s > max) max = s;
  }
  return max;
}

/** Сколько мест минимум свободно в любой календарный день окна (при частичном заселении). */
export function minFreeBeds(room, bookingsForRoom, from, to) {
  const cap = Number(room.capacity) || 0;
  return Math.max(0, cap - maxOccupiedPeopleInRange(bookingsForRoom, from, to));
}

export function minFreeBedsExcluding(room, bookingsForRoom, from, to, excludeBookingId) {
  const ex = excludeBookingId != null ? Number(excludeBookingId) : null;
  const filtered =
    ex != null && !Number.isNaN(ex)
      ? bookingsForRoom.filter((b) => Number(b.id) !== ex)
      : bookingsForRoom;
  return minFreeBeds(room, filtered, from, to);
}
