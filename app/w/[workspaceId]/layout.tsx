import { WorkspaceProvider } from "@/components/workspace/WorkspaceProvider";
import { WorkspaceShell } from "@/components/workspace/WorkspaceShell";

// 왼쪽 채널 목록 + 메뉴는 WorkspaceShell, 데이터(워크스페이스·채널·일정·할 일)는 WorkspaceProvider가 맡아요.
// 오른쪽 "다가오는 일정"은 채팅 화면(c/[channelId]/page.tsx)에 있어요.

export default async function WorkspaceLayout({ children, params }: LayoutProps<"/w/[workspaceId]">) {
  const { workspaceId } = await params;
  return (
    <WorkspaceProvider workspaceId={workspaceId}>
      <WorkspaceShell>{children}</WorkspaceShell>
    </WorkspaceProvider>
  );
}
