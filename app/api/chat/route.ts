import { NextResponse } from "next/server";
import pdf from "pdf-parse";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file uploaded" },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(
      await file.arrayBuffer()
    );

    const data = await pdf(buffer);

    return NextResponse.json({
      success: true,
      filename: file.name,
      pages: data.numpages,
      text: data.text,
    });

  } catch (err) {
    console.error(err);

    return NextResponse.json({
      success: false,
    });
  }
}