"use client";

import Link from "next/link";
import { formatTajikPhoneDisplay } from "../lib/phone";

export default function SideMenu({
  open,
  onClose,
  pathname = "",
  onLogout,
  items = [],
  user = null,
}) {
  const isActive = (href) => pathname === href;
  const userLabel = user ? user.name || formatTajikPhoneDisplay(user.phone) : "";

  return (
    <>
      {open && (
        <button
          type="button"
          aria-label="Закрыть меню"
          className={`fixed inset-0 z-40 bg-black/35 backdrop-blur-[1px] transition-opacity ${
            open ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed top-0 left-0 z-50 h-dvh w-[86%] max-w-sm border-r border-white/40 bg-white/90 backdrop-blur-xl shadow-[0_24px_60px_rgba(0,0,0,0.18)] transition-transform duration-300 ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="p-4 border-b border-gray-100/80">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-[0.16em] text-gray-500">IRAM</p>
              {user && (
                <>
                  <p className="font-semibold text-gray-900 truncate" title={userLabel}>
                    {userLabel}
                  </p>
                  <p className="text-xs text-gray-500 mt-1 capitalize">{user.role}</p>
                </>
              )}
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-9 h-9 shrink-0 rounded-full bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors"
            >
              ✕
            </button>
          </div>
        </div>
        <nav className="p-3 space-y-4">
          <div className="space-y-2">
            <p className="px-2 text-xs text-gray-500">Разделы</p>
            <div className="space-y-2">
              {items.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={onClose}
                  className={`block px-3 py-2.5 rounded-2xl text-sm font-medium border transition-colors ${
                    isActive(item.href)
                      ? "bg-black text-white border-black"
                      : "bg-gray-50 text-gray-900 border-gray-100 hover:bg-gray-100"
                  }`}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
          <div className="pt-2 border-t border-gray-100">
            <button
              type="button"
              onClick={onLogout}
              className="w-full mt-2 px-3 py-2.5 rounded-2xl bg-red-50 text-red-700 text-sm font-semibold border border-red-100 hover:bg-red-100 transition-colors"
            >
              Выйти
            </button>
          </div>
        </nav>
      </aside>
    </>
  );
}
