# === Fleet-standard ===
bootstrap:
    uv sync

serve:
    uv run python -m unitree_mcp

lint:
    ruff check src/ web_sota/backend/

fix:
    ruff check --fix src/ web_sota/backend/

test:
    uv run pytest tests/ -q

e2e:
    cd web_sota && npx playwright test

web:
    pwsh -NoProfile -File ./web_sota/start.ps1

mcpb-pack:
    pwsh -NoProfile -File ./mcpb/pack.ps1

clean:
    pwsh -NoProfile -c "Remove-Item -Recurse -Force -Path dist,.venv,__pycache__ -ErrorAction SilentlyContinue"

# === Repo-specific ===
models:
    uv run python -c "from pathlib import Path; p = Path('D:/Dev/repos/external/unitree_mujoco/unitree_robots'); print('Models:', [d.name for d in p.iterdir()]) if p.exists() else print('unitree_mujoco not cloned')"

unitree-mujoco:
    pwsh -NoProfile -c "if (Test-Path D:/Dev/repos/external/unitree_mujoco) { Write-Host 'unitree_mujoco available at D:/Dev/repos/external/unitree_mujoco' } else { Write-Host 'Clone: git clone https://github.com/unitreerobotics/unitree_mujoco D:/Dev/repos/external/unitree_mujoco' }"

go2-info:
    uv run python -c "from pathlib import Path; p = Path('D:/Dev/repos/external/unitree_mujoco/data/go2/go2.xml'); print(f'Go2 model: {p.stat().st_size} bytes') if p.exists() else print('Go2 model not found')"