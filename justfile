bootstrap:
    uv sync

serve:
    uv run python -m unitree_mcp

lint:
    C:\Users\sandr\AppData\Local\Programs\Python\Python313\Scripts\ruff.exe check src/

fix:
    C:\Users\sandr\AppData\Local\Programs\Python\Python313\Scripts\ruff.exe check --fix src/

web:
    pwsh -NoProfile -File .\web_sota\start.ps1

status:
    pwsh -NoProfile -c "uv run --directory . python -c \"import sys; sys.path.insert(0, 'src'); from unitree_mcp.server import mcp; print(f'Server: {mcp.name}')\""
