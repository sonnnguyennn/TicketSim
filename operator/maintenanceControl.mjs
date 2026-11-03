import { randomUUID } from 'node:crypto'

/** Trusted installer/Operator orchestration only, no HTTP surface or default
 * process-stopping implementation. Failed checks retain the durable gate for
 * explicit reconciliation; ownership never expires or transfers automatically.
 */
export class MaintenanceControl {
  constructor({journal,inspectLegacy,quiesceLegacy}={}){
    if(!journal||typeof inspectLegacy!=='function'||typeof quiesceLegacy!=='function')throw new Error('MAINTENANCE_DEPENDENCIES_REQUIRED')
    Object.assign(this,{journal,inspectLegacy,quiesceLegacy})
  }
  async acquire(){
    const lock=this.journal.acquireMaintenance(randomUUID())
    try{
      // Publish lock before awaits: all new writers see maintenance throughout.
      // The trusted inspector accounts for this exact maintenance owner;
      // other control locks and unresolved new work must still block it.
      const before=await this.inspectLegacy(lock.ownerId)
      if(before?.stateClear!==true)throw new Error('LEGACY_RUNTIME_REQUIRES_REVIEW_GATE_RETAINED')
      this.journal.recordMaintenance(lock.ownerId,'legacy_state_clear')
      this.journal.recordMaintenance(lock.ownerId,'quiescing_legacy')
      const stopped=await this.quiesceLegacy()
      if(stopped?.admissionQuiesced!==true)throw new Error('LEGACY_ADMISSION_NOT_QUIESCED_GATE_RETAINED')
      this.journal.recordMaintenance(lock.ownerId,'legacy_quiesced')
      const after=await this.inspectLegacy(lock.ownerId)
      if(after?.stateClear!==true)throw new Error('LEGACY_STATE_CHANGED_GATE_RETAINED')
      this.journal.recordMaintenance(lock.ownerId,'legacy_state_rechecked')
      return {...lock,legacyAdmissionQuiesced:true}
    }catch(error){
      error.maintenanceOwnerId=lock.ownerId
      try{this.journal.recordMaintenance(lock.ownerId,'maintenance_failed')}catch{/* retain original failure and durable gate */}
      throw error
    }
  }
  async releaseAfterVerification(lock,verifyInstallation){
    if(lock?.legacyAdmissionQuiesced!==true||typeof verifyInstallation!=='function')throw new Error('MAINTENANCE_VERIFICATION_REQUIRED')
    this.journal.recordMaintenance(lock.ownerId,'installation_verifying')
    const installed=await verifyInstallation()
    if(installed?.verified!==true)throw new Error('INSTALLATION_NOT_VERIFIED_GATE_RETAINED')
    const current=await this.inspectLegacy(lock.ownerId)
    if(current?.stateClear!==true)throw new Error('LEGACY_STATE_CHANGED_GATE_RETAINED')
    this.journal.recordMaintenance(lock.ownerId,'installation_verified')
    this.journal.releaseMaintenance(lock.ownerId)
  }
}
