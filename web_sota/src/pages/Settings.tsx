import { useState, useEffect } from "react";

export default function Settings() {
  const [providers, setProviders] = useState<Record<string, any[]>>({});
  const [selectedProvider, setSelectedProvider] = useState("ollama");
  const [selectedModel, setSelectedModel] = useState("");
  const [testResult, setTestResult] = useState("");

  useEffect(() => {
    fetch("/api/llm/providers")
      .then((r) => r.json())
      .then((d) => {
        setProviders(d);
        if (d.ollama?.length) {
          const saved = localStorage.getItem("llm_provider") || "ollama";
          const savedModel = localStorage.getItem("llm_model") || d.ollama[0]?.name || "llama3.2:3b";
          setSelectedProvider(saved);
          setSelectedModel(savedModel);
        }
      })
      .catch(() => setProviders({ ollama: [{name:"llama3.2:3b"}] }));
  }, []);

  const saveLlmConfig = (provider: string, model: string) => {
    setSelectedProvider(provider);
    setSelectedModel(model);
    localStorage.setItem("llm_provider", provider);
    localStorage.setItem("llm_model", model);
  };

  const testConnection = async () => {
    setTestResult("Testing...");
    try {
      const r = await fetch("/api/llm/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ provider: selectedProvider, model: selectedModel, prompt: "Hello, respond with just: OK" }),
      });
      const data = await r.json();
      setTestResult(data.response ? "Connected" : "Failed: " + (data.error || "no response"));
    } catch (e) {
      setTestResult("Error: " + String(e));
    }
  };

  const providerModels = providers[selectedProvider] || providers["ollama"] || [];
  const providerReachable = providers[selectedProvider] ? true : false;

  return (
    <div className="p-6 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold mb-6 text-gray-800">Settings</h1>

      <div className="bg-white rounded-xl shadow p-5 border space-y-4 mb-6">
        <h2 className="text-lg font-semibold">Local LLM</h2>
        <p className="text-xs text-gray-500">Select which local LLM provider and model to use for AI tools.</p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">Provider</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedProvider}
              onChange={(e) => {
                const p = e.target.value;
                const models = providers[p] || [];
                const m = models[0]?.name || "llama3.2:3b";
                saveLlmConfig(p, m);
              }}
            >
              {Object.keys(providers).map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-600 mb-1">Model</label>
            <select
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={selectedModel}
              onChange={(e) => saveLlmConfig(selectedProvider, e.target.value)}
            >
              {providerModels.map((m: any) => (
                <option key={m.name} value={m.name}>{m.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="flex items-center gap-1.5 text-sm text-gray-600">
            <span className={`w-2 h-2 rounded-full ${providerReachable ? "bg-green-500" : "bg-red-500"}`} />
            {selectedProvider}
          </span>
          <button
            onClick={testConnection}
            className="text-xs px-3 py-1.5 rounded border border-gray-300 hover:bg-gray-50"
          >
            Test Connection
          </button>
          {testResult && (
            <span className={`text-xs ${testResult === "Connected" ? "text-green-600" : "text-yellow-600"}`}>
              {testResult}
            </span>
          )}
        </div>

        <div className="text-xs text-gray-400">
          The LLM page uses these settings. Changes are saved to localStorage and persist across sessions.
        </div>
      </div>
    </div>
  );
}
