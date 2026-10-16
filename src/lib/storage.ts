import { randomUUID } from "crypto";
import { appendFile, mkdir, readdir, readFile, writeFile } from "fs/promises";
import path from "path";

export const DATA_DIR = process.env.DATA_DIR || "./data";

export type StagedMeta = {
  id: string;
  originalName: string;
  ext: string;
  uploaderId: string;
  uploadedAt: string;
  status: "STAGED" | "INGESTED";
};

async function ensureDir() {
  await mkdir(DATA_DIR, { recursive: true });
}

export async function saveStaged(
  data: Uint8Array,
  info: { originalName: string; ext: string; uploaderId: string }
): Promise<StagedMeta> {
  await ensureDir();
  const id = randomUUID();
  await writeFile(path.join(DATA_DIR, `${id}${info.ext}`), Buffer.from(data));
  const meta: StagedMeta = {
    id,
    originalName: info.originalName,
    ext: info.ext,
    uploaderId: info.uploaderId,
    uploadedAt: new Date().toISOString(),
    status: "STAGED",
  };
  await writeFile(path.join(DATA_DIR, `${id}.json`), JSON.stringify(meta, null, 2));
  return meta;
}

export async function listStaged(): Promise<StagedMeta[]> {
  const names = await readdir(DATA_DIR).catch(() => []);
  const metas: StagedMeta[] = [];
  for (const name of names.filter((n) => n.endsWith(".json"))) {
    try {
      const meta = JSON.parse(await readFile(path.join(DATA_DIR, name), "utf8"));
      if (meta?.status === "STAGED") metas.push(meta);
    } catch {
      // skip unreadable sidecar files
    }
  }
  return metas;
}

export async function markIngested(id: string): Promise<StagedMeta> {
  const metaPath = path.join(DATA_DIR, `${id}.json`);
  const meta = JSON.parse(await readFile(metaPath, "utf8"));
  meta.status = "INGESTED";
  await writeFile(metaPath, JSON.stringify(meta, null, 2));
  return meta;
}

export async function appendKnowledge(text: string): Promise<void> {
  await ensureDir();
  await appendFile(path.join(DATA_DIR, "knowledge.md"), text);
}
