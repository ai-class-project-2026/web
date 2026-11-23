import { Suspense } from "react";
import { WorkspaceProvider } from "@/components/workspace/WorkspaceProvider";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

// 왼쪽 채널 목록 + 메뉴는 WorkspaceShell, 데이터(워크스페이스·채널·일정·할 일)는 WorkspaceProvider가 맡아요.
// 오른쪽 "다가오는 일정"은 채팅 화면(c/[channelId]/page.tsx)에 있어요.
// params는 요청 때에야 알 수 있으니 Suspense 안에서 읽어요 (Cache Components 규칙).

export default function WorkspaceLayout({ children, params }: LayoutProps<"/w/[workspaceId]">) {
  return (
    <Suspense>
      <Inner params={params}>{children}</Inner>
    </Suspense>
  );
}

async function Inner({ children, params }: Pick<LayoutProps<"/w/[workspaceId]">, "children" | "params">) {
  const { workspaceId } = await params;
  return (
    <WorkspaceProvider workspaceId={workspaceId}>
      <WorkspaceShell>{children}</WorkspaceShell>
    </WorkspaceProvider>
  );
}
