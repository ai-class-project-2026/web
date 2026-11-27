"use client";

// 마이페이지: 내 정보, 비밀번호 변경, 화면 설정, 로그아웃, 회원 탈퇴를 한곳에서.
//  - 왼쪽 사이드바: 각 묶음으로 바로 가는 목차
//  - 본문: [프로필 · 비밀번호 · 화면 설정 | 계정 · 회원 탈퇴]
//
// 서버에 아직 비밀번호 변경 / 회원 탈퇴 API가 없어요.
// 데모(/me/demo)에서는 실제처럼 동작하고, 진짜 서버(/me)에서는 "준비 중" 안내를 보여줘요.
// TODO(part 1): API가 생기면 아래 changePassword / deleteAccount 의 LIVE 부분만 연결하면 돼요.
//   예) PUT /auth/password { current_password, new_password },  DELETE /auth/me

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { cn } from "cn";
import { Segmented } from "@/components/ui/segmented";
import type { User } from "@/lib/api";
import { logout, useMe } from "@/lib/auth";
import { dummyMe } from "@/lib/dummy";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { IconBack, IconDisplay, IconLock, IconLogout, IconPassword, IconProfile, IconWarning, type AppIcon } from "@/components/ui/icons";
import { ErrorText, Field, Input } from "@/components/ui/field";
import { Panel, PanelPage } from "@/components/ui/panel";
import { SectionLabel, Splash, navItemClass } from "@/components/workspace/WorkspaceShell";
import { AppFrame } from "./AppFrame";
import { setPrefs, usePrefs, type TextSize } from "./preferences";
import { TopBar, TopBarDivider, TopBarTitle } from "./TopBar";
import { UserPanel } from "./UserPanel";

const SECTIONS: { id: string; label: string; icon: AppIcon }[] = [
  { id: "profile", label: "내 프로필", icon: IconProfile },
  { id: "password", label: "비밀번호 변경", icon: IconPassword },
  { id: "display", label: "화면 설정", icon: IconDisplay },
  { id: "account", label: "로그아웃 · 회원 탈퇴", icon: IconLogout },
];

export function MyPage({ demo }: { demo: boolean }) {
  return demo ? <MyPageView demo me={dummyMe} /> : <LiveMyPage />;
}

function LiveMyPage() {
  const { user: me, error, retry } = useMe();
  const router = useRouter();
  useEffect(() => {
    if (me === null) router.replace("/login?next=/me");
  }, [me, router]);
  // 서버에 연결하지 못하면 무한 로딩 대신 안내와 다시 시도 버튼을 보여줘요
  if (error) {
    return (
      <Splash tone="error">
        <p>내 정보를 불러오지 못했어요. 서버가 켜져 있는지 확인해 주세요</p>
        <div className="mt-4 flex justify-center">
          <Button variant="outline" onClick={retry}>다시 시도</Button>
        </div>
      </Splash>
    );
  }
  if (!me) return <Splash>내 정보를 불러오는 중…</Splash>;
  return <MyPageView demo={false} me={me} />;
}

function MyPageView({ demo, me }: { demo: boolean; me: User }) {
  const router = useRouter();
  return (
    <AppFrame demo={demo} active={null} title="마이페이지" sidebar={<Sidebar demo={demo} me={me} />}>
      <TopBar>
        <button
          onClick={() => (history.length > 1 ? router.back() : router.push(demo ? "/w/demo" : "/"))}
          className="flex h-8 shrink-0 items-center gap-1.5 rounded-md border border-input bg-card px-2.5 text-sm font-medium transition hover:bg-secondary"
        >
          <IconBack className="size-4" /> 돌아가기
        </button>
        {/* 휴대폰에서는 바로 위 줄에 같은 제목이 이미 있어서 숨겨요 */}
        <div className="contents max-md:hidden">
          <TopBarDivider />
          <TopBarTitle icon={IconProfile}>마이페이지</TopBarTitle>
        </div>
        {demo && <span className="ml-auto hidden text-xs text-muted-foreground sm:block">데모 모드 · 실제 계정은 바뀌지 않아요</span>}
      </TopBar>

      <PanelPage
        main={
          <>
            <ProfilePanel me={me} />
            <PasswordPanel demo={demo} />
            <DisplayPanel />
          </>
        }
        side={<AccountPanels demo={demo} />}
      />
    </AppFrame>
  );
}

function Sidebar({ demo, me }: { demo: boolean; me: User }) {
  // 방금 누른 묶음을 "선택됨"으로 보여줘요
  const [current, setCurrent] = useState("profile");
  return (
    <>
      <div className="flex h-12 shrink-0 items-center border-b border-sidebar-border pl-4 pr-10 md:pr-4">
        <p className="truncate text-base font-semibold">내 정보</p>
      </div>
      <nav className="flex min-h-0 flex-1 flex-col gap-0.5 overflow-y-auto px-2 pb-2">
        <SectionLabel>사용자 설정</SectionLabel>
        {SECTIONS.map((s) => (
          <a
            key={s.id}
            href={`#${s.id}`}
            onClick={() => setCurrent(s.id)}
            aria-current={current === s.id ? "true" : undefined}
            className={navItemClass(current === s.id)}
          >
            <s.icon className={cn("size-5 shrink-0", current === s.id ? "text-primary" : "text-muted-foreground")} />
            {s.label}
          </a>
        ))}
      </nav>
      <UserPanel me={me} demo={demo} />
    </>
  );
}

