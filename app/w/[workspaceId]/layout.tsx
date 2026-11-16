import Link from "next/link";

// TODO(part 2): 왼쪽 채널 목록 (GET/POST /workspaces/{id}/channels), 오른쪽 다가오는 일정.

export default async function WorkspaceLayout({ children, params }: LayoutProps<"/w/[workspaceId]">) {
  const { workspaceId } = await params;
  const base = `/w/${workspaceId}`;
  return (
    <div className="flex flex-1">
      <nav className="flex w-48 flex-col gap-2 border-r p-4">
        <Link href={`${base}/c/1`}># 일반</Link>
        <Link href={`${base}/calendar`}>캘린더</Link>
        <Link href={`${base}/todos`}>할 일</Link>
        <Link href={`${base}/settings`}>설정</Link>
      </nav>
      <div className="flex flex-1 flex-col">{children}</div>
    </div>
  );
}
