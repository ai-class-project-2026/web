"use client";

// 캘린더·할 일·설정처럼 채팅 밖의 큰 화면 맨 위에 두는 "← 채팅으로 돌아가기" 버튼.
// 마지막으로 보던 채널을 기억해 두었다가 그리로 돌려보내요. (기억이 없으면 첫 번째 채널)

import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useWorkspace } from "./WorkspaceProvider";

// 프로젝트 주소(base)마다 마지막으로 본 채널 id. 새로고침하면 초기화돼도 괜찮은 정보라 메모리에만 둬요.
const lastChannel = new Map<string, number>();

/** 채팅 화면이 열릴 때 불러서 "지금 이 채널을 보고 있어요"라고 기억시켜요 */
export function rememberChannel(base: string, channelId: number) {
  lastChannel.set(base, channelId);
}

export function BackToChat() {
  const ws = useWorkspace();
  const remembered = ws.channels.find((c) => c.id === lastChannel.get(ws.base));
  const channel = remembered ?? ws.channels[0];
  const href = channel ? `${ws.base}/c/${channel.id}` : ws.base;

  return (
    <Link
      href={href}
      className="flex w-fit items-center gap-1.5 rounded-lg border bg-card px-3 py-2 text-sm font-medium text-foreground shadow-xs transition hover:bg-secondary hover:text-secondary-foreground"
    >
      <ArrowLeft className="size-4" />
      {channel ? `#${channel.name} 채팅으로 돌아가기` : "채팅으로 돌아가기"}
    </Link>
  );
}
