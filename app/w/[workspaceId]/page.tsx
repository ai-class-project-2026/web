"use client";

// /w/3 처럼 채널 없이 들어오면 첫 번째 채널로 보내요.

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Splash } from "@/components/workspace/WorkspaceShell";
import { useWorkspace } from "@/components/workspace/WorkspaceProvider";

export default function WorkspaceHome() {
  const { channels, base } = useWorkspace();
  const router = useRouter();
  const first = channels[0];

  useEffect(() => {
    if (first) router.replace(`${base}/c/${first.id}`);
  }, [first, base, router]);

  return <Splash>{first ? "채널로 이동하는 중…" : "아직 채널이 없어요. 왼쪽 '채널 추가' 버튼으로 만들어 보세요!"}</Splash>;
}
