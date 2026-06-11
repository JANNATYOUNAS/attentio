"use client";

import { forwardRef, useEffect, useImperativeHandle, useState } from "react";
import { FileText, MessageSquare, Pencil, Trash2 } from "lucide-react";

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
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState("");

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

  async function renameSession(id: string, title: string) {
    await fetch("/api/sessions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, title }),
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
    <div className="w-60 bg-[#1a1a1a] text-white flex flex-col h-full">
      {/* Logo */}
      <div className="px-4 py-5 text-[15px] font-medium tracking-tight">
        Attentio-AI
      </div>

      {/* New Chat */}
      <div className="px-3 mb-2">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg border border-[#333] text-[#ccc] text-sm hover:bg-[#2a2a2a] transition-colors"
        >
          <MessageSquare size={15} />
          New chat
        </button>
      </div>

      {/* Chat History */}
      <div className="px-3 mt-2 flex-1 overflow-y-auto">
        <p className="text-[10px] text-[#555] uppercase tracking-widest px-1 mb-2">
          Chat history
        </p>

        {sessions.length === 0 ? (
          <p className="text-xs text-[#555] px-1">No chats yet.</p>
        ) : (
          <ul className="space-y-0.5">
            {sessions.map((session) => (
              <li
                key={session.id}
                onClick={() => {
                  if (editingId !== session.id)
                    onLoadSession(session.id, session.messages);
                }}
                className="flex items-center justify-between px-3 py-2 rounded-lg cursor-pointer hover:bg-[#2a2a2a] group transition-colors"
              >
                {editingId === session.id ? (
                  <input
                    autoFocus
                    value={editingTitle}
                    onChange={(e) => setEditingTitle(e.target.value)}
                    onBlur={async () => {
                      if (editingTitle.trim()) {
                        await renameSession(session.id, editingTitle.trim());
                      }
                      setEditingId(null);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") e.currentTarget.blur();
                      if (e.key === "Escape") setEditingId(null);
                    }}
                    onClick={(e) => e.stopPropagation()}
                    className="flex-1 bg-[#333] text-white text-xs px-2 py-1 rounded outline-none"
                  />
                ) : (
                  <span className="text-xs text-[#bbb] truncate flex-1">
                    {session.title}
                  </span>
                )}

                {editingId !== session.id && (
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity ml-2 flex-shrink-0">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(session.id);
                        setEditingTitle(session.title);
                      }}
                      className="text-[#555] hover:text-blue-400"
                    >
                      <Pencil size={12} />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteSession(session.id);
                      }}
                      className="text-[#555] hover:text-red-400"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}

        {/* Documents */}
        <p className="text-[10px] text-[#555] uppercase tracking-widest px-1 mt-5 mb-2">
          Documents
        </p>
        {docs.length === 0 ? (
          <p className="text-xs text-[#555] px-1">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-0.5">
            {docs.map((doc) => (
              <li
                key={doc.filename}
                className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-[#2a2a2a] group transition-colors"
              >
                <FileText size={13} className="text-blue-400 flex-shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#bbb] truncate">{doc.filename}</p>
                  <p className="text-[10px] text-[#555]">{doc.chunks} chunks</p>
                </div>
                <button
                  onClick={() => deleteDoc(doc.filename)}
                  className="text-[#555] hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 size={13} />
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