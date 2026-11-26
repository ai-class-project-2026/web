import Beam from "boring-avatars";
import { cn } from "cn";

// 앱의 여섯 가지 연한 색(globals.css의 --lavender … --butter)을 조금 진하게 한 색
const COLORS = ["#bcb3fa", "#76d3b4", "#f0ad7f", "#f3a3bb", "#7ac8f5", "#d2bd70"];

/** 사람마다 고정된 얼굴(boring-avatars의 beam). 색과 표정은 id로 정해져서 이름을 바꿔도 그대로예요 (동그라미 = 사람) */
export function Avatar({ id, className }: { id: number; className?: string }) {
  return <Beam name={`harmony:${id}`} variant="beam" colors={COLORS} aria-hidden className={cn("block size-9 shrink-0 rounded-full", className)} />;
}
