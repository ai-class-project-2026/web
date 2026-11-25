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

// 다른 탭에서 로그아웃하거나 다른 계정으로 로그인하면 이 탭도 새로 불러와요.
// 그대로 두면 화면은 A인데 요청은 B의 토큰으로 나가요. 로그아웃이면 각 화면이 로그인 화면으로 보내요.
// (storage 이벤트는 값을 바꾼 탭에는 오지 않아요. key가 null이면 저장소를 통째로 비운 거예요)
if (typeof window !== "undefined") {
  window.addEventListener("storage", (e) => {
    if (e.key === KEY || e.key === null) location.reload();
  });
}

/**
 * user: undefined = 불러오는 중, null = 로그아웃 상태.
 * 서버에 연결 못 했거나 5xx면 로그아웃하지 않고 error를 돌려줘요. retry()로 다시 시도해요.
 */
export function useMe() {
  const [user, setUser] = useState<User | null | undefined>(undefined);
  const [error, setError] = useState(false);
  const [tick, setTick] = useState(0);
  useEffect(() => {
    let alive = true;
    // 토큰이 없어도 401로 null이 돼요. 요청 한 번 더 쓰는 쪽이 분기보다 단순해요.
    api
      .GET("/auth/me")
      .then(({ data, response }) => {
        if (!alive) return;
        if (data) return setUser(data);
        // 401(토큰 만료·잘못됨)일 때만 로그아웃해요. 5xx는 잠깐의 서버 문제일 수 있어요.
        if (response.status === 401) {
          logout();
          setUser(null);
        } else setError(true);
      })
      .catch(() => alive && setError(true));
    return () => {
      alive = false;
    };
  }, [tick]);
  const retry = () => {
    setError(false);
    setUser(undefined);
    setTick((t) => t + 1);
  };
  return { user, error, retry };
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
