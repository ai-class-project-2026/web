// 아이콘은 전부 이 파일에서만 가져와요. (라이브러리를 다른 파일에서 직접 import 하지 않기)
// 한 가지 뜻 = 한 가지 아이콘. 굵기는 기본 regular, 선택된 상태에서만 fill.
// "/ssr" 주소로 가져오면 서버 컴포넌트와 클라이언트 컴포넌트 모두에서 쓸 수 있어요.

import {
  ArrowLeft, Bell, CalendarBlank, CalendarPlus, CaretRight, ChartBar, ChatCircle, Check, CheckSquare,
  CircleNotch, Clock, Crown, EyeSlash, Flag, GearSix, Hash, Highlighter, Key, List, LinkSimple, Lock, MagnifyingGlass,
  MapPin, Monitor, Note, PaperPlaneRight, PencilSimple, Plus, SignOut, Trash, UserCircle, Users, Warning, X,
} from "@phosphor-icons/react/ssr";
import type { IconProps as IconBaseProps } from "@phosphor-icons/react";
import { cn } from "cn";

export type IconProps = {
  className?: string;
  weight?: "regular" | "fill";
  "aria-label"?: string;
};

/** Phosphor 글리프를 우리 규칙(className, weight, aria-hidden)에 맞게 감싸요 */
function make(Glyph: React.ComponentType<IconBaseProps>, extra?: string) {
  return function AppIcon({ className, weight = "regular", "aria-label": label }: IconProps) {
    return (
      <Glyph
        weight={weight}
        className={cn(extra, className)}
        aria-hidden={label ? undefined : true}
        aria-label={label}
        role={label ? "img" : undefined}
      />
    );
  };
}

/** AI = 형광펜 (반짝이 대신, "AI가 찾은 것은 노란 줄"과 같은 뜻) */
export const IconAI = make(Highlighter);
export const IconCalendar = make(CalendarBlank);
export const IconEventAdd = make(CalendarPlus);
export const IconTodo = make(CheckSquare);
export const IconChannel = make(Hash);
export const IconChat = make(ChatCircle);
export const IconMembers = make(Users);
export const IconSettings = make(GearSix);
export const IconProfile = make(UserCircle);
export const IconLink = make(LinkSimple);
export const IconCheck = make(Check);
export const IconAdd = make(Plus);
export const IconClose = make(X);
export const IconBack = make(ArrowLeft);
export const IconNext = make(CaretRight);
export const IconSend = make(PaperPlaneRight);
export const IconEdit = make(PencilSimple);
export const IconDelete = make(Trash);
export const IconTime = make(Clock);
export const IconNote = make(Note);
export const IconPlace = make(MapPin);
export const IconOwner = make(Crown);
export const IconSearch = make(MagnifyingGlass);
export const IconMenu = make(List);
export const IconDashboard = make(ChartBar);
export const IconReport = make(Flag);
export const IconHidden = make(EyeSlash);
export const IconWarning = make(Warning);
export const IconNotify = make(Bell);
export const IconLock = make(Lock);
export const IconPassword = make(Key);
export const IconDisplay = make(Monitor);
export const IconLogout = make(SignOut);
export const IconLoading = make(CircleNotch, "animate-spin");

/** NavItem·TopBarTitle 같은 곳에서 아이콘을 prop으로 받을 때 쓰는 타입 */
export type AppIcon = React.ComponentType<{ className?: string; weight?: "regular" | "fill" }>;
