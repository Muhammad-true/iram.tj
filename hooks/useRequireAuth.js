"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { api, loadAuthToken, setAuthToken } from "../lib/api";

/**
 * @param {{ requireSuperadmin?: boolean }} [options]
 */
export function useRequireAuth(options = {}) {
  const { requireSuperadmin = false } = options;
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!loadAuthToken()) {
      router.replace("/login");
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const me = await api.get("/me");
        if (cancelled) return;
        if (requireSuperadmin && me.role !== "superadmin") {
          router.replace("/home");
          return;
        }
        setUser(me);
      } catch {
        setAuthToken(null);
        router.replace("/login");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router, requireSuperadmin]);

  return { user, loading };
}
