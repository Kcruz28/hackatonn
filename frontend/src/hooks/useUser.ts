"use client";

import { useCallback, useEffect, useState } from "react";
import { apiFetch } from "@/lib/api";
import { getToken } from "@/lib/auth";
import type { ProfileSummary } from "@/lib/types";

export function useUser() {
  const [user, setUser] = useState<ProfileSummary | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!getToken()) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      setUser(await apiFetch<ProfileSummary>("/auth/me"));
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { user, loading, refresh };
}
