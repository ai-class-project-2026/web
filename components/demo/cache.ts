// 데모 모드에서 바꾼 내용(보낸 메시지, 추가한 일정 등)을 다른 프로젝트·DM으로 옮겨 다녀도 유지하려고
// 화면 밖(모듈)에 잠깐 보관해요. 새로고침하면 처음 데이터로 돌아가요.

import type { Message } from "@/lib/api";
import { demoProjects, dummyDMs, type DemoProject } from "@/lib/dummy";

const projects = new Map<number, DemoProject>();
const dms = new Map<number, Message[]>(Object.entries(dummyDMs).map(([k, v]) => [Number(k), v]));

export const demoCache = {
  project(id: number): DemoProject | undefined {
    return projects.get(id) ?? demoProjects.find((p) => p.workspace.id === id);
  },
  saveProject(p: DemoProject) {
    projects.set(p.workspace.id, p);
  },
  projects(): DemoProject[] {
    return demoProjects.map((p) => projects.get(p.workspace.id) ?? p);
  },
  dm(peerId: number): Message[] {
    return dms.get(peerId) ?? [];
  },
  saveDm(peerId: number, messages: Message[]) {
    dms.set(peerId, messages);
  },
  dmPeers(): number[] {
    return [...dms.entries()].filter(([, ms]) => ms.length > 0).map(([id]) => id);
  },
};
