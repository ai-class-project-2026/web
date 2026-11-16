"use client";

// TODO(part 2): 워크스페이스 이름 + "대화 분석 동의" 체크박스 (미성년자 대상이라 필수).
//   const { data } = await api.POST("/workspaces", { body: { name, ai_schedule_on: 동의 } });
//   → `/w/${data.id}`로 이동

export default function OnboardingPage() {
  return <main className="p-8">워크스페이스 만들기</main>;
}
