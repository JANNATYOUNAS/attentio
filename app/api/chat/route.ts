import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { embedText } from "@/lib/embeddings";
import { similaritySearch } from "@/lib/vectorStore";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 1. Embed the user's question
    const [queryEmbedding] = await embedText([message]);

    // 2. Find relevant chunks
    const relevantChunks = similaritySearch(queryEmbedding, 5);

    // 3. Build context string
    const context = relevantChunks.length > 0
      ? relevantChunks.map((c, i) => `[${i + 1}] ${c.text}`).join("\n\n")
      : "No document context available.";

    // 4. Send to Groq with RAG context
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content: `You are Attentio-AI, a student support assistant. 
Answer questions using the provided document context when relevant.
If the context doesn't help, answer from your general knowledge.

DOCUMENT CONTEXT:
${context}`,
        },
        { role: "user", content: message },
      ],
    });

    return NextResponse.json({
      reply: completion.choices[0].message.content,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}