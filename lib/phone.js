export const TAJIKISTAN_PHONE_PREFIX = "+992";

function digitsOnly(value) {
  return String(value || "").replace(/\D/g, "");
}

export function getTajikPhoneLocalDigits(value) {
  const digits = digitsOnly(value);
  let local = digits.startsWith("992") ? digits.slice(3) : digits.replace(/^0+/, "");
  if (local.length > 9) local = local.slice(-9);
  return local.slice(0, 9);
}

export function formatTajikPhoneDisplay(value) {
  const local = getTajikPhoneLocalDigits(value);
  if (!local) return TAJIKISTAN_PHONE_PREFIX;

  const groups = [];
  if (local.slice(0, 2)) groups.push(local.slice(0, 2));
  if (local.slice(2, 5)) groups.push(local.slice(2, 5));
  if (local.slice(5, 9)) groups.push(local.slice(5, 9));

  return `${TAJIKISTAN_PHONE_PREFIX} ${groups.join(" ")}`.trim();
}

export function formatTajikPhoneForApi(value) {
  return `${TAJIKISTAN_PHONE_PREFIX}${getTajikPhoneLocalDigits(value)}`;
}
