/**
 * 프로젝트 직렬화 / 역직렬화 — JSON 기반 저장/불러오기
 */
import type { Project } from "@/types";

/** 프로젝트를 JSON 문자열로 직렬화 (File 객체 제외) */
export function serializeProject(project: Project): string {
  const clean = {
    ...project,
    mediaBin: project.mediaBin.map((m) => ({
      ...m,
      file: null, // File 객체는 직렬화 불가
      url: "", // blob URL도 직렬화 불가
    })),
    updatedAt: new Date().toISOString(),
  };
  return JSON.stringify(clean, null, 2);
}

/** JSON 문자열을 Project로 역직렬화 */
export function deserializeProject(json: string): Project {
  return JSON.parse(json) as Project;
}

/** 프로젝트를 파일로 다운로드 */
export function downloadProject(project: Project): void {
  const json = serializeProject(project);
  const blob = new Blob([json], { type: "application/json" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${project.name || "untitled"}.vep.json`;
  a.click();
  URL.revokeObjectURL(url);
}

/** 파일에서 프로젝트 불러오기 */
export function loadProjectFromFile(): Promise<Project> {
  return new Promise((resolve, reject) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".json,.vep.json";
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) return reject(new Error("No file selected"));
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const project = deserializeProject(reader.result as string);
          resolve(project);
        } catch (e) {
          reject(e);
        }
      };
      reader.readAsText(file);
    };
    input.click();
  });
}

/** IndexedDB에 자동 저장 */
const DB_NAME = "video-editor";
const STORE_NAME = "projects";

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1);
    req.onupgradeneeded = () => {
      req.result.createObjectStore(STORE_NAME, { keyPath: "id" });
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function autoSave(project: Project): Promise<void> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readwrite");
    const store = tx.objectStore(STORE_NAME);
    const clean = JSON.parse(serializeProject(project));
    store.put(clean);
  } catch (e) {
    console.warn("Auto-save failed:", e);
  }
}

export async function loadAutoSave(projectId: string): Promise<Project | null> {
  try {
    const db = await openDB();
    const tx = db.transaction(STORE_NAME, "readonly");
    const store = tx.objectStore(STORE_NAME);
    return new Promise((resolve) => {
      const req = store.get(projectId);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}
