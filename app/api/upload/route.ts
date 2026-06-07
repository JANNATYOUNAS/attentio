import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { extractPdfText } from "@/lib/pdf";
import { chunkText } from "@/lib/chunker";
import { embedText } from "@/lib/embeddings";
import { saveVectors, VectorEntry } from "@/lib/vectorStore";
import { randomUUID } from "crypto";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file uploaded" }, { status: 400 });
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    const uploadDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir);

    const filePath = path.join(uploadDir, file.name);
    fs.writeFileSync(filePath, buffer);

    // 1. Extract text
    const text = await extractPdfText(filePath);

    // 2. Chunk
    const chunks = chunkText(text);

    // 3. Embed all chunks
    const embeddings = await embedText(chunks);

    // 4. Save to vector store
    const entries: VectorEntry[] = chunks.map((chunk, i) => ({
      id: randomUUID(),
      text: chunk,
      embedding: embeddings[i],
      filename: file.name,
    }));

    saveVectors(entries);

    return NextResponse.json({
      success: true,
      filename: file.name,
      chunks: chunks.length,
      text: text.substring(0, 500),
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 });
  }
}