"use client";

import Image from "next/image";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api, setAuthToken } from "../../lib/api";
import iramLogo from "../../assets/iram.PNG";
import { formatTajikPhoneDisplay, formatTajikPhoneForApi, TAJIKISTAN_PHONE_PREFIX } from "../../lib/phone";

function humanizeLoginError(message) {
  const m = String(message || "").toLowerCase();
  if (m.includes("invalid credentials")) return "Неверный телефон или пароль";
  if (m.includes("phone and password are required")) return "Введите телефон и пароль";
  if (m.includes("failed to fetch")) return "Нет соединения с сервером";
  return message || "Ошибка входа";
}

function EyeIcon({ open }) {
  if (open) {
    return (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c4.756 0 8.773-3.162 10.065-7.498a10.523 10.523 0 00-4.293-5.774M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L4.5 4.5m1.728 1.728L12 12m-5.772-5.772L12 12"
        />
      </svg>
    );
  }
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState(TAJIKISTAN_PHONE_PREFIX);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [pending, setPending] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (pending) return;
    setAuthError("");
    setPending(true);
    try {
      const data = await api.post("/auth/login", { phone: formatTajikPhoneForApi(phone), password });
      setAuthToken(data.token);
      setPassword("");
      router.replace("/home");
    } catch (error) {
      setAuthError(humanizeLoginError(error.message));
    } finally {
      setPending(false);
    }
  };

  return (
    <main className="min-h-dvh flex items-center justify-center p-4 sm:p-6 md:p-8 bg-gradient-to-br from-slate-100 via-[#eef3ef] to-emerald-50/90">
      <form
        onSubmit={handleLogin}
        className="w-full max-w-sm sm:max-w-md rounded-[22px] bg-white/85 backdrop-blur-xl p-6 sm:p-8 shadow-[0_12px_40px_rgba(15,23,42,0.08)] ring-1 ring-black/[0.04]"
      >
        <header className="mb-6 text-center">
          <div className="mx-auto mb-4 flex justify-center">
            <Image
              src={iramLogo}
              alt="IRAM"
              priority
              className="h-24 w-24 rounded-3xl object-contain"
            />
          </div>
          <h1 className="text-[1.85rem] font-semibold tracking-tight text-slate-900 leading-none">
            <span className="bg-gradient-to-r from-teal-800 via-emerald-700 to-teal-700 bg-clip-text text-transparent">
              Ирам
            </span>
          </h1>
          <p className="mt-2 text-[0.65rem] font-semibold uppercase tracking-[0.32em] text-emerald-800/75">
            санатория
          </p>
          <div className="mx-auto mt-3 h-px w-12 rounded-full bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" aria-hidden />
          <p className="text-sm text-slate-500 mt-4">Вход · телефон и пароль администратора</p>
        </header>

        <input
          className="w-full mb-3 p-3 rounded-2xl bg-gray-100 outline-none"
          placeholder="+992 92 778 1020"
          value={phone}
          onChange={(e) => setPhone(formatTajikPhoneDisplay(e.target.value))}
          inputMode="numeric"
          autoComplete="username"
        />
        <div className="relative mb-3">
          <input
            className="w-full p-3 pr-12 rounded-2xl bg-gray-100 outline-none"
            placeholder="Пароль"
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
          <button
            type="button"
            tabIndex={-1}
            className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-xl text-gray-500 hover:bg-gray-200/80 hover:text-gray-800 active:scale-95 transition-colors"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? "Скрыть пароль" : "Показать пароль"}
          >
            <EyeIcon open={showPassword} />
          </button>
        </div>

        {authError && <p className="text-sm text-red-600 mb-2">{authError}</p>}

        <button
          className="w-full py-3 rounded-2xl bg-black text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 min-h-[48px]"
          type="submit"
          disabled={pending}
          aria-busy={pending}
        >
          {pending && (
            <span
              className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"
              aria-hidden
            />
          )}
          {pending ? "Вход…" : "Войти"}
        </button>
      </form>
    </main>
  );
}
