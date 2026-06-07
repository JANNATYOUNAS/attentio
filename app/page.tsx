"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatMessage from "@/components/ChatMessage";

type Message = {
  role: "user" | "assistant";
  content: string;
  responseTime?: number;
};

export default function Home() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);

  // File upload states
  const [file, setFile] = useState<File | null>(null);
  const [uploadStatus, setUploadStatus] = useState("");

  // Response time
  const [lastResponseTime, setLastResponseTime] =
    useState<number | null>(null);

  async function sendMessage() {
    if (!message.trim()) return;

    const userMessage: Message = {
      role: "user",
      content: message,
    };

    setMessages((prev) => [...prev, userMessage]);

    const currentMessage = message;

    setMessage("");
    setLoading(true);

    try {
      const startTime = performance.now();

      const res = await fetch("/api/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: currentMessage,
        }),
      });

      const data = await res.json();

      const endTime = performance.now();

      const timeTaken = Number(
        ((endTime - startTime) / 1000).toFixed(2)
      );

      setLastResponseTime(timeTaken);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: data.reply || "No response received.",
          responseTime: timeTaken,
        },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Something went wrong.",
        },
      ]);
    }

    setLoading(false);
  }

  async function uploadFile() {
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();

      if (data.success) {
        setUploadStatus(
          `Uploaded: ${data.filename}

${data.text?.substring(0, 1000) }`
        );
      } else {
        setUploadStatus("Upload failed");
      }
    } catch (error) {
      console.error(error);
      setUploadStatus("Upload failed");
    }
  }

  return (
    <main className="h-screen flex bg-gray-100">
      <Sidebar />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b p-4">
          <h2 className="font-semibold text-lg">
            Attentio-AI Student Support Assistant
          </h2>
        </div>

        {/* Chat Area */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.length === 0 && (
            <div className="text-center mt-24">
              <h1 className="text-4xl font-bold mb-4">
                Welcome to Attentio-AI
              </h1>

              <p className="text-gray-500">
                Ask questions about focus,
                concentration, productivity,
                study habits, and learning.
              </p>
            </div>
          )}

          {messages.map((msg, index) => (
            <div key={index}>
              <ChatMessage
                role={msg.role}
                content={msg.content}
              />

              {msg.role === "assistant" &&
                msg.responseTime !== undefined && (
                  <div className="text-xs text-gray-500 mt-1 ml-2">
                    ⚡ Response time: {msg.responseTime} seconds
                  </div>
                )}
            </div>
          ))}

          {loading && (
            <ChatMessage
              role="assistant"
              content="Thinking..."
            />
          )}
        </div>

        {/* Upload Section */}
        <div className="px-4 pt-4 bg-white border-t">
          <input
            type="file"
            accept=".pdf,.txt,.docx"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setFile(e.target.files[0]);
              }
            }}
          />

          {file && (
            <p className="mt-2 text-sm text-gray-600">
              📄 Selected: {file.name}
            </p>
          )}

          <button
            onClick={uploadFile}
            className="bg-green-600 text-white px-4 py-2 rounded mt-2 hover:bg-green-700"
          >
            Upload Document
          </button>

          {uploadStatus && (
            <p className="mt-2 text-sm text-gray-700 whitespace-pre-wrap">
              {uploadStatus}
            </p>
          )}
        </div>

        {/* Latest Response Time */}
        {lastResponseTime !== null && (
          <div className="bg-white text-center text-sm text-gray-600 py-2 border-t">
            ⚡ Last response generated in{" "}
            <strong>{lastResponseTime}</strong> seconds
          </div>
        )}

        {/* Input */}
        <div className="border-t bg-white p-4">
          <div className="flex gap-2">
            <textarea
              value={message}
              onChange={(e) =>
                setMessage(e.target.value)
              }
              placeholder="Ask your question..."
              rows={2}
              className="flex-1 border rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <button
              onClick={sendMessage}
              disabled={loading}
              className="bg-black text-white px-6 rounded-xl hover:bg-gray-800 disabled:opacity-50"
            >
              Send
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}