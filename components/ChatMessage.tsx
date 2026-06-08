type Props = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatMessage({ role, content }: Props) {
  return (
    <div className={`flex gap-3 items-start ${role === "user" ? "flex-row-reverse" : ""}`}>
      <div
        className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
          role === "user" ? "bg-indigo-600 text-white" : "bg-gray-900 text-white"
        }`}
      >
        {role === "user" ? "J" : "A"}
      </div>
      <div
        className={`max-w-xl px-4 py-2.5 text-sm leading-relaxed ${
          role === "user"
            ? "bg-indigo-600 text-white rounded-xl rounded-tr-sm"
            : "bg-white border border-gray-200 text-gray-800 rounded-xl rounded-tl-sm"
        }`}
      >
        {content}
      </div>
    </div>
  );
}