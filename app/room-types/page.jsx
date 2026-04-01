"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { api } from "../../lib/api";
import { formatSom } from "../../lib/format";
import { PRICE_PERIOD_DAYS } from "../../lib/pricing";

export default function RoomTypesPage() {
  const { user, loading } = useRequireAuth({ requireSuperadmin: true });
  const [types, setTypes] = useState([]);
  const [dataLoading, setDataLoading] = useState(true);
  const [err, setErr] = useState(null);
  const [saving, setSaving] = useState(null);

  const [newCode, setNewCode] = useState("");
  const [newTitle, setNewTitle] = useState("");
  const [newPrice, setNewPrice] = useState("");
  const [newCap, setNewCap] = useState("2");

  const load = useCallback(async () => {
    setErr(null);
    setDataLoading(true);
    try {
      const data = await api.get("/room-types");
      setTypes(Array.isArray(data) ? data : []);
    } catch (e) {
      setErr(e.message || "Ошибка загрузки");
      setTypes([]);
    } finally {
      setDataLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    load();
  }, [user, load]);

  const handleCreate = async () => {
    const code = newCode.trim().toLowerCase();
    if (!code || !newTitle.trim()) {
      alert("Укажите код и название");
      return;
    }
    setSaving("__create__");
    try {
      await api.post("/room-types", {
        code,
        title: newTitle.trim(),
        price: Math.trunc(Number(newPrice) || 0),
        capacity: Math.trunc(Number(newCap) || 1),
      });
      setNewCode("");
      setNewTitle("");
      setNewPrice("");
      setNewCap("2");
      await load();
    } catch (e) {
      alert(e.message || "Не удалось создать");
    } finally {
      setSaving(null);
    }
  };

  const handleSaveRow = async (t) => {
    const pi = document.getElementById(`rtp-${t.id}`);
    const ti = document.getElementById(`rtt-${t.id}`);
    const ci = document.getElementById(`rtc-${t.id}`);
    if (!pi || !ti || !ci) return;
    const title = String(ti.value || "").trim();
    if (!title) {
      alert("Введите название");
      return;
    }
    setSaving(t.code);
    try {
      await api.patch(`/room-types/${encodeURIComponent(t.code)}`, {
        title,
        price: Math.trunc(Number(pi.value) || 0),
        capacity: Math.trunc(Number(ci.value) || 1),
      });
      await load();
    } catch (e) {
      alert(e.message || "Не сохранилось");
    } finally {
      setSaving(null);
    }
  };

  const handleDelete = async (t) => {
    if (!confirm(`Удалить тип «${t.title}» (${t.code})? Номера этого типа останутся без категории.`)) return;
    setSaving(t.code);
    try {
      await api.delete(`/room-types/${encodeURIComponent(t.code)}`);
      await load();
    } catch (e) {
      alert(e.message || "Не удалось удалить");
    } finally {
      setSaving(null);
    }
  };

  if (loading || !user) {
    return (
      <main className="min-h-dvh bg-[#f2f2f7] flex items-center justify-center p-4">
        <p className="text-sm text-gray-500">Загрузка…</p>
      </main>
    );
  }

  return (
    <AppShell title="Типы номеров" user={user}>
      <p className="text-sm text-gray-600 mb-4">
        Код — латиница, цифры, <code className="text-xs bg-gray-100 px-1 rounded">_</code> и{" "}
        <code className="text-xs bg-gray-100 px-1 rounded">-</code>. Цена — за одного человека за {PRICE_PERIOD_DAYS}{" "}
        суток; в брони умножается на число гостей.
      </p>

      {err && (
        <div className="mb-4 rounded-2xl bg-red-50 text-red-800 text-sm px-4 py-3 border border-red-100">
          {err}{" "}
          <button type="button" onClick={load} className="underline">
            Повторить
          </button>
        </div>
      )}

      <div className="mb-6 rounded-[22px] bg-white/80 border border-white/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <p className="text-sm font-semibold text-gray-900 mb-3">Новый тип</p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 items-end">
          <label className="text-xs text-gray-600 col-span-2 sm:col-span-1">
            Код (лат.)
            <input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value)}
              placeholder="comfort_plus"
              className="mt-1 w-full p-2 rounded-xl bg-gray-100 text-sm"
            />
          </label>
          <label className="text-xs text-gray-600 col-span-2 sm:col-span-1">
            Название
            <input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="Комфорт плюс"
              className="mt-1 w-full p-2 rounded-xl bg-gray-100 text-sm"
            />
          </label>
          <label className="text-xs text-gray-600">
            Цена, сом / {PRICE_PERIOD_DAYS} сут. / 1 чел.
            <input
              type="number"
              min="0"
              value={newPrice}
              onChange={(e) => setNewPrice(e.target.value)}
              className="mt-1 w-full p-2 rounded-xl bg-gray-100 text-sm"
            />
          </label>
          <label className="text-xs text-gray-600">
            Мест
            <input
              type="number"
              min="1"
              value={newCap}
              onChange={(e) => setNewCap(e.target.value)}
              className="mt-1 w-full p-2 rounded-xl bg-gray-100 text-sm"
            />
          </label>
        </div>
        <button
          type="button"
          disabled={saving === "__create__"}
          onClick={handleCreate}
          className="mt-3 px-4 py-2 rounded-xl bg-black text-white text-sm font-semibold disabled:opacity-50"
        >
          {saving === "__create__" ? "Создание…" : "Создать тип"}
        </button>
      </div>

      {dataLoading ? (
        <p className="text-sm text-gray-500">Загрузка…</p>
      ) : (
        <ul className="space-y-3">
          {types.map((t) => (
            <li
              key={t.id}
              className="rounded-[22px] border border-white/60 bg-white/75 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]"
            >
              <p className="text-xs text-gray-500 mb-2">
                <span className="font-mono text-gray-800">{t.code}</span>
              </p>
              <div className="flex flex-wrap gap-2 items-end">
                <label className="text-xs text-gray-600 flex-1 min-w-[8rem]">
                  Название
                  <input
                    id={`rtt-${t.id}`}
                    defaultValue={t.title}
                    key={`${t.id}-${t.title}`}
                    className="block mt-1 w-full p-2 rounded-xl bg-gray-100 text-sm"
                  />
                </label>
                <label className="text-xs text-gray-600">
                  Сом / {PRICE_PERIOD_DAYS} сут. / 1 чел.
                  <input
                    id={`rtp-${t.id}`}
                    type="number"
                    min="0"
                    defaultValue={t.price}
                    key={`${t.id}-p-${t.price}`}
                    className="block mt-1 w-28 p-2 rounded-xl bg-gray-100 text-sm"
                  />
                </label>
                <label className="text-xs text-gray-600">
                  Мест
                  <input
                    id={`rtc-${t.id}`}
                    type="number"
                    min="1"
                    defaultValue={t.capacity}
                    key={`${t.id}-c-${t.capacity}`}
                    className="block mt-1 w-16 p-2 rounded-xl bg-gray-100 text-sm"
                  />
                </label>
                <div className="flex gap-2 w-full sm:w-auto justify-end">
                  <button
                    type="button"
                    disabled={saving === t.code}
                    onClick={() => handleSaveRow(t)}
                    className="px-3 py-2 rounded-xl bg-gray-900 text-white text-xs font-semibold disabled:opacity-50"
                  >
                    {saving === t.code ? "…" : "Сохранить"}
                  </button>
                  <button
                    type="button"
                    disabled={saving === t.code}
                    onClick={() => handleDelete(t)}
                    className="px-3 py-2 rounded-xl bg-red-50 text-red-800 text-xs font-semibold border border-red-100 disabled:opacity-50"
                  >
                    Удалить
                  </button>
                </div>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Сейчас в каталоге: {formatSom(t.price)} · {t.capacity} чел.
              </p>
            </li>
          ))}
        </ul>
      )}
    </AppShell>
  );
}
