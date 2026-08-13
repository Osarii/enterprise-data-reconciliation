$ErrorActionPreference = 'Stop'

Write-Host 'Running V0.1.9 regression suite...'
npm run test:run

if ($LASTEXITCODE -ne 0) {
    throw 'Regression tests failed. Build will not run.'
}

Write-Host ''
Write-Host 'Running production build...'
npm run build

if ($LASTEXITCODE -ne 0) {
    throw 'Production build failed.'
}

Write-Host ''
Write-Host 'Quality gate passed: tests + production build are clean.'
