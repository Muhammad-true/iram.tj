"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import SideMenu from "./SideMenu";
import { getNavItems } from "../lib/nav";
import { setAuthToken } from "../lib/api";
import { formatTajikPhoneDisplay } from "../lib/phone";

function navLinkClass(active) {
  return `block px-3 py-2.5 rounded-xl text-sm font-medium border transition-colors ${
    active
      ? "bg-black text-white border-black"
      : "bg-gray-50 text-gray-900 border-gray-100 hover:bg-gray-100"
  }`;
}

export default function AppShell({ title, user, children }) {
  const router = useRouter();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const navItems = getNavItems(user.role);

  const handleLogout = () => {
    setAuthToken(null);
    router.replace("/login");
  };

  const isActive = (href) => pathname === href;
  const userLabel = user.name || formatTajikPhoneDisplay(user.phone);

  return (
    <div className="min-h-dvh bg-[#f2f2f7] lg:flex">
      {/* Навигация на ПК / большом планшете (≥1024px) */}
      <aside className="hidden lg:flex lg:flex-col lg:w-56 lg:shrink-0 lg:border-r lg:border-gray-200/80 lg:bg-white/80 lg:backdrop-blur-xl lg:sticky lg:top-0 lg:h-dvh lg:min-h-0">
        <div className="p-4 border-b border-gray-100/80 shrink-0">
          <p className="text-xs uppercase tracking-[0.16em] text-gray-500">IRAM</p>
          <p className="font-semibold text-gray-900 truncate" title={userLabel}>
            {userLabel}
          </p>
          <p className="text-xs text-gray-500 mt-0.5 capitalize">{user.role}</p>
        </div>
        <nav className="flex-1 min-h-0 p-3 space-y-1 overflow-y-auto">
          <p className="px-2 text-xs text-gray-500 mb-2">Разделы</p>
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={navLinkClass(isActive(item.href))}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="p-3 border-t border-gray-100 shrink-0">
          <button
            type="button"
            onClick={handleLogout}
            className="w-full px-3 py-2.5 rounded-2xl bg-red-50 text-red-700 text-sm font-semibold border border-red-100 hover:bg-red-100 transition-colors"
          >
            Выйти
          </button>
        </div>
      </aside>

      <main className="flex-1 min-w-0 w-full px-4 sm:px-6 md:max-w-3xl md:mx-auto lg:max-w-none lg:mx-0 xl:max-w-[1440px] xl:mx-auto xl:px-10 pt-6 pb-10 2xl:max-w-[1600px]">
        {/* Мобильный: без апп-бара — заголовок уезжает со скроллом; ☰ фиксирована и остаётся */}
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="fixed z-40 flex h-12 w-12 items-center justify-center rounded-xl border border-gray-200/50 bg-gray-100/55 text-2xl leading-none shadow-sm backdrop-blur-md active:scale-[0.98] lg:hidden"
          style={{ top: "max(1.5rem, env(safe-area-inset-top))", left: "max(1rem, env(safe-area-inset-left))" }}
          aria-label="Открыть меню"
        >
          ☰
        </button>

        <header className="mb-6 lg:mb-8">
          <div className="flex items-start gap-2 sm:gap-3 lg:gap-4">
            <div className="w-12 shrink-0 lg:hidden" aria-hidden />
            <div className="min-w-0 flex-1 text-center lg:flex-none lg:text-left">
              <h1 className="text-2xl font-bold tracking-tight sm:text-[1.75rem] lg:text-3xl">{title}</h1>
              <p className="mt-1 hidden text-sm text-gray-500 lg:block lg:text-base">
                {userLabel} · {user.role}
              </p>
            </div>
            <div className="w-12 shrink-0 lg:hidden" aria-hidden />
          </div>
        </header>

        <SideMenu
          open={menuOpen}
          onClose={() => setMenuOpen(false)}
          pathname={pathname}
          onLogout={handleLogout}
          items={navItems}
          user={user}
        />

        {children}
      </main>
    </div>
  );
}
