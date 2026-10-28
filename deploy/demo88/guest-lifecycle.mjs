import {readFileSync,writeFileSync,renameSync,mkdirSync} from 'node:fs';
import {dirname} from 'node:path';

// Only identities minted by this demo broker are eligible for expiry.
export class GuestLifecycle {
  constructor({file,domain,ttlSeconds=86400,now=Date.now}) {
    if(!Number.isInteger(ttlSeconds)||ttlSeconds<3600||ttlSeconds>2592000)
      throw new Error('DEMO_GUEST_TTL_SECONDS must be 3600..2592000');
    this.file=file;this.domain=domain;this.ttl=ttlSeconds*1000;this.now=now;
    this.guests={};this.dirty=false;
    try {
      const state=JSON.parse(readFileSync(file,'utf8'));
      if(state.version!==1||!state.guests||Array.isArray(state.guests))throw new Error('Invalid guest lifecycle state');
      for(const [id,entry] of Object.entries(state.guests)) {
        if(!/^[0-9a-f-]{36}$/.test(id)||!Number.isFinite(entry.createdAt)||!Number.isFinite(entry.lastSeen))
          throw new Error('Invalid guest lifecycle entry');
      }
      this.guests=state.guests;
    } catch(error) {if(error.code!=='ENOENT')throw error;}
  }
  eligible(user) {
    return ['user','TENANT_ROLE_USER'].includes(user?.tenantRole) &&
      /^[0-9a-f-]{36}$/.test(user.id) &&
      new RegExp('^guest-[0-9a-f]{24}@'+this.domain.replace(/[.*+?^${}()|[\]\\]/g,'\\$&')+'$').test(user.email||'');
  }
  enroll(user) {
    if(!this.eligible(user))return false;
    if(!Object.hasOwn(this.guests,user.id)) {
      this.guests[user.id]={createdAt:this.now(),lastSeen:this.now()};this.dirty=true;
    }
    return true;
  }
  expired(id) {return !!this.guests[id] && this.now()-this.guests[id].lastSeen>=this.ttl;}
  touch(id) {
    if(!Object.hasOwn(this.guests,id))return;
    this.guests[id].lastSeen=this.now();this.dirty=true;
  }
  sync(users) {
    const ids=new Set();
    for(const user of users)if(this.enroll(user))ids.add(user.id);
    for(const id of Object.keys(this.guests))if(!ids.has(id))this.forget(id);
  }
  forget(id) {delete this.guests[id];this.dirty=true;}
  flush() {
    if(!this.dirty)return;
    mkdirSync(dirname(this.file),{recursive:true,mode:0o700});
    writeFileSync(this.file+'.tmp',JSON.stringify({version:1,guests:this.guests}),{mode:0o600});
    renameSync(this.file+'.tmp',this.file);this.dirty=false;
  }
  async reap(users,remove,active=new Set()) {
    this.sync(users);
    let removed=0;
    for(const user of users) {
      if(removed>=16)break;
      if(!this.eligible(user)||active.has(user.id)||!this.expired(user.id))continue;
      try {await remove(user.id);}catch(error){if(error.status!==404)throw error;}
      this.forget(user.id);removed++;
    }
    this.flush();return removed;
  }
}
