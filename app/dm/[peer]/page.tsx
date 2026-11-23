"use client";

// /dm/3 → 3번 사람과 1:1 대화 (진짜 서버)
// /dm/demo → 데모 첫 화면, /dm/demo-2 → 데모에서 2번(서연)과 대화

import { useParams } from "next/navigation";
import { DMConversation } from "@/components/dm/DMConversation";
import { DMHome } from "@/components/dm/DMHome";
import { Splash } from "@/components/workspace/WorkspaceShell";

export default function DMPeerPage() {
  const { peer } = useParams<{ peer: string }>();
  if (peer === "demo") return <DMHome />;
  const id = Number(peer.replace(/^demo-/, ""));
  if (!Number.isInteger(id)) return <Splash tone="empty">잘못된 주소예요</Splash>;
  return <DMConversation key={id} peerId={id} />;
}
