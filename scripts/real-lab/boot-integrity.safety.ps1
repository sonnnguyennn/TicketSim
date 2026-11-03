$ErrorActionPreference='Stop'
Import-Module (Join-Path $PSScriptRoot 'BootIntegrity.psm1') -Force
function Assert-Rejected([scriptblock]$Action,[string]$Code){
  $rejected=$false
  try{& $Action}catch{if($_.Exception.Message -notlike "$Code*"){throw};$rejected=$true}
  if(-not $rejected){throw "Expected rejection: $Code"}
}
$root=Join-Path ([IO.Path]::GetTempPath()) ('ticketsim-boot-integrity-'+[guid]::NewGuid())
$null=New-Item -ItemType Directory -Path (Join-Path $root 'scripts\real-lab') -Force
try{
  $modulePath=Join-Path $root 'scripts\real-lab\FastReset.Operator.psm1'
  [IO.File]::WriteAllText($modulePath,'synthetic module; never imported')
  $hash=(Get-FileHash -LiteralPath $modulePath -Algorithm SHA256).Hash
  $prep=[pscustomobject]@{CodeHashes=[pscustomobject]@{}}
  $entry=[pscustomobject]@{path='scripts/real-lab/FastReset.Operator.psm1';sha256=$hash.ToLowerInvariant()}
  $manifest=[pscustomobject]@{files=@($entry)}
  $argsForTest=@{RelativePath='scripts\real-lab\FastReset.Operator.psm1';InstallRoot=$root;Preparation=$prep;VerifiedReleaseManifest=$manifest}
  $result=Assert-BootDependencyIntegrity @argsForTest
  if(-not $result.Match -or $result.ExpectedSource -ne 'verified-release-manifest'){throw 'Legacy preparation compatibility failed'}
  Write-Output 'PASS legacy missing module hash uses verified release inventory'
  [IO.File]::AppendAllText($modulePath,' changed')
  Assert-Rejected {Assert-BootDependencyIntegrity @argsForTest} 'BOOT_DEPENDENCY_HASH_MISMATCH'
  Write-Output 'PASS changed installed bytes remain blocked'
  [IO.File]::WriteAllText($modulePath,'synthetic module; never imported')
  $prep.CodeHashes|Add-Member -NotePropertyName 'scripts\real-lab\FastReset.Operator.psm1' -NotePropertyValue ('0'*64)
  Assert-Rejected {Assert-BootDependencyIntegrity @argsForTest} 'BOOT_DEPENDENCY_HASH_MISMATCH'
  Write-Output 'PASS existing preparation mismatch cannot fall back to manifest'
  $prep.CodeHashes=[pscustomobject]@{}
  $manifest.files=@()
  Assert-Rejected {Assert-BootDependencyIntegrity @argsForTest} 'BOOT_MODULE_MANIFEST_ENTRY_INVALID'
  $manifest.files=@($entry,$entry)
  Assert-Rejected {Assert-BootDependencyIntegrity @argsForTest} 'BOOT_MODULE_MANIFEST_ENTRY_INVALID'
  $entry.sha256='invalid';$manifest.files=@($entry)
  Assert-Rejected {Assert-BootDependencyIntegrity @argsForTest} 'BOOT_DEPENDENCY_EXPECTED_HASH_MISSING_OR_INVALID'
  Write-Output 'PASS absent duplicate and malformed manifest entries rejected'
  Assert-Rejected {Assert-BootDependencyIntegrity -RelativePath 'node.exe' -InstallRoot $root -Preparation $prep -VerifiedReleaseManifest $manifest} 'BOOT_DEPENDENCY_EXPECTED_HASH_MISSING_OR_INVALID'
  Write-Output 'PASS Node cannot use the module compatibility path'
}finally{
  $resolved=[IO.Path]::GetFullPath($root)
  $tempRoot=[IO.Path]::GetFullPath([IO.Path]::GetTempPath())
  if(-not $resolved.StartsWith($tempRoot,[StringComparison]::OrdinalIgnoreCase) -or (Split-Path -Leaf $resolved) -notlike 'ticketsim-boot-integrity-*'){throw 'UNSAFE_TEST_CLEANUP'}
  Remove-Item -LiteralPath $resolved -Recurse -Force
}
Write-Output 'No protected runtime, VM, backup or journal was changed.'
