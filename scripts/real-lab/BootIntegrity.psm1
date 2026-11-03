function Assert-BootDependencyIntegrity {
  param(
    [Parameter(Mandatory)][ValidateSet('node.exe','powershell\pwsh.exe','scripts\real-lab\FastReset.Operator.psm1')][string]$RelativePath,
    [Parameter(Mandatory)][string]$InstallRoot,
    [Parameter(Mandatory)]$Preparation,
    [Parameter(Mandatory)]$VerifiedReleaseManifest
  )
  $ErrorActionPreference='Stop'
  $expected=$Preparation.CodeHashes.$RelativePath
  $source='original-preparation'
  # Legacy preparation never inventoried this module. Its only alternative
  # trust anchor is the already verified, pinned protected release manifest.
  # An existing preparation hash always wins; a mismatch never falls back.
  if($null -eq $expected -and $RelativePath -ceq 'scripts\real-lab\FastReset.Operator.psm1'){
    $entries=@($VerifiedReleaseManifest.files|Where-Object {$_.path -ceq 'scripts/real-lab/FastReset.Operator.psm1'})
    if($entries.Count -ne 1){throw 'BOOT_MODULE_MANIFEST_ENTRY_INVALID'}
    $expected=$entries[0].sha256
    $source='verified-release-manifest'
  }
  if($expected -isnot [string] -or $expected -notmatch '^[a-fA-F0-9]{64}$'){throw "BOOT_DEPENDENCY_EXPECTED_HASH_MISSING_OR_INVALID: $RelativePath"}
  $actual=(Get-FileHash -LiteralPath (Join-Path $InstallRoot $RelativePath) -Algorithm SHA256 -ErrorAction Stop).Hash
  if($actual -ine $expected){throw "BOOT_DEPENDENCY_HASH_MISMATCH: $RelativePath"}
  [pscustomobject]@{RelativePath=$RelativePath;ExpectedSource=$source;Match=$true}
}
Export-ModuleMember -Function Assert-BootDependencyIntegrity
