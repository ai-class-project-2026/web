import Link from "next/link";

// TODO(part 2): 로그인 안 했으면 /login, 워크스페이스가 없으면 /onboarding, 있으면 /w/<id>로 보내기.
// 지금은 개발용으로 모든 화면 링크를 모아 뒀어요.
const screens = [
  ["/login", "로그인/가입"],
  ["/onboarding", "온보딩"],
  ["/invite/demo", "초대 링크"],
  ["/w/1/c/1", "채팅"],
  ["/w/1/calendar", "캘린더"],
  ["/w/1/todos", "할 일"],
  ["/w/1/settings", "설정"],
  ["/dashboard", "AI 대시보드"],
];

export default function Home() {
  return (
    <main className="p-8">
      <h1 className="text-2xl font-semibold">팀플메이트</h1>
      <ul className="mt-4 list-disc pl-6">
        {screens.map(([href, label]) => (
          <li key={href}>
            <Link href={href} className="underline">{label}</Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
