/** Operator-supplied topology evidence. This reference profile is never registered for execution. */
export const lab1ReferenceProfile = Object.freeze({
  schemaVersion: 1, profileId: 'lab1-reference-v1', mode: 'reference-only',
  vm: { name: 'lab1', vmRef: 'lab1', hypervVmId: '546953dc-48e4-4080-839d-27ad5552ac7d', controller: 'unconfirmed', generation: 2 },
  network: {
    management: { interfaceName: 'eth1', ipv4Address: '10.77.77.2', prefixLength: 24, addressPolicy: 'static-observed', expectedMac: '52:54:00:9b:86:93', hostIpv4Address: '10.77.77.1', switchId: '4277a35c-217f-4096-a1a9-a691975f150f', switchName: 'Lab-Static', switchType: 'internal', sshHostKeyFingerprint: null },
    dynamic: { interfaceName: 'eth0', addressPolicy: 'dynamic', lastObservedIpv4: '172.22.122.192' },
  },
  authorization: { disposableApproved: false, allowedScenarioIds: [], baselineId: null, recoveryProofId: null, privilegePolicy: 'none' },
})

/** All addresses, IDs and recovery proofs here are synthetic test values. */
export const mockWebProfile = Object.freeze({
  schemaVersion: 1, profileId: 'ubuntu-web-pilot-v1', mode: 'mock-only',
  vm: { name: 'mock-web-vm', vmRef: 'mock:web:001', hypervVmId: '00000000-0000-4000-8000-000000000001', controller: 'hyperv', generation: 2 },
  network: {
    management: { interfaceName: 'eth1', ipv4Address: '192.0.2.2', prefixLength: 24, addressPolicy: 'static-observed', expectedMac: '02:00:00:00:00:02', hostIpv4Address: '192.0.2.1', switchId: 'mock-switch-internal-001', switchName: 'mock-internal', switchType: 'internal', sshHostKeyFingerprint: 'SHA256:mock-only-web-host-key' },
    dynamic: { interfaceName: 'eth0', addressPolicy: 'dynamic', lastObservedIpv4: '198.51.100.10' },
  },
  authorization: { disposableApproved: true, allowedScenarioIds: ['LAB-WEB-001'], baselineId: 'mock-baseline-v1', recoveryProofId: 'mock-recovery-v1', privilegePolicy: 'mock-only' },
})
