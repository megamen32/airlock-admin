import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {GuestLifecycle} from './guest-lifecycle.mjs';

test('only broker guests expire; activity survives restart and deletion failure',async()=>{
 const dir=mkdtempSync(join(tmpdir(),'airlock-guest-ttl-'));
 try {
  let now=1000000000;
  const options={file:join(dir,'state.json'),domain:'demo.example.test',now:()=>now};
  const guest={id:'11111111-1111-4111-8111-111111111111',email:'guest-aaaaaaaaaaaaaaaaaaaaaaaa@demo.example.test',tenantRole:'TENANT_ROLE_USER'};
  const admin={...guest,id:'22222222-2222-4222-8222-222222222222',tenantRole:'TENANT_ROLE_ADMIN'};
  const realUser={...guest,id:'33333333-3333-4333-8333-333333333333',email:'person@demo.example.test'};
  let s=new GuestLifecycle(options);s.sync([guest,admin,realUser]);s.flush();
  assert.deepEqual(Object.keys(s.guests),[guest.id]);
  now+=86399000;assert.equal(s.expired(guest.id),false);
  s.touch(guest.id);s.flush();s=new GuestLifecycle(options);
  now+=86400000;assert.equal(s.expired(guest.id),true);
  let deleted=[];
  assert.equal(await s.reap([guest,admin,realUser],async id=>deleted.push(id),new Set([guest.id])),0);
  assert.deepEqual(deleted,[]);
  await assert.rejects(s.reap([guest],async()=>{throw new Error('native failure');}));
  assert.ok(s.guests[guest.id]);
  assert.equal(await s.reap([guest,admin,realUser],async id=>deleted.push(id)),1);
  assert.deepEqual(deleted,[guest.id]);assert.equal(new GuestLifecycle(options).guests[guest.id],undefined);
 } finally {rmSync(dir,{recursive:true,force:true});}
});
