(function(root,factory){
'use strict';
if(typeof module==='object'&&module.exports)module.exports=factory(require('./color-feedback-model.js'));
else root.MindfulFeedbackStore=factory(root.ColorFeedback);
})(typeof window==='object'?window:this,function(ColorFeedback){
'use strict';
if(!ColorFeedback||typeof ColorFeedback.validateRecord!=='function')throw new Error('ColorFeedback must be loaded first');

const SCHEMA_VERSION='mindful-feedback-store/v1',EXPORT_VERSION='color-feedback-export/v1';
const DEFAULT_KEY='mindful-day.color-feedback.v1',MAX_RECORDS=1000,MAX_BYTES=1024*1024;
class FeedbackStoreError extends Error{
 constructor(code,message,cause){super(message);this.name='FeedbackStoreError';this.code=code;if(cause)this.cause=cause;}
}
const fail=(code,message,cause)=>{throw new FeedbackStoreError(code,message,cause);};
const copy=value=>JSON.parse(JSON.stringify(value));
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function bytes(value){let n=0;for(const c of value){const p=c.codePointAt(0);n+=p<128?1:p<2048?2:p<65536?3:4;}return n;}
function recordKey(record){
 const value=JSON.stringify(record);let a=2166136261,b=2246822507;
 for(let i=0;i<value.length;i++){const c=value.charCodeAt(i);a=Math.imul(a^c,16777619);b=Math.imul(b^c,3266489909);}
 return (a>>>0).toString(16).padStart(8,'0')+(b>>>0).toString(16).padStart(8,'0');
}
function normalize(record){
 let validation;
 try{validation=ColorFeedback.validateRecord(record);}catch(error){fail('INVALID_RECORD','The feedback record could not be validated',error);}
 if(!validation.ok)fail('INVALID_RECORD',validation.errors.join('; '));
 // Persist rejection rounds only as part of a validated, explicit human
 // choice. The snapshot and every displayed pair stay together; no unchosen
 // proposal becomes a vote. The existing payload limit bounds full histories
 // without silently dropping earlier rounds or arbitrary caller metadata.
 const normalized={schemaVersion:record.schemaVersion,id:record.id,createdAt:record.createdAt,generatorVersion:record.generatorVersion,modelVersion:record.modelVersion,sceneKey:record.sceneKey,proposalToken:record.proposalToken,scene:ColorFeedback.canonicalScene(record.scene),suggestions:record.suggestions.map(w=>({id:w.id,ko:w.ko,en:w.en})),selectedWord:record.selectedWord,source:'human-choice'};
 // Omit this field for legacy records so their persisted ACK checksum and
 // exports remain stable after an upgrade.
 if(Array.isArray(record.history))normalized.history=record.history.map(round=>record.schemaVersion==='color-feedback/v4'?{family:round.family,page:round.page,candidates:round.candidates.slice(),action:'rejected'}:record.schemaVersion==='color-feedback/v3'?{page:round.page,candidates:round.candidates.slice(),action:'rejected'}:{candidates:round.candidates.slice(),action:'rejected'});
 if(record.schemaVersion==='color-feedback/v3'||record.schemaVersion==='color-feedback/v4'){
  normalized.page=record.page;
  normalized.timeline=record.timeline.map(event=>record.schemaVersion==='color-feedback/v4'?(event.action==='direction'?{action:'direction',direction:event.direction,fromFamily:event.fromFamily,toFamily:event.toFamily}:{action:event.action,family:event.family,page:event.page,candidates:event.candidates.slice()}):{page:event.page,candidates:event.candidates.slice(),action:event.action});
  if(record.schemaVersion==='color-feedback/v4')normalized.family=record.family;
 }
 return freeze(normalized);
}
function create({storage,key=DEFAULT_KEY,transport}={}){
 if(!storage||typeof storage.getItem!=='function'||typeof storage.setItem!=='function')fail('STORAGE_UNAVAILABLE','A writable device-local storage adapter is required');
 if(typeof key!=='string'||!key.length||key.length>160)throw new TypeError('The storage key is invalid');
 if(transport!=null&&typeof transport!=='function')throw new TypeError('The optional feedback transport must be a function');
 let cachedRaw,cache,inflight=null;
 const empty=()=>({schemaVersion:SCHEMA_VERSION,scope:'device-local',records:[],sync:{}});
 function read(){
  let raw;try{raw=storage.getItem(key);}catch(error){fail('STORAGE_UNAVAILABLE','Device-local feedback storage cannot be read',error);}
  if(raw===cachedRaw&&cache)return cache;
  if(raw==null){cachedRaw=raw;cache=freeze(empty());return cache;}
  if(typeof raw!=='string'||bytes(raw)>MAX_BYTES)fail('STORAGE_CORRUPT','Stored feedback exceeds its size limit');
  let parsed;try{parsed=JSON.parse(raw);}catch(error){fail('STORAGE_CORRUPT','Stored feedback is not valid JSON; it was left unchanged',error);}
  if(!parsed||parsed.schemaVersion!==SCHEMA_VERSION||parsed.scope!=='device-local'||!Array.isArray(parsed.records)||parsed.records.length>MAX_RECORDS||!parsed.sync||typeof parsed.sync!=='object'||Array.isArray(parsed.sync))fail('STORAGE_CORRUPT','Stored feedback has an unsupported format; it was left unchanged');
  const ids=new Set(),scenes=new Set(),records=[];
  try{
   for(const input of parsed.records){
    const record=normalize(input);
    if(ids.has(record.id)||scenes.has(record.sceneKey))throw new Error('Stored feedback contains duplicate choices');
    ids.add(record.id);scenes.add(record.sceneKey);records.push(record);
   }
  }catch(error){fail('STORAGE_CORRUPT','Stored feedback contains an invalid choice; it was left unchanged',error);}
  const sync={};
  for(const [id,meta] of Object.entries(parsed.sync)){
   const record=records.find(r=>r.id===id);
   if(!record||!meta||meta.status!=='sent'||meta.recordKey!==recordKey(record))fail('STORAGE_CORRUPT','Stored feedback acknowledgement is invalid; it was left unchanged');
   sync[id]={status:'sent',recordKey:meta.recordKey};
  }
  cachedRaw=raw;cache=freeze({schemaVersion:SCHEMA_VERSION,scope:'device-local',records,sync});return cache;
 }
 function write(next){
  if(next.records.length>MAX_RECORDS)fail('STORAGE_LIMIT',`Device-local feedback is limited to ${MAX_RECORDS} choices; export it before adding more`);
  const raw=JSON.stringify(next);
  if(bytes(raw)>MAX_BYTES)fail('STORAGE_LIMIT','Device-local feedback is limited to 1 MiB; export it before adding more');
  try{storage.setItem(key,raw);}catch(error){fail(error&&/quota/i.test(error.name||'')?'STORAGE_QUOTA':'STORAGE_WRITE_FAILED','The choice was not saved to device-local storage',error);}
  cachedRaw=raw;cache=freeze(next);return cache;
 }
 function list(){return freeze(copy(read().records));}
 function stats(){const state=read(),sent=Object.keys(state.sync).length;return freeze({scope:'device-local',count:state.records.length,pending:state.records.length-sent,sent,limit:MAX_RECORDS,maxBytes:MAX_BYTES});}
 function save(input){
  let record=normalize(input);const state=read();
  const sameId=state.records.find(r=>r.id===record.id),sameScene=state.records.find(r=>r.sceneKey===record.sceneKey);
  if(sameId&&sameId.sceneKey!==record.sceneKey)fail('ID_CONFLICT','This feedback ID already belongs to a different color snapshot');
  const previous=sameScene||sameId;
  if(previous){
   // A changed opinion about the same snapshot is a revision, never another
   // independent vote. Keep the stable ID and original creation timestamp.
   record=normalize({...record,id:previous.id,createdAt:previous.createdAt});
   if(JSON.stringify(record)===JSON.stringify(previous))return freeze({record:freeze(copy(previous)),status:'local',count:state.records.length});
  }
  const records=state.records.slice(),sync={...state.sync};
  if(previous){records[records.findIndex(r=>r.id===previous.id)]=record;delete sync[previous.id];}
  else records.push(record);
  const saved=write({schemaVersion:SCHEMA_VERSION,scope:'device-local',records,sync});
  return freeze({record:freeze(copy(record)),status:'local',count:saved.records.length});
 }
 function exportJSON(){const records=list(),feedbackVersion=records.some(record=>record.schemaVersion==='color-feedback/v4')?ColorFeedback.EXPLORATION_FEEDBACK_VERSION:records.some(record=>record.schemaVersion==='color-feedback/v3')?ColorFeedback.PAGE_FEEDBACK_VERSION:ColorFeedback.FEEDBACK_VERSION;return JSON.stringify({schemaVersion:EXPORT_VERSION,scope:'device-local',feedbackVersion,records},null,2);}
 async function flush(){
  const start=read();
  if(!transport)return freeze({status:'local',sent:0,pending:stats().pending,failed:[]});
  const pending=start.records.filter(record=>!Object.prototype.hasOwnProperty.call(start.sync,record.id));let sent=0;const failed=[];
  for(const record of pending){
   try{
    const ack=await transport(freeze(copy(record)));
    if(!ack||ack.id!==record.id||ack.stored!==true)throw new Error('The transport did not acknowledge this feedback ID as stored');
    // A newer human choice may have been saved while transport was in flight.
    // An old ACK never marks that revision as synchronized.
    const current=read(),now=current.records.find(r=>r.id===record.id);
    if(!now||recordKey(now)!==recordKey(record))continue;
    write({schemaVersion:SCHEMA_VERSION,scope:'device-local',records:current.records.slice(),sync:{...current.sync,[record.id]:{status:'sent',recordKey:recordKey(record)}}});sent++;
   }catch(error){failed.push({id:record.id,error:String(error&&error.message||error)});}
  }
  const remaining=stats().pending;
  return freeze({status:remaining?'pending':'synced',sent,pending:remaining,failed});
 }
 function sync(){if(!inflight)inflight=flush().finally(()=>{inflight=null;});return inflight;}
 read();
 return Object.freeze({list,save,sync,exportJSON,stats});
}
return Object.freeze({create,SCHEMA_VERSION,EXPORT_VERSION,DEFAULT_KEY,MAX_RECORDS,MAX_BYTES,FeedbackStoreError});
});
