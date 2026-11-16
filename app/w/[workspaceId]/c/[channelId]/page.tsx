"use client";

import { useParams } from "next/navigation";
import { MessageInput } from "@/components/chat/MessageInput";
import { MessageList } from "@/components/chat/MessageList";
import { ScheduleCard } from "@/components/schedule-card/ScheduleCard";
import { useMessages, useSuggestions } from "@/lib/ws";

// 서버 없이 화면만 만들 때는 messages/suggestions 대신 "@/lib/dummy"의 값을 넣어 보세요.

export default function ChatPage() {
  const channelId = Number(useParams<{ channelId: string }>().channelId);
  const { messages, send, loadOlder, hasMore } = useMessages(channelId);
  const { suggestions, act } = useSuggestions(channelId);

  return (
    <main className="flex flex-1 flex-col">
      <MessageList messages={messages} hasMore={hasMore} onLoadOlder={loadOlder} />
      {suggestions.map((s) => (
        <ScheduleCard key={s.id} suggestion={s} onAct={(action, edited) => act(s.id, action, edited)} />
      ))}
      <MessageInput onSend={send} />
    </main>
  );
}
