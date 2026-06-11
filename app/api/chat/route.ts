import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { embedText } from "@/lib/embeddings";
import { similaritySearch } from "@/lib/vectorStore";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

type Message = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(req: Request) {
  try {
    //  now accepts history array alongside current message
    const { message, history = [] }: { message: string; history: Message[] } =
      await req.json();

    // 1. Embed the user's question
    const [queryEmbedding] = await embedText([message]);

    // 2. Find relevant chunks
    const relevantChunks = similaritySearch(queryEmbedding, 5);

    // 3. Build context string
    const context =
      relevantChunks.length > 0
        ? relevantChunks.map((c, i) => `[${i + 1}] ${c.text}`).join("\n\n")
        : "No document context available.";

    // 4. Send to Groq with RAG context + full history
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: `You are Attentio-AI, a student support assistant.
Answer questions using the provided document context when relevant.
If the context doesn't help, answer from your general knowledge.
Keep answers concise and to the point — 3 to 5 sentences unless the question requires more detail.
Use markdown formatting for headings and lists when helpful.

DOCUMENT CONTEXT:
${context}`,
        },
        ...history, //  all previous messages
        { role: "user", content: message }, //  current message
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