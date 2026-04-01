/** @param {string} role */
export function getNavItems(role) {
  const common = [
    { href: "/home", label: "Главная" },
    { href: "/rooms", label: "Номера" },
    { href: "/bookings", label: "Брони" },
    { href: "/guests", label: "Гости" },
  ];
  if (role === "superadmin") {
    return [
      ...common,
      { href: "/room-types", label: "Типы номеров" },
      { href: "/audit", label: "Журнал броней" },
      { href: "/admins", label: "Администраторы" },
    ];
  }
  return common;
}
