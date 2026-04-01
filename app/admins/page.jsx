"use client";

import { useCallback, useEffect, useState } from "react";
import AppShell from "../../components/AppShell";
import { useRequireAuth } from "../../hooks/useRequireAuth";
import { api } from "../../lib/api";
import { formatTajikPhoneDisplay, formatTajikPhoneForApi, TAJIKISTAN_PHONE_PREFIX } from "../../lib/phone";

export default function AdminsPage() {
  const { user, loading } = useRequireAuth({ requireSuperadmin: true });
  const [admins, setAdmins] = useState([]);
  const [newAdminName, setNewAdminName] = useState("");
  const [newAdminPhone, setNewAdminPhone] = useState(TAJIKISTAN_PHONE_PREFIX);
  const [newAdminPassword, setNewAdminPassword] = useState("");
  const [newAdminRole, setNewAdminRole] = useState("admin");

  const fetchAdmins = useCallback(async () => {
    try {
      const data = await api.get("/admins");
      setAdmins(Array.isArray(data) ? data : []);
    } catch {
      setAdmins([]);
    }
  }, []);

  useEffect(() => {
    if (!user) return;
    fetchAdmins();
  }, [user, fetchAdmins]);

  const handleCreateAdmin = async () => {
    if (!newAdminName || !newAdminPhone || !newAdminPassword) return;
    try {
      await api.post("/admins", {
        name: newAdminName,
        phone: formatTajikPhoneForApi(newAdminPhone),
        password: newAdminPassword,
        role: newAdminRole,
      });
      setNewAdminName("");
      setNewAdminPhone(TAJIKISTAN_PHONE_PREFIX);
      setNewAdminPassword("");
      setNewAdminRole("admin");
      await fetchAdmins();
    } catch (e) {
      alert(e.message || "Не удалось создать администратора");
    }
  };

  const handleDeleteAdmin = async (id) => {
    if (!confirm("Удалить администратора?")) return;
    try {
      await api.delete(`/admins/${id}`);
      await fetchAdmins();
    } catch (e) {
      alert(e.message || "Не удалось удалить администратора");
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
    <AppShell title="Администраторы" user={user}>
      <section className="rounded-[22px] bg-white/80 border border-white/60 p-4 shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
        <h2 className="font-semibold text-lg">Создать администратора</h2>
        <div className="grid grid-cols-1 gap-2 mt-3">
          <input
            value={newAdminName}
            onChange={(e) => setNewAdminName(e.target.value)}
            placeholder="Имя"
            className="p-3 rounded-xl bg-gray-100 outline-none"
          />
          <input
            value={newAdminPhone}
            onChange={(e) => setNewAdminPhone(formatTajikPhoneDisplay(e.target.value))}
            placeholder="+992 92 778 1020"
            inputMode="numeric"
            className="p-3 rounded-xl bg-gray-100 outline-none"
          />
          <input
            value={newAdminPassword}
            onChange={(e) => setNewAdminPassword(e.target.value)}
            placeholder="Пароль"
            type="password"
            className="p-3 rounded-xl bg-gray-100 outline-none"
          />
          <select
            value={newAdminRole}
            onChange={(e) => setNewAdminRole(e.target.value)}
            className="p-3 rounded-xl bg-gray-100 outline-none"
          >
            <option value="admin">admin</option>
            <option value="superadmin">superadmin</option>
          </select>
          <button
            type="button"
            onClick={handleCreateAdmin}
            className="py-3 rounded-xl bg-black text-white font-semibold"
          >
            Создать администратора
          </button>
        </div>

        <h2 className="font-semibold text-lg mt-8">Список</h2>
        <ul className="mt-3 space-y-2">
          {admins.map((a) => (
            <li key={a.id} className="flex justify-between items-center gap-3 p-3 rounded-xl bg-gray-50">
              <div className="text-sm">
                <p className="font-medium">{a.name || "Без имени"}</p>
                <p className="text-gray-600">{formatTajikPhoneDisplay(a.phone)}</p>
                <p className="text-gray-500">{a.role}</p>
              </div>
              {user.id !== a.id && (
                <button
                  type="button"
                  onClick={() => handleDeleteAdmin(a.id)}
                  className="px-3 py-2 rounded-lg bg-red-100 text-red-700 text-sm"
                >
                  Удалить
                </button>
              )}
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
