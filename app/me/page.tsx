import { MyPage } from "@/components/app/MyPage";

// 마이페이지 (진짜 서버). 데모는 /me/demo
export default function Page() {
  return <MyPage demo={false} />;
}
