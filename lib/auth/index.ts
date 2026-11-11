"use client";

import { useEffect, useState } from "react";
import { api, type User } from "@/lib/api";

const KEY = "token";

// ponytail: JWT in localStorage. Readable by any script on the page (XSS), but
// the API is on another origin so cookies would need CSRF work; fine for now.
export function getToken(): string | null {
  return typeof window === "undefined" ? null : localStorage.getItem(KEY);
}

export function setToken(token: string) {
  localStorage.setItem(KEY, token);
}

export function logout() {
  localStorage.removeItem(KEY);
}

/** user: undefined = loading, null = logged out. */
export function useMe() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  useEffect(() => {
    // No token → 401 → null; one wasted request is simpler than a sync branch.
    api.GET("/auth/me").then(({ data }) => {
      if (!data) logout(); // expired or invalid token
      setUser(data ?? null);
    });
  }, []);
  return user;
}

export async function login(email: string, password: string) {
  const { data, error } = await api.POST("/auth/login", { body: { email, password } });
  if (data) setToken(data.access_token);
  return { ok: !!data, error };
}

export async function signup(name: string, email: string, password: string) {
  const { data, error } = await api.POST("/auth/signup", { body: { name, email, password } });
  if (data) setToken(data.access_token);
  return { ok: !!data, error };
}

/** idToken = `credential` from Google Identity Services' sign-in button. */
export async function googleLogin(idToken: string) {
  const { data, error } = await api.POST("/auth/google", { body: { id_token: idToken } });
  if (data) setToken(data.access_token);
  return { ok: !!data, error };
}