function ProfilePanel({ me }: { me: User }) {
  return (
    <div id="profile" className="scroll-mt-4">
      <Panel title="내 프로필">
        <div className="flex items-center gap-4">
          <Avatar id={me.id} className="size-20" />
          <dl className="min-w-0 flex-1">
            <dt className="sr-only">이름</dt>
            <dd className="truncate text-2xl font-bold">{me.name}</dd>
            <dt className="sr-only">이메일</dt>
            <dd className="mt-1 truncate text-sm text-muted-foreground">{me.email}</dd>
          </dl>
        </div>
      </Panel>
    </div>
  );
}

function PasswordPanel({ demo }: { demo: boolean }) {
  const [f, setF] = useState({ current: "", next: "", confirm: "" });
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const set = (k: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement>) => setF({ ...f, [k]: e.target.value });

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setDone(false);
    if (f.next.length < 8) return setError("새 비밀번호는 8자 이상이어야 해요");
    if (f.next !== f.confirm) return setError("새 비밀번호 두 칸이 서로 달라요");
    if (f.next === f.current) return setError("지금 비밀번호와 다른 비밀번호를 써 주세요");
    if (!demo) {
      // LIVE: 서버 API가 생기면 여기서 호출 (TODO(part 1))
      return setError("비밀번호 변경은 서버에 준비 중이에요");
    }
    setError("");
    setF({ current: "", next: "", confirm: "" });
    setDone(true);
  };

  return (
    <div id="password" className="@container scroll-mt-4">
      <Panel title="비밀번호 변경">
        {!demo && (
          <p className="mb-3 flex items-center gap-2 rounded-md border bg-muted px-3 py-2.5 text-sm text-muted-foreground">
            <IconLock className="size-4 shrink-0" />
            서버(파트 1)에 비밀번호 변경 기능이 준비되면 바로 쓸 수 있어요.
          </p>
        )}
        {/* 화면 너비가 아니라 이 칸의 너비를 보고 세 칸으로 나눠요 (옆에 계정 칸이 붙으면 좁아져요) */}
        <form onSubmit={changePassword} className="grid gap-3 @xl:grid-cols-3">
          <Field label="지금 비밀번호"><Input type="password" autoComplete="current-password" value={f.current} onChange={set("current")} required /></Field>
          <Field label="새 비밀번호" hint="8자 이상"><Input type="password" autoComplete="new-password" value={f.next} onChange={set("next")} required /></Field>
          <Field label="새 비밀번호 확인"><Input type="password" autoComplete="new-password" value={f.confirm} onChange={set("confirm")} required /></Field>
          <div className="flex items-center gap-3 @xl:col-span-3">
            <Button type="submit">비밀번호 바꾸기</Button>
            {done && <span className="text-sm text-primary">비밀번호를 바꿨어요</span>}
          </div>
          {error && <div className="@xl:col-span-3"><ErrorText>{error}</ErrorText></div>}
        </form>
      </Panel>
    </div>
  );
}

function DisplayPanel() {
  const prefs = usePrefs();
  return (
    <div id="display" className="scroll-mt-4">
      <Panel title="화면 설정" desc="이 브라우저에만 저장돼요.">
        <div className="flex flex-col divide-y">
          <Row label="글자 크기" sub="크게: 글자와 버튼을 모두 12% 키워요">
            <Segmented<TextSize>
              value={prefs.text}
              onChange={(text) => setPrefs({ text })}
              options={[
                { value: "normal", label: "보통" },
                { value: "large", label: "크게" },
              ]}
            />
          </Row>
        </div>
      </Panel>
    </div>
  );
}

function AccountPanels({ demo }: { demo: boolean }) {
  const router = useRouter();
  const [confirmText, setConfirmText] = useState("");
  const [error, setError] = useState("");

  const signOut = () => {
    if (!demo) logout();
    router.replace("/login");
  };

  const deleteAccount = () => {
    if (!demo) {
      // LIVE: 서버 API가 생기면 여기서 호출하고 성공하면 logout() (TODO(part 1))
      return setError("회원 탈퇴는 서버에 준비 중이에요");
    }
    router.replace("/login");
  };

  return (
    <div id="account" className="flex scroll-mt-4 flex-col gap-3">
      <Panel title="계정">
        <Button variant="outline" className="w-full" onClick={signOut}>
          <IconLogout /> 로그아웃
        </Button>
      </Panel>

      <Panel title={<span className="flex items-center gap-2"><IconWarning className="size-4" />회원 탈퇴</span>} danger desc="모든 프로젝트에서 나가고 계정이 지워져요. 되돌릴 수 없어요.">
        <Field label="확인을 위해 ‘탈퇴’라고 입력해 주세요">
          <Input value={confirmText} onChange={(e) => setConfirmText(e.target.value)} placeholder="탈퇴" />
        </Field>
        <Button
          variant="destructive"
          className="mt-3 w-full"
          disabled={confirmText.trim() !== "탈퇴"}
          onClick={deleteAccount}
        >
          <IconWarning /> 회원 탈퇴
        </Button>
        {error && <div className="mt-2"><ErrorText>{error}</ErrorText></div>}
      </Panel>
    </div>
  );
}

function Row({ label, sub, children }: { label: string; sub?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
      <div className="min-w-0 flex-1 basis-40">
        <p className="text-sm font-medium">{label}</p>
        {sub && <p className="text-xs text-muted-foreground">{sub}</p>}
      </div>
      {children}
    </div>
  );
}
