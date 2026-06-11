import ReactMarkdown from "react-markdown";

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
        {role === "user" ? (
          content
        ) : (
          <ReactMarkdown
            components={{
              h1: ({ children }) => <h1 className="text-base font-bold mt-3 mb-1">{children}</h1>,
              h2: ({ children }) => <h2 className="text-sm font-bold mt-3 mb-1">{children}</h2>,
              h3: ({ children }) => <h3 className="text-sm font-semibold mt-2 mb-1">{children}</h3>,
              p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
              ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
              ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
              li: ({ children }) => <li className="text-sm">{children}</li>,
              strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
              code: ({ children }) => (
                <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono">
                  {children}
                </code>
              ),
              pre: ({ children }) => (
                <pre className="bg-gray-100 text-gray-800 p-3 rounded-lg text-xs font-mono overflow-x-auto my-2">
                  {children}
                </pre>
              ),
            }}
          >
            {content}
          </ReactMarkdown>
        )}
      </div>
    </div>
  );
}