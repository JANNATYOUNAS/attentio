"use client";

import { MessageSquare, Trash2, FileText } from "lucide-react";
import { useEffect, useState } from "react";

type DocFile = {
  filename: string;
  chunks: number;
};

export default function Sidebar() {
  const [docs, setDocs] = useState<DocFile[]>([]);

  async function fetchDocs() {
    try {
      const res = await fetch("/api/documents");
      const data = await res.json();
      setDocs(data.files);
    } catch {
      console.error("Failed to fetch documents");
    }
  }

  async function deleteDoc(filename: string) {
    try {
      await fetch("/api/documents", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      fetchDocs(); // refresh list
    } catch {
      console.error("Failed to delete document");
    }
  }

  useEffect(() => {
    fetchDocs();
  }, []);

  return (
    <div className="w-64 bg-black text-white p-4 flex flex-col">
      <h1 className="text-2xl font-bold mb-8">Attentio-AI</h1>

      <button className="w-full border border-gray-700 rounded-lg p-3 flex items-center gap-2 mb-6">
        <MessageSquare size={18} />
        New Chat
      </button>

      {/* Documents Section */}
      <div className="flex-1">
        <h2 className="text-xs text-gray-400 uppercase tracking-wider mb-3">
          Uploaded Documents
        </h2>

        {docs.length === 0 ? (
          <p className="text-sm text-gray-500">No documents uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {docs.map((doc) => (
              <li
                key={doc.filename}
                className="flex items-start justify-between bg-gray-900 rounded-lg p-3 gap-2"
              >
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
}