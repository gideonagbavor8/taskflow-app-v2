# PostgreSQL Database Setup Script for TaskFlow
# This script helps you set up PostgreSQL using Docker (if available)

Write-Host "=== TaskFlow Database Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is available
$dockerAvailable = $false
try {
    $dockerVersion = docker --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        $dockerAvailable = $true
        Write-Host "✓ Docker is available" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Docker is not available" -ForegroundColor Yellow
}

if ($dockerAvailable) {
    Write-Host ""
    Write-Host "Setting up PostgreSQL with Docker..." -ForegroundColor Cyan
    
    $password = Read-Host "Enter a password for PostgreSQL (or press Enter for default: 'postgres')"
    if ([string]::IsNullOrWhiteSpace($password)) {
        $password = "postgres"
    }
    
    Write-Host ""
    Write-Host "Starting PostgreSQL container..." -ForegroundColor Yellow
    
    docker run --name taskflow-postgres `
        -e POSTGRES_PASSWORD=$password `
        -e POSTGRES_DB=taskflow_db `
        -p 5432:5432 `
        -d postgres:16
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ PostgreSQL container started successfully!" -ForegroundColor Green
        Write-Host ""
        Write-Host "Your DATABASE_URL:" -ForegroundColor Cyan
        Write-Host "postgresql://postgres:$password@localhost:5432/taskflow_db" -ForegroundColor Yellow
        Write-Host ""
        Write-Host "Add this to your .env.local file:" -ForegroundColor Cyan
        Write-Host "DATABASE_URL=`"postgresql://postgres:$password@localhost:5432/taskflow_db`"" -ForegroundColor Yellow
    } else {
        Write-Host "✗ Failed to start container. Make sure Docker is running." -ForegroundColor Red
    }
} else {
    Write-Host "Docker is not available. Please install PostgreSQL manually:" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "1. Download from: https://www.postgresql.org/download/windows/" -ForegroundColor Cyan
    Write-Host "2. Install and set a password for 'postgres' user" -ForegroundColor Cyan
    Write-Host "3. Create database 'taskflow_db' using pgAdmin" -ForegroundColor Cyan
    Write-Host "4. Use connection string: postgresql://postgres:YOUR_PASSWORD@localhost:5432/taskflow_db" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Or install Docker Desktop from: https://www.docker.com/products/docker-desktop" -ForegroundColor Cyan
}

Write-Host ""
Write-Host "After setting up the database, run:" -ForegroundColor Cyan
Write-Host "  npm run db:migrate" -ForegroundColor Yellow
Write-Host "  npm run db:seed" -ForegroundColor Yellow

