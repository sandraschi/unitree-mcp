import { Routes, Route, Link } from "react-router-dom";
import Help from "./pages/Help";
import Settings from "./pages/Settings";
import LLM from "./pages/LLM";

function Dashboard() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Unitree MCP Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="bg-white rounded-xl shadow p-4 border">
          <h2 className="font-semibold text-lg mb-2">Simulation</h2>
          <p className="text-gray-600 mb-2">Start/stop MuJoCo simulations for Unitree robots</p>
          <Link to="/sim" className="text-blue-600 hover:underline">Open Sim Panel &rarr;</Link>
        </div>
        <div className="bg-white rounded-xl shadow p-4 border">
          <h2 className="font-semibold text-lg mb-2">Models</h2>
          <p className="text-gray-600 mb-2">Browse available robot models (Go2, H1, G1, etc.)</p>
          <Link to="/models" className="text-blue-600 hover:underline">Browse Models &rarr;</Link>
        </div>
      </div>
      <p className="text-sm text-gray-500">Port 11052 (backend) / 11053 (frontend)</p>
    </div>
  );
}

function SimPanel() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/" className="text-blue-600 hover:underline mb-4 block">&larr; Back</Link>
      <h1 className="text-3xl font-bold mb-4">Simulation Control</h1>
      <p className="text-gray-600">Use MCP tools (start_sim, stop_sim, etc.) to control simulations.</p>
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
        <h2 className="font-semibold mb-2">Available Robots</h2>
        <ul className="list-disc list-inside text-gray-700">
          <li>Go2 (quadruped)</li>
          <li>H1 / H1-2 (humanoid)</li>
          <li>G1 (humanoid)</li>
          <li>B2 / B2W (quadruped)</li>
          <li>A2 / H2 / R1</li>
        </ul>
      </div>
    </div>
  );
}

function ModelsPage() {
  return (
    <div className="p-6 max-w-4xl mx-auto">
      <Link to="/" className="text-blue-600 hover:underline mb-4 block">&larr; Back</Link>
      <h1 className="text-3xl font-bold mb-4">Robot Models</h1>
      <p className="text-gray-600">Models from <code>unitree_mujoco/unitree_robots/</code></p>
    </div>
  );
}

export default function App() {
  return (
    <div className="min-h-screen bg-gray-50">
      <nav className="bg-white shadow-sm border-b px-6 py-3">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/" className="font-bold text-xl text-gray-800">Unitree MCP</Link>
          <Link to="/sim" className="text-gray-600 hover:text-gray-800">Sim</Link>
          <Link to="/models" className="text-gray-600 hover:text-gray-800">Models</Link>
          <Link to="/help" className="text-gray-600 hover:text-gray-800">Help</Link>
          <Link to="/settings" className="text-gray-600 hover:text-gray-800">Settings</Link>
          <Link to="/llm" className="text-gray-600 hover:text-gray-800">LLM</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sim" element={<SimPanel />} />
        <Route path="/models" element={<ModelsPage />} />
        <Route path="/help" element={<Help />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/llm" element={<LLM />} />
      </Routes>
    </div>
  );
}
