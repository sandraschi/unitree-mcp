import { Routes, Route, Link } from "react-router-dom";

function Dashboard() {
  return (
    <div class="p-6 max-w-4xl mx-auto">
      <h1 class="text-3xl font-bold mb-6">Unitree MCP Dashboard</h1>
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div class="bg-white rounded-xl shadow p-4 border">
          <h2 class="font-semibold text-lg mb-2">Simulation</h2>
          <p class="text-gray-600 mb-2">Start/stop MuJoCo simulations for Unitree robots</p>
          <Link to="/sim" class="text-blue-600 hover:underline">Open Sim Panel &rarr;</Link>
        </div>
        <div class="bg-white rounded-xl shadow p-4 border">
          <h2 class="font-semibold text-lg mb-2">Models</h2>
          <p class="text-gray-600 mb-2">Browse available robot models (Go2, H1, G1, etc.)</p>
          <Link to="/models" class="text-blue-600 hover:underline">Browse Models &rarr;</Link>
        </div>
      </div>
      <p class="text-sm text-gray-500">Port 11052 (backend) / 11053 (frontend)</p>
    </div>
  );
}

function SimPanel() {
  return (
    <div class="p-6 max-w-4xl mx-auto">
      <Link to="/" class="text-blue-600 hover:underline mb-4 block">&larr; Back</Link>
      <h1 class="text-3xl font-bold mb-4">Simulation Control</h1>
      <p class="text-gray-600">Use MCP tools (start_sim, stop_sim, etc.) to control simulations.</p>
      <div class="mt-4 p-4 bg-gray-50 rounded-lg border">
        <h2 class="font-semibold mb-2">Available Robots</h2>
        <ul class="list-disc list-inside text-gray-700">
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
    <div class="p-6 max-w-4xl mx-auto">
      <Link to="/" class="text-blue-600 hover:underline mb-4 block">&larr; Back</Link>
      <h1 class="text-3xl font-bold mb-4">Robot Models</h1>
      <p class="text-gray-600">Models from <code>unitree_mujoco/unitree_robots/</code></p>
    </div>
  );
}

export default function App() {
  return (
    <div class="min-h-screen bg-gray-50">
      <nav class="bg-white shadow-sm border-b px-6 py-3">
        <div class="max-w-4xl mx-auto flex items-center gap-4">
          <Link to="/" class="font-bold text-xl text-gray-800">Unitree MCP</Link>
          <Link to="/sim" class="text-gray-600 hover:text-gray-800">Sim</Link>
          <Link to="/models" class="text-gray-600 hover:text-gray-800">Models</Link>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/sim" element={<SimPanel />} />
        <Route path="/models" element={<ModelsPage />} />
      </Routes>
    </div>
  );
}
