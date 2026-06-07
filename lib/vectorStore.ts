import fs from "fs";
import path from "path";

export type VectorEntry = {
  id: string;
  text: string;
  embedding: number[];
  filename: string;
};

const STORE_PATH = path.join(process.cwd(), "uploads", "vector-store.json");

function cosineSimilarity(a: number[], b: number[]): number {
  const dot = a.reduce((sum, val, i) => sum + val * b[i], 0);
  const magA = Math.sqrt(a.reduce((sum, val) => sum + val * val, 0));
  const magB = Math.sqrt(b.reduce((sum, val) => sum + val * val, 0));
  return dot / (magA * magB);
}

export function saveVectors(entries: VectorEntry[]): void {
  const existing = loadAllVectors();
  const merged = [...existing, ...entries];
  fs.writeFileSync(STORE_PATH, JSON.stringify(merged, null, 2));
}

export function loadAllVectors(): VectorEntry[] {
  if (!fs.existsSync(STORE_PATH)) return [];
  return JSON.parse(fs.readFileSync(STORE_PATH, "utf-8"));
}

export function similaritySearch(
  queryEmbedding: number[],
  topK: number = 5
): VectorEntry[] {
  const all = loadAllVectors();

  return all
    .map((entry) => ({
      ...entry,
      score: cosineSimilarity(queryEmbedding, entry.embedding),
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, topK);
}