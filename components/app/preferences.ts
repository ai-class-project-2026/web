"use client";

// 내 화면 설정 (마이페이지 > 화면 설정). 서버가 아니라 이 브라우저에만 저장해요.
//  - text:  글자 크기 보통 / 크게
// useSyncExternalStore로 읽어서, 바꾸면 화면 어디서든 바로 다시 그려져요.

import { useEffect, useSyncExternalStore } from "react";

export type TextSize = "normal" | "large";
export type Prefs = { text: TextSize };

const KEY = "prefs";
const DEFAULT: Prefs = { text: "normal" };
const listeners = new Set<() => void>();
let cache: { raw: string | null; value: Prefs } = { raw: null, value: DEFAULT };

function read(): Prefs {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  // 같은 문자열이면 같은 객체를 돌려줘야 useSyncExternalStore가 무한히 다시 그리지 않아요
  if (raw !== cache.raw) {
    let parsed: Partial<Prefs> = {};
    try {
      parsed = raw ? JSON.parse(raw) : {};
    } catch {}
    cache = { raw, value: { ...DEFAULT, ...parsed } };
  }
  return cache.value;
}

export function setPrefs(patch: Partial<Prefs>) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...read(), ...patch }));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  window.addEventListener("storage", l); // 다른 탭에서 바꿔도 따라가요
  return () => {
    listeners.delete(l);
    window.removeEventListener("storage", l);
  };
}

export function usePrefs() {
  return useSyncExternalStore(subscribe, read, () => DEFAULT);
}

/** 루트 레이아웃에 한 번 두면 설정을 <html>에 적용해요 (data-text 속성) */
export function PrefsApplier() {
  const { text } = usePrefs();
  useEffect(() => {
    document.documentElement.dataset.text = text;
  }, [text]);
  return null;
}
