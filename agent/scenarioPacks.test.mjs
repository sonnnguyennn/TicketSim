import { expect,it } from 'vitest'
import { assertPackExecutable,getPackBlueprint,listPlannedPacks,validatePackBlueprint } from './scenarioPacks.mjs'

it('keeps every new pack unavailable and omits execution and root-cause metadata from catalog',()=>{
  const catalog=listPlannedPacks()
  expect(catalog.map(entry=>entry.id)).toEqual(['LAB-TLAB-002','LAB-TLAB-003','LAB-TLAB-007'])
  for(const entry of catalog){
    expect(entry.availableForRealVm).toBe(false)
    expect(entry.blockers).toContain('GUEST_BOOTSTRAP_NOT_QUALIFIED')
    expect(entry).not.toHaveProperty('actions')
    expect(entry).not.toHaveProperty('checks')
    expect(()=>assertPackExecutable(entry.id)).toThrow('SCENARIO_PACK_NOT_QUALIFIED')
  }
  catalog[0].availableForRealVm=true
  expect(listPlannedPacks()[0].availableForRealVm).toBe(false)
})

it('rejects script injection, arbitrary endpoints, target drift and unqualified activation',()=>{
  const base=getPackBlueprint('LAB-TLAB-002')
  for(const patch of [{script:'sudo bash'},{vmRef:'hyperv:lab1'},{status:'qualified'},{checkpointId:'other'},{limits:{...base.limits,prepareSeconds:Infinity}}]){
    expect(()=>validatePackBlueprint({...base,...patch})).toThrow('INVALID_SCENARIO_PACK')
  }
  for(const patch of [{actions:{...base.actions,prepare:'real-web-stop-nginx-v1'}},{website:{...base.website,port:18081}},{checks:{...base.checks,grade:['httpContent']}}]){
    expect(()=>validatePackBlueprint({...base,...patch})).toThrow('SCENARIO_PACK_BINDING_MISMATCH')
  }
  expect(()=>validatePackBlueprint({...base,website:{...base.website,url:'http://localhost:4175'}})).toThrow('INVALID_SCENARIO_PACK')
  expect(()=>getPackBlueprint('LAB-TLAB-006')).toThrow('UNKNOWN_SCENARIO_PACK')
})

it('returns immutable authored contracts and accepts reordered JSON keys',()=>{
  const entry=getPackBlueprint('LAB-TLAB-007')
  expect(()=>{entry.actions.prepare='evil'}).toThrow()
  const candidate=structuredClone(entry)
  candidate.actions={recover:entry.actions.recover,inject:entry.actions.inject,prepare:entry.actions.prepare}
  expect(validatePackBlueprint(candidate).website.port).toBe(18081)
})
