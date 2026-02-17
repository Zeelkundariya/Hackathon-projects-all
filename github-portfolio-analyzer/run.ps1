# GitHub Portfolio Analyzer - Run Script

Write-Host "🚀 Starting GitHub Portfolio Analyzer..." -ForegroundColor Cyan

# Check if node_modules exists in backend
if (!(Test-Path "backend\node_modules")) {
    Write-Host "📦 Installing backend dependencies..." -ForegroundColor Yellow
    cd backend
    npm install
    cd ..
}

# Check if node_modules exists in frontend
if (!(Test-Path "frontend\node_modules")) {
    Write-Host "📦 Installing frontend dependencies..." -ForegroundColor Yellow
    cd frontend
    npm install
    cd ..
}

# Start backend in a new window
Write-Host "🌐 Starting Backend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; npm start"

# Start frontend in a new window
Write-Host "💻 Starting Frontend Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev"

# Wait for servers to initialize
Write-Host "⏳ Waiting for servers to start..." -ForegroundColor Gray
Start-Sleep -Seconds 5

# Open browser
Write-Host "🌍 Opening browser..." -ForegroundColor Cyan
Start-Process "http://localhost:5173"

Write-Host "✅ Project is running!" -ForegroundColor Cyan
