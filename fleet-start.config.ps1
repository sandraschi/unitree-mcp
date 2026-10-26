# Per-repo fleet start config for unitree-mcp
# Edit ports/backend target here - start.ps1 is fleet-standard.
@{
    Name         = 'unitree-mcp'
    BackendPort  = 11052
    FrontendPort = 11053
    HealthPath   = '/api/health'
    WebRoot      = 'web_sota'
    Backend = @{
        Kind          = 'uvicorn'
        UvicornTarget = 'web_sota.backend.server:app'
        Env           = @{ WEB_PORT = '11052' }
    }
    Frontend = @{
        Kind           = 'vite-npm'
        PackageManager = 'npm'
    }
}
