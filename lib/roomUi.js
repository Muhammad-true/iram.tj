/** Запасной стиль, если нет цены или неизвестный тип. */
export const TYPE_STYLES = {
  default: {
    label: "—",
    chip: "bg-gray-100 text-gray-800 border-gray-200/80",
    accent: "from-gray-200/40 to-white",
    card: "border border-gray-200/90 bg-gradient-to-br from-gray-50/90 to-white shadow-sm",
    typeDot: "bg-gray-400/80",
  },
};

/**
 * Цвет карточки по цене каталога (сом/сутки) — только ваши тарифы, от дешёвого к дорогому:
 * 1600 → 1800 → 2000 → 2500 → 4000.
 */
export const PRICE_TIER_STYLES = {
  p1600: {
    legendShort: "1600 с",
    legendHint: "самый дешёвый тариф",
    chip: "bg-emerald-100 text-emerald-950 border-emerald-300/80",
    card: "border border-emerald-200/80 bg-gradient-to-br from-emerald-50/95 via-white to-white shadow-sm",
    typeDot: "bg-emerald-400/90",
    priceClass: "text-emerald-800/85 font-medium",
  },
  p1800: {
    legendShort: "1800 с",
    legendHint: "2 чел · 1800, коттедж 3 чел · 1800",
    chip: "bg-indigo-100 text-indigo-950 border-indigo-300/80",
    card: "border border-indigo-200/80 bg-gradient-to-br from-indigo-50/95 via-white to-white shadow-sm",
    typeDot: "bg-indigo-400/90",
    priceClass: "text-indigo-800/85 font-medium",
  },
  p2000: {
    legendShort: "2000 с",
    legendHint: "1 чел · 2000",
    chip: "bg-sky-200 text-sky-950 border-sky-400/75",
    card: "border border-sky-300/90 bg-gradient-to-br from-sky-200/90 via-sky-100/65 to-white shadow-sm",
    typeDot: "bg-sky-600/90",
    priceClass: "text-sky-950 font-medium",
  },
  p2500: {
    legendShort: "2500 с",
    legendHint: "люкс 2 чел, коттедж 3 чел",
    chip: "bg-slate-100 text-slate-950 border-slate-300/80",
    card: "border border-slate-200/80 bg-gradient-to-br from-slate-50/95 via-white to-white shadow-sm",
    typeDot: "bg-slate-400/90",
    priceClass: "text-slate-800/85 font-medium",
  },
  p4000: {
    legendShort: "4000 с",
    legendHint: "люкс 1 чел — максимум",
    chip: "bg-amber-200 text-amber-950 border-amber-500/65",
    card: "border border-amber-400/85 bg-gradient-to-br from-amber-100/95 via-yellow-50/90 to-amber-50/50 shadow-sm",
    typeDot: "bg-amber-500",
    priceClass: "text-amber-950 font-semibold",
  },
};

export const PRICE_TIER_ORDER = ["p1600", "p1800", "p2000", "p2500", "p4000"];

const PRICE_TO_TIER = {
  1600: "p1600",
  1800: "p1800",
  2000: "p2000",
  2500: "p2500",
  4000: "p4000",
};

/** Цвет карточки по цене из каталога; при нестандартной цене — ближайшая ступень. */
export function getPriceTierStyle(price) {
  const p = Number(price);
  if (!Number.isFinite(p) || p <= 0) return null;

  let tier = PRICE_TO_TIER[p];
  if (!tier) {
    if (p < 1700) tier = "p1600";
    else if (p < 1900) tier = "p1800";
    else if (p < 2250) tier = "p2000";
    else if (p < 3250) tier = "p2500";
    else tier = "p4000";
  }

  return { ...PRICE_TIER_STYLES[tier], tier };
}

/** Резерв, если цены нет — стиль TYPE_STYLES.default. */
export function normalizeType(_code) {
  return "default";
}
