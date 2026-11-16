import type { EventInput, Suggestion } from "@/lib/api";

type Action = "added" | "edited" | "ignored";

// TODO(part 2): 카드 디자인 + 버튼.
//   kind "add": [캘린더에 추가] → onAct("added"), [무시] → onAct("ignored"), [수정] → 폼에서 고친 값으로 onAct("edited", 고친값)
//   kind "update": "기존 일정을 이렇게 바꿀까요?" / kind "cancel": "10/15 회의를 취소할까요?"

export function ScheduleCard({ suggestion, onAct }: {
  suggestion: Suggestion;
  onAct: (action: Action, edited?: EventInput) => void;
}) {
  const { kind, event } = suggestion.payload;
  return (
    <div className="m-4 rounded border p-4">
      [{kind}] {event.date} {event.start ?? event.time_text} {event.title}
      <button onClick={() => onAct("added")}>추가</button>
      <button onClick={() => onAct("ignored")}>무시</button>
    </div>
  );
}
