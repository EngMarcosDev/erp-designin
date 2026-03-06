<#
  start-dev.ps1
  - Abre dois processos `npm run dev` em diretórios informados (padrões: raiz e ./frontend)
  Uso: .\scripts\start-dev.ps1 -PathA '.' -PathB './frontend'
#>

param(
  [string]$PathA = ".",
  [string]$PathB = "./frontend"
)

Write-Host "Iniciando dev em: $PathA e $PathB"

Start-Process -FilePath npm -ArgumentList 'run','dev' -WorkingDirectory (Resolve-Path $PathA) -NoNewWindow

Start-Process -FilePath npm -ArgumentList 'run','dev' -WorkingDirectory (Resolve-Path $PathB) -NoNewWindow

Write-Host "Processos iniciados (ver janelas/terminais)"
