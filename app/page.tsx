"use client";

import { useRef, useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import ChatMessage from "@/components/ChatMessage";
import { ArrowUp, Plus, X } from "lucide-react";

type Message = {
  role: "user" | "assistant";
  content: string;
  responseTime?: number;
  source?: string;
};

function generateId() {
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [sessionId] = useState<string>(generateId);

  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploading, setUploading] = useState(false);
  const [lastResponseTime, setLastResponseTime] = useState<number | null>(null);

  const sidebarRef = useRef<{ refresh: () => void }>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // auto scroll to bottom
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // save session on message change
  useEffect(() => {
    if (messages.length === 0) return;
    fetch("/api/sessions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: sessionId, messages }),
    });
    sidebarRef.current?.refresh();
  }, [messages]);

  function loadSession(id: string, sessionMessages: Message[]) {
    setMessages(sessionMessages);
  }

  function newChat() {
    setMessages([]);
    setLastResponseTime(null);
    setUploadStatus("");
    setFile(null);
  }

  async function sendMessage() {
    if (!message.trim()) return;

    const userMessage: Message = { role: "user", content: message };
    setMessages((prev) => [...prev, userMessage]);

    const currentMessage = message;
    setMessage("");
    setLoading(true);

    try {
      const startTime = performance.now();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: currentMessage,
          history: messages.map((m) => ({ role: m.role, content: m.content })),
        }),
      });

      if (!res.ok) throw new Error(`Server error: ${res.status}`);

      const data = await res.json();
      const timeTaken = Number(((performance.now() - startTime) / 1000).toFixed(2));

      setLastResponseTime(timeTaken);
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "No response received.",
          responseTime: timeTaken,
          source: data.source,
        },
      ]);
    } catch (err) {
      console.error(err);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    }

    setLoading(false);
  }

  async function uploadFile() {
    if (!file || uploading) return;

    const formData = new FormData();
    formData.append("file", file);

    setUploading(true);
    setUploadStatus("Uploading...");

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setUploadStatus(`${data.filename} uploaded (${data.chunks} chunks)`);
        setFile(null);
        sidebarRef.current?.refresh();
      } else {
        setUploadStatus("Upload failed. Please try again.");
      }
    } catch (error) {
      console.error(error);
      setUploadStatus("Upload failed. Please try again.");
    }

    setUploading(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  return (
    <main className="h-screen flex bg-gray-50 overflow-hidden">
      <Sidebar ref={sidebarRef} onLoadSession={loadSession} onNewChat={newChat} />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <div className="bg-white border-b border-gray-200 px-5 py-3.5 flex items-center justify-between">
          <span className="text-sm font-medium text-gray-900">Attentio-AI</span>
          <span className="text-xs bg-indigo-50 text-indigo-600 px-3 py-1 rounded-full">
            Student assistant
          </span>
        </div>

        {/* Chat area */}
        <div className="flex-1 overflow-y-auto px-10 py-6 space-y-5">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <h1 className="text-2xl font-medium text-gray-900 mb-2">
                Welcome, Jannat
              </h1>
              <p className="text-sm text-gray-500 leading-relaxed max-w-sm">
                Ask questions about your uploaded documents, or anything about
                focus, productivity, and learning.
              </p>
            </div>
          ) : (
            messages.map((msg, index) => (
              <div key={index}>
                <ChatMessage role={msg.role} content={msg.content} />
                {/* ✅ updated — shows response time + source */}
                {msg.role === "assistant" && msg.responseTime !== undefined && (
                  <div className="ml-10 mt-1.5 space-y-0.5">
                    <p className="text-xs text-gray-400">
                      Response time: {msg.responseTime}s
                    </p>
                    {msg.source && msg.source !== "general" && (
                      <p className="text-xs text-indigo-400">
                        Source: {msg.source === "web search" ? "Web search" : "Uploaded documents"}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))
          )}

          {loading && <ChatMessage role="assistant" content="Thinking..." />}
          <div ref={chatEndRef} />
        </div>

        {/* Bottom input area */}
        <div className="bg-white border-t border-gray-200 px-5 py-3">
          {/* File selected indicator */}
          {file && (
            <div className="flex items-center gap-2 mb-2 px-1">
              <span className="text-xs text-gray-500">{file.name}</span>
              <button
                onClick={uploadFile}
                disabled={uploading}
                className="text-xs text-indigo-600 hover:text-indigo-700 font-medium disabled:opacity-50"
              >
                {uploading ? "Uploading..." : "Upload"}
              </button>
              <button
                onClick={() => { setFile(null); setUploadStatus(""); }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={13} />
              </button>
            </div>
          )}

          {/* Upload status */}
          {uploadStatus && !file && (
            <p className="text-xs text-green-600 mb-2 px-1">{uploadStatus}</p>
          )}

          {/* Input row */}
          <div className="flex items-end gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-9 h-9 rounded-full border border-gray-300 flex items-center justify-center text-gray-500 hover:bg-gray-50 hover:text-gray-700 flex-shrink-0 transition-colors"
            >
              <Plus size={18} />
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.txt,.docx"
              className="hidden"
              onChange={(e) => {
                if (e.target.files?.[0]) {
                  setFile(e.target.files[0]);
                  setUploadStatus("");
                }
              }}
            />

            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask your question..."
              rows={1}
              className="flex-1 border border-gray-300 rounded-xl px-4 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            />

            <button
              onClick={sendMessage}
              disabled={loading || !message.trim()}
              className="w-9 h-9 rounded-full bg-gray-900 flex items-center justify-center text-white hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0 transition-colors"
            >
              <ArrowUp size={17} />
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}