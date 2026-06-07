import { MessageSquare } from "lucide-react";

export default function Sidebar() {
  return (
    <div className="w-64 bg-black text-white p-4">
      <h1 className="text-2xl font-bold mb-8">
        Attentio-AI
      </h1>

      <button className="w-full border border-gray-700 rounded-lg p-3 flex items-center gap-2">
        <MessageSquare size={18} />
        New Chat
      </button>
    </div>
  );
}