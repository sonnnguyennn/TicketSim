import type { ControllerKind, VmController, VmIdentity, VmSnapshot } from './model'

/** Explicit fixtures for tests and UI prototypes; never touches a host VM. */
export class MockReadOnlyVmController implements VmController {
  readonly kind: ControllerKind
  constructor(kind: ControllerKind, private readonly snapshots: ReadonlyMap<string, VmSnapshot> = new Map()) { this.kind = kind }
  async inspect(identity: VmIdentity): Promise<VmSnapshot | null> {
    if (identity.controller !== this.kind) throw new Error('Controller ownership mismatch')
    return this.snapshots.get(identity.id) ?? null
  }
}
