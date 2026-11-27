"use client";

// 왼쪽 프로젝트 레일에 필요한 "내 프로젝트(워크스페이스) 목록".
// 진짜 서버: GET /auth/me, GET /workspaces / 데모: components/demo/cache.ts

import { useEffect, useState } from "react";
import { api, type Workspace } from "@/lib/api";
import { demoCache } from "@/components/demo/cache";

// 화면을 옮길 때마다 레일이 깜빡이지 않게 마지막 결과를 기억해요
let liveCache: Workspace[] | null = null;

export function useProjects(demo: boolean): { workspaces: Workspace[] } {
  const [live, setLive] = useState<Workspace[]>(liveCache ?? []);

  useEffect(() => {
    if (demo) return;
    let alive = true;
    (async () => {
      try {
        // /auth/me 결과는 쓰지 않지만 요청은 그대로 둬요 (로그인이 풀렸으면 401로 로그인 화면에 가요, @/lib/api)
        const [, ws] = await Promise.all([api.GET("/auth/me"), api.GET("/workspaces")]);
        if (!alive) return;
        liveCache = ws.data ?? [];
        setLive(liveCache);
      } catch {}
    })();
    return () => {
      alive = false;
    };
  }, [demo]);

  if (demo) return { workspaces: demoCache.projects().map((p) => p.workspace) };
  return { workspaces: live };
}
