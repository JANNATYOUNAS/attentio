export function chunkText(
  text: string,
  chunkSize: number = 150,
  overlap: number = 30
): string[] {
  const words = text.split(/\s+/);
  const chunks: string[] = [];

  let i = 0;
  while (i < words.length) {
    const chunk = words.slice(i, i + chunkSize).join(" ");
    if (chunk.trim()) chunks.push(chunk);
    i += chunkSize - overlap;
  }

  return chunks;
}