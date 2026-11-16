import type { Message } from "@/lib/api";

// TODO(part 2): 욕설 가림 (기획서 파트 2 가이드 "욕설 가림 메시지").
//   import { splitSpans } from "@/lib/mask";
//   splitSpans(message.text, message.profanity_spans) → [{ text, hidden }] 조각. hidden은 ●●로, [보기] 누르면 원문.
//   is_profane인데 profanity_spans가 비어 있으면 전체를 가림. 워크스페이스 filter_mode(mask/warn/notify_admin)에 따라 다르게.
//   신고 버튼: api.POST("/reports", { body: { message_id, type: "false_positive" | "missed" } })

export function MaskedMessage({ message }: { message: Message }) {
  return <span>{message.text}</span>;
}
