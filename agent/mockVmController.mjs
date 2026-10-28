import { LabError } from './errors.mjs'

/** In-memory VM observation only; deliberately has no lifecycle methods. */
export class MockVmController {
  constructor(snapshots = new Map([['mock:web:001', { vmRef: 'mock:web:001', controller: 'hyperv', disposable: true, powerState: 'running', simulated: true }]])) {
    this.snapshots = snapshots
  }
  async inspect(target) {
    if (!target || !target.vmRef?.startsWith('mock:')) throw new LabError('REAL_VM_FORBIDDEN')
    const snapshot = this.snapshots.get(target.vmRef)
    if (!snapshot) return null
    if (snapshot.vmRef !== target.vmRef || snapshot.controller !== target.controller || snapshot.disposable !== target.disposable || snapshot.simulated !== true) throw new LabError('MOCK_VM_IDENTITY_MISMATCH')
    return structuredClone(snapshot)
  }
}
