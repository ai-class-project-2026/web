import { blobatarUri } from "blobatar/uri";
import { cn } from "cn";
import { pastel, pastelHue } from "./format";

// 같은 사람 그림을 메시지마다 다시 만들지 않게 기억해 둬요
const cache = new Map<number, string>();
function face(id: number) {
  let uri = cache.get(id);
  if (!uri) cache.set(id, (uri = blobatarUri(`teamplmate:${id}`, { hue: pastelHue(id), tone: 0.5 })));
  return uri;
}

/** 사람마다 고정된 얼굴(blobatar). 색과 모양은 id로 정해져서 이름을 바꿔도 그대로예요 (동그라미 = 사람) */
export function Avatar({ id, className }: { id: number; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("block size-9 shrink-0 rounded-full bg-size-[112%] bg-center bg-no-repeat bg-origin-border", pastel(id), className)}
      style={{ backgroundImage: `url("${face(id)}")` }}
    />
  );
}
