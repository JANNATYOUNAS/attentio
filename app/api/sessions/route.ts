import { NextResponse } from "next/server";
import fs from "fs";
import path from "path";
import { randomUUID } from "crypto";

type Message = {
  role: "user" | "assistant";
  content: string;
  responseTime?: number;
};

type Session = {
  id: string;
  title: string;
  messages: Message[];
  createdAt: string;
};

const SESSIONS_PATH = path.join(process.cwd(), "uploads", "sessions.json");

function loadSessions(): Session[] {
  if (!fs.existsSync(SESSIONS_PATH)) return [];
  return JSON.parse(fs.readFileSync(SESSIONS_PATH, "utf-8"));
}

function saveSessions(sessions: Session[]): void {
  fs.writeFileSync(SESSIONS_PATH, JSON.stringify(sessions, null, 2));
}

export async function GET() {
  const sessions = loadSessions();
  return NextResponse.json({ sessions });
}

export async function POST(req: Request) {
  const { id, messages } = await req.json();
  const sessions = loadSessions();
  const title =
    messages.find((m: Message) => m.role === "user")?.content.slice(0, 50) ||
    "New Chat";
  const existing = sessions.findIndex((s) => s.id === id);
  if (existing !== -1) {
    sessions[existing].messages = messages;
  } else {
    sessions.unshift({
      id: id || randomUUID(),
      title,
      messages,
      createdAt: new Date().toISOString(),
    });
  }
  saveSessions(sessions);
  return NextResponse.json({ success: true });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  const sessions = loadSessions().filter((s) => s.id !== id);
  saveSessions(sessions);
  return NextResponse.json({ success: true });
}

export async function PATCH(req: Request) {
  const { id, title } = await req.json();
  const sessions = loadSessions();
  const index = sessions.findIndex((s) => s.id === id);
  if (index !== -1) {
    sessions[index].title = title;
    saveSessions(sessions);
  }
  return NextResponse.json({ success: true });
}