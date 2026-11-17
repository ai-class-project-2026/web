"use client";

// 왼쪽 프로젝트 레일에 필요한 "나"와 "내 프로젝트(워크스페이스) 목록".
// 진짜 서버: GET /auth/me, GET /workspaces / 데모: lib/dummy.ts

import { useEffect, useState } from "react";
import { api, type User, type Workspace } from "@/lib/api";
import { dummyMe } from "@/lib/dummy";
import { demoCache } from "@/components/demo/cache";

type Projects = { me: User | null; workspaces: Workspace[]; loaded: boolean };

// 화면을 옮길 때마다 레일이 깜빡이지 않게 마지막 결과를 기억해요
let liveCache: Projects | null = null;

export function useProjects(demo: boolean): Projects & { refresh: () => void } {
  const [live, setLive] = useState<Projects>(liveCache ?? { me: null, workspaces: [], loaded: false });
  const [tick, setTick] = useState(0);

  useEffect(() => {
    if (demo) return;
    let alive = true;
    (async () => {
      try {
        const [me, ws] = await Promise.all([api.GET("/auth/me"), api.GET("/workspaces")]);
        if (!alive) return;
        liveCache = { me: me.data ?? null, workspaces: ws.data ?? [], loaded: true };
        setLive(liveCache);
      } catch {
        if (alive) setLive((s) => ({ ...s, loaded: true }));
      }
    })();
    return () => {
      alive = false;
    };
  }, [demo, tick]);

  const refresh = () => setTick((t) => t + 1);
  if (demo) return { me: dummyMe, workspaces: demoCache.projects().map((p) => p.workspace), loaded: true, refresh };
  return { ...live, refresh };
}
