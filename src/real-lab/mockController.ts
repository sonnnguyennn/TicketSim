import type { ControllerKind, VmController, VmIdentity, VmSnapshot } from './model'

/** Explicit fixtures for tests and UI prototypes; never touches a host VM. */
export class MockReadOnlyVmController implements VmController {
  readonly kind: ControllerKind
  constructor(kind: ControllerKind, private readonly snapshots: ReadonlyMap<string, VmSnapshot> = new Map()) { this.kind = kind }
  async inspect(identity: VmIdentity): Promise<VmSnapshot | null> {
    if (identity.controller !== this.kind) throw new Error('Controller ownership mismatch')
    const snapshot = this.snapshots.get(identity.id)
    if (!snapshot) return null
    if (snapshot.identity.id !== identity.id || snapshot.identity.controller !== identity.controller || snapshot.identity.disposable !== identity.disposable) throw new Error('VM identity mismatch')
    return structuredClone(snapshot)
  }
}
