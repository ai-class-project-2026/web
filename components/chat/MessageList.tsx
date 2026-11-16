import type { Message } from "@/lib/api";
import { MaskedMessage } from "./MaskedMessage";

// TODO(part 2): 말풍선, 보낸 사람/시간, 맨 위로 스크롤하면 onLoadOlder(), 새 메시지 오면 아래로 스크롤.

export function MessageList({ messages, hasMore, onLoadOlder }: {
  messages: Message[];
  hasMore: boolean;
  onLoadOlder: () => void;
}) {
  return (
    <ul className="flex-1 overflow-y-auto p-4">
      {hasMore && <button onClick={onLoadOlder}>이전 메시지</button>}
      {messages.map((m) => (
        <li key={m.id}>
          <b>{m.user_name}</b> <MaskedMessage message={m} />
        </li>
      ))}
    </ul>
  );
}
