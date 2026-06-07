"use client";

import { FileText, MessageSquare, Trash2 } from "lucide-react";
import { forwardRef, useEffect, useImperativeHandle, useState } from "react";

type DocFile = { filename: string; chunks: number };
type Message = { role: "user" | "assistant"; content: string; responseTime?: number };
type Session = { id: string; title: string; messages: Message[]; createdAt: string };

type SidebarHandle = { refresh: () => void };
type SidebarProps = {
  onLoadSession: (id: string, messages: Message[]) => void;
  onNewChat: () => void;
};

const Sidebar = forwardRef<SidebarHandle, SidebarProps>(function Sidebar(
  { onLoadSession, onNewChat },
  ref
) {
  const [docs, setDocs] = useState<DocFile[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);

  async function fetchDocs() {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocs(data.files);
    } catch {
      console.error("Failed to fetch documents");
    }
  }

  async function fetchSessions() {
    try {
      const res = await fetch("/api/sessions");
      const data = await res.json();
      setSessions(data.sessions);
    } catch {
      console.error("Failed to fetch sessions");
    }
  }

  async function deleteDoc(filename: string) {
    await fetch("/api/documents", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename }),
    });
    fetchDocs();
  }

  async function deleteSession(id: string) {
    await fetch("/api/sessions", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id }),
    });
    fetchSessions();
  }

  useImperativeHandle(ref, () => ({
    refresh: () => {
      fetchDocs();
      fetchSessions();
    },
  }));

  useEffect(() => {
    fetchDocs();
    fetchSessions();
  }, []);

  return (
    <div className="w-64 bg-black text-white p-4 flex flex-col gap-6 overflow-y-auto">
      <h1 className="text-2xl font-bold">Attentio-AI</h1>

      <button
        onClick={onNewChat}
        className="w-full border border-gray-700 rounded-lg p-3 flex items-center gap-2 hover:bg-gray-900"
      >
        <MessageSquare size={18} />
        New Chat
      </button>

      {/* Chat History */}
      <div>
        <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Chat History</h2>
        {sessions.length === 0 ? (
          <p className="text-sm text-gray-500">No chats yet.</p>
        ) : (
          <ul className="space-y-2">
            {sessions.map((session) => (
              <li
                key={session.id}
                className="flex items-center justify-between bg-gray-900 rounded-lg p-3 gap-2 cursor-pointer hover:bg-gray-800"
                onClick={() => onLoadSession(session.id, session.messages)}
              >
                <p className="text-sm truncate flex-1">{session.title}</p>
                <button
                  onClick={(e) => {
                    e.stopPropagation(); // prevent loading session on delete
                    deleteSession(session.id);
                  }}
                  className="text-gray-500 hover:text-red-400 shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Documents */}
      <div>
        <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">Uploaded Documents</h2>
        {docs.length === 0 ? (
          <p className="text-sm text-gray-500">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li key={doc.filename} className="flex items-start justify-between bg-gray-900 rounded-lg p-3 gap-2">
                <div className="flex items-start gap-2 overflow-hidden">
                  <FileText size={16} className="mt-0.5 shrink-0 text-blue-400" />
                  <div className="overflow-hidden">
                    <p className="text-sm truncate">{doc.filename}</p>
                    <p className="text-xs text-gray-500">{doc.chunks} chunks</p>
                  </div>
                </div>
                <button
                  onClick={() => deleteDoc(doc.filename)}
                  className="text-gray-500 hover:text-red-400 shrink-0"
                >
                  <Trash2 size={15} />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
});

export default Sidebar;