import { NextResponse } from "next/server";
import { loadAllVectors, saveVectorsRaw } from "@/lib/vectorStore";

export async function GET() {
  const vectors = loadAllVectors();

  const files = [...new Set(vectors.map((v) => v.filename))].map((filename) => ({
    filename,
    chunks: vectors.filter((v) => v.filename === filename).length,
  }));

  return NextResponse.json({ files });
}

export async function DELETE(req: Request) {
  const { filename } = await req.json();

  const vectors = loadAllVectors();
  const filtered = vectors.filter((v) => v.filename !== filename);
  saveVectorsRaw(filtered);

  return NextResponse.json({ success: true });
}