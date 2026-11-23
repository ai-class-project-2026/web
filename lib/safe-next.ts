/**
 * 로그인 뒤에 갈 주소(next)를 안전하게 골라요.
 * 브라우저는 "/\host", "/<탭>/host"처럼 줄바꿈·탭·역슬래시가 섞인 주소를 다른 사이트로 읽어요.
 * 그래서 문자열 모양을 보지 않고, 브라우저와 똑같이 해석해서 "우리 사이트"일 때만 써요.
 */
export function safeNext(next: string | null | undefined, origin: string): string {
  if (!next) return "/";
  try {
    const u = new URL(next, origin);
    if (u.origin !== origin) return "/";
    const out = u.pathname + u.search + u.hash;
    // "/.//host"처럼 점 경로가 정리되면 "//host"가 될 수 있어요. 한 개의 "/"로 시작하는 경로만 허용해요.
    if (!out.startsWith("/") || out.startsWith("//") || out.startsWith("/\\")) return "/";
    return out;
  } catch {
    return "/";
  }
}
