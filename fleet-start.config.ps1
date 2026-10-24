# Per-repo fleet start config for unitree-mcp
# Edit ports/backend target here - start.ps1 is fleet-standard.
@{
    Name         = 'unitree-mcp'
    BackendPort  = 11052
    FrontendPort = 11053
    HealthPath   = '/health'
    WebRoot      = 'web_sota'
    Backend = @{
        Kind = 'none'
    }
    Frontend = @{
        Kind = 'none'
    }
}
