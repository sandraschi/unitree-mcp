import { useState, useRef, useEffect } from "react";

const quickActions = [
  { title: "Start Sim", prompt: "Start a simulation with a Go2 robot" },
  { title: "Analyze State", prompt: "What is the current state of all active simulations?" },
  { title: "NL Control", prompt: "Make the robot walk forward slowly" },
  { title: "Discover Model", prompt: "Suggest which Unitree robot model to test for a new gait algorithm" },
];

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export default function LLM() {
  const [chat, setChat] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [providers, setProviders] = useState<string[]>([]);
  const [selectedProvider, setSelectedProvider] = useState("ollama");
  const [selectedModel, setSelectedModel] = useState("llama3.2:3b");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const savedProvider = localStorage.getItem("llm_provider") || "ollama";
    const savedModel = localStorage.getItem("llm_model") || "llama3.2:3b";
    setSelectedProvider(savedProvider);
    setSelectedModel(savedModel);

    fetch("/api/llm/providers")
      .then((r) => r.json())
      .then((d) => {
        if (d.ollama) {
          const names = d.ollama.map((m: { name: string }) => m.name);
          setProviders(names);
          if (names.length > 0 && !names.includes(savedModel)) {
            setSelectedModel(names[0]);
          }
        }
      })
      .catch(() => setProviders(["llama3.2:3b"]));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chat]);

  const sendMessage = async (prompt: string) => {
    setChat((prev) => [...prev, { role: "user", content: prompt }]);
    setLoading(true);
    try {
      const r = await fetch("/api/llm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, model: selectedModel, prompt }),
      });
      const data = await r.json();
      const reply = data.response || data.error || "No response";
      setChat((prev) => [...prev, { role: "assistant", content: reply }]);
    } catch (e) {
      setChat((prev) => [...prev, { role: "assistant", content: String(e) }]);
    }
    setLoading(false);
  };

  const handleSend = () => {
    if (!input.trim()) return;
    sendMessage(input.trim());
    setInput("");
  };

  return (
    <div className="p-6 max-w-5xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">LLM Interface</h1>

      <div className="mb-4 flex gap-4 items-end">
        <div>
          <label className="block text-xs text-gray-500 mb-1">Provider</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            value={selectedProvider}
            onChange={(e) => setSelectedProvider(e.target.value)}
          >
            <option value="ollama">ollama</option>
            <option value="lm-studio">lm-studio</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">Model</label>
          <select
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm bg-white"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
          >
            {providers.map((m) => (
              <option key={m} value={m}>{m}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 mb-6">
        {quickActions.map((action) => (
          <button
            key={action.title}
            className="bg-white border border-gray-200 rounded-xl p-4 text-left hover:border-blue-300 transition-colors shadow-sm"
            onClick={() => sendMessage(action.prompt)}
          >
            <div className="text-sm font-medium mb-1 text-gray-800">{action.title}</div>
            <div className="text-xs text-gray-500 line-clamp-2">{action.prompt}</div>
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
        <div className="h-80 overflow-auto p-4 space-y-3">
          {chat.length === 0 && (
            <div className="text-gray-400 text-sm text-center pt-8">
              Click a quick action or type a message to interact with the LLM.
            </div>
          )}
          {chat.map((msg, i) => (
            <div key={i} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-xl px-4 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-800"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex justify-start">
              <div className="bg-gray-100 rounded-xl px-4 py-2 text-sm text-gray-400 animate-pulse">
                Thinking...
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
        <div className="border-t border-gray-200 p-3 flex gap-2">
          <input
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Ask the LLM something..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
          />
          <button
            onClick={handleSend}
            disabled={loading || !input.trim()}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg text-sm font-medium"
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
