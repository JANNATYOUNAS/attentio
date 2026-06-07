type Props = {
  role: "user" | "assistant";
  content: string;
};

export default function ChatMessage({
  role,
  content,
}: Props) {
  return (
    <div
      className={`flex ${
        role === "user"
          ? "justify-end"
          : "justify-start"
      }`}
    >
      <div
        className={`max-w-3xl px-4 py-3 rounded-2xl ${
          role === "user"
            ? "bg-blue-600 text-white"
            : "bg-white border"
        }`}
      >
        {content}
      </div>
    </div>
  );
}