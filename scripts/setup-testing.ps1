$ErrorActionPreference = 'Stop'

Write-Host 'Installing V0.1.9 testing dependencies...'

npm install -D vitest @vitest/coverage-v8 jsdom

if ($LASTEXITCODE -ne 0) {
    throw 'npm install failed.'
}

Write-Host 'Adding testing scripts to package.json...'

npm pkg set `
    "scripts.test=vitest" `
    "scripts.test:run=vitest run" `
    "scripts.test:coverage=vitest run --coverage"

if ($LASTEXITCODE -ne 0) {
    throw 'npm pkg set failed.'
}

Write-Host ''
Write-Host 'V0.1.9 testing setup completed.'
Write-Host 'Available commands:'
Write-Host '  npm run test'
Write-Host '  npm run test:run'
Write-Host '  npm run test:coverage'
