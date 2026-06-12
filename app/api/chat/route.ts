import { NextResponse } from "next/server";
import Groq from "groq-sdk";
import { embedText } from "@/lib/embeddings";
import { similaritySearch, loadAllVectors } from "@/lib/vectorStore";
import { tavily } from "@tavily/core";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
const tavilyClient = tavily({ apiKey: process.env.TAVILY_API_KEY! });

type Message = {
  role: "user" | "assistant";
  content: string;
};

const RELEVANCE_THRESHOLD = 0.4;

export async function POST(req: Request) {
  try {
    const { message, history = [] }: { message: string; history: Message[] } =
      await req.json();

    // ✅ check for conversational messages FIRST — skip RAG entirely
    const conversational = [
      "hi", "hello", "hey", "good morning", "good evening", "good afternoon",
      "salam", "assalam", "how are you", "what can you do", "who are you",
      "i need help", "i need help regarding an assignment", "can you help me",
      "help me", "what is your name",
    ];

    const isConversational = conversational.some((g) =>
      message.trim().toLowerCase().includes(g)
    );

    if (isConversational) {
      const res = await groq.chat.completions.create({
        model: "llama-3.1-8b-instant",
        max_tokens: 150,
        messages: [
          {
            role: "system",
            content: `You are Attentio-AI, a friendly student support assistant.
Respond naturally and helpfully to casual conversation.
Keep responses short and friendly.`,
          },
          ...history,
          { role: "user", content: message },
        ],
      });
      return NextResponse.json({
        reply: res.choices[0].message.content,
        source: "general",
      });
    }

    let context = "";
    let source = "";

    const allVectors = loadAllVectors();

    if (allVectors.length > 0) {
      const [queryEmbedding] = await embedText([message]);
      const relevantChunks = similaritySearch(queryEmbedding, 5);

      const goodChunks = relevantChunks.filter((c) => c.score >= RELEVANCE_THRESHOLD);

      if (goodChunks.length > 0) {
        // STATIC RAG — relevant docs found
        context = goodChunks.map((c, i) => `[${i + 1}] ${c.text}`).join("\n\n");
        source = "uploaded documents";
      } else {
        // DYNAMIC RAG — docs exist but not relevant, search web
        const searchResult = await tavilyClient.search(message, {
          maxResults: 3,
          searchDepth: "basic",
        });
        context = searchResult.results.length > 0
          ? searchResult.results
              .map((r, i) => `[${i + 1}] Source: ${r.url}\n${r.content}`)
              .join("\n\n")
          : "No web results found.";
        source = "web search";
      }
    } else {
      // DYNAMIC RAG — no docs uploaded at all, search web
      const searchResult = await tavilyClient.search(message, {
        maxResults: 3,
        searchDepth: "basic",
      });
      context = searchResult.results.length > 0
        ? searchResult.results
            .map((r, i) => `[${i + 1}] Source: ${r.url}\n${r.content}`)
            .join("\n\n")
        : "No web results found.";
      source = "web search";
    }

    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      max_tokens: 512,
      messages: [
        {
          role: "system",
          content: `You are Attentio-AI, a friendly student support assistant.
For casual conversation, greet naturally and offer help.
Answer questions using the provided context (from ${source}).
If the context doesn't help, answer from your general knowledge.
Keep answers concise — 3 to 5 sentences unless more detail is needed.
Use markdown formatting for headings and lists when helpful.

CONTEXT:
${context}`,
        },
        ...history,
        { role: "user", content: message },
      ],
    });

    return NextResponse.json({
      reply: completion.choices[0].message.content,
      source,
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Chat failed" }, { status: 500 });
  }
}