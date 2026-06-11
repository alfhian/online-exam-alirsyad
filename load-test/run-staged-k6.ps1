param(
  [Parameter(Mandatory = $true)]
  [string]$ApiBaseUrl,

  [Parameter(Mandatory = $true)]
  [string]$ExamId,

  [Parameter(Mandatory = $true)]
  [string]$QuestionId,

  [string]$Answer = "A",
  [int[]]$Stages = @(10, 25, 50, 100, 150, 200),
  [switch]$ResetBeforeEachStage
)

$ErrorActionPreference = "Stop"

foreach ($stage in $Stages) {
  Write-Host ""
  Write-Host "=== Running k6 load test with $stage students ===" -ForegroundColor Cyan

  if ($ResetBeforeEachStage) {
    Write-Host "Resetting load-test submissions/sessions/jobs via seeder..." -ForegroundColor Yellow
    Push-Location ..\online-exam-backend
    try {
      $env:LOAD_TEST_STUDENT_COUNT = [string]([Math]::Max(200, $stage))
      npm run seed:load-test
    } finally {
      Pop-Location
    }
  }

  $env:API_BASE_URL = $ApiBaseUrl
  $env:EXAM_ID = $ExamId
  $env:QUESTION_ID_1 = $QuestionId
  $env:ANSWER_1 = $Answer
  $env:VUS = [string]$stage

  k6 run .\submit-exam-load-test.js

  Write-Host "=== Stage $stage completed ===" -ForegroundColor Green
  if ($stage -ne $Stages[-1]) {
    Write-Host "Check Supabase counts/jobs before continuing. Press Enter to continue, or Ctrl+C to stop."
    Read-Host | Out-Null
  }
}
