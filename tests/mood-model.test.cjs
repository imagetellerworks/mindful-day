const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const model=require('../mood-model.js'),html=fs.readFileSync(new URL('../index.html',`file://${__filename}`),'utf8');
function sandbox(seed=1){let state=seed;const math=Object.create(Math);math.random=()=>((state=(Math.imul(1664525,state)+1013904223)>>>0)/4294967296);
 const ctx={Math:math,MindfulMood:model,lang:'ko',feel:null,feelingInk:()=> '#24212b',fontOf:()=>({id:'futura',fam:'Jost',tw:500,sw:400}),stampText:()=> 'test',colorNames:()=> 'test',RUNTIME:'FOOTER_SRC',footer:function(){},drawHeader:function(){},contrastInk:function(){}};vm.createContext(ctx);
 const colors=html.slice(html.indexOf('const clamp='),html.indexOf('// ================= 썸네일'));
 const lex=html.slice(html.indexOf('const FEEL_KO='),html.indexOf('let feel=null'));
 const features=html.slice(html.indexOf('function colorFamily('),html.indexOf('function resolveFeeling('));
 const touchCode=['stepTileMorph','stepTouchMove','stepOrbScale','posterTouchTarget','cycleTouchEmotion'].map(n=>functionSource(html,n)).join('\n');
 vm.runInContext(colors+lex+`\nlet tiles=[],chosen=[],placements=[],leaving=[];let testMood,testNow=0,reduce=false,testRect={left:0,top:0,width:400,height:700},testWide=false;const pc={getBoundingClientRect:()=>testRect},document={body:{classList:{contains:id=>id==='wide-scene'&&testWide}}},N=5,TOUCH_SCALE_MS=780,TOUCH_CYCLE_MS=1050,TOUCH_MOVE_MS=1600,performance={now:()=>testNow},touchEase=t=>t*t*t*(t*(6*t-15)+10),easeOut=t=>1-Math.pow(1-t,3);function refreshTiles(){}function groundColors(){return {bg:testMood.background.color};}\n`+features+touchCode+functionSource(html,'buildCode')+`\nthis.api={S,gen,genPalette,paletteCombo,comboColors,rgb2hsl,tf,FEEL_KO,sceneFeatures,MOODS,setScale(slot,value){placements[slot].cs=value;return sceneFeatures(chosen[0]).objects;},exportCode:buildCode,state(){return {chosen:[...chosen],placements,tiles,mood:moodIdx,settings:{...S},input:{mood:testMood.id,orbs:sceneFeatures(chosen[0]).objects,background:S.ground,adjustments:S}};},tap(now=0,reduced=false,slot=null,point=null){testNow=now;reduce=reduced;const affected=cycleTouchEmotion(now,slot,point);return {...this.state(),affected};},setPlacement(slot,data){Object.assign(placements[slot],data);return this.state();},hit(x,y,rect,wide=false){if(rect)testRect=rect;testWide=wide;return posterTouchTarget({clientX:x,clientY:y});},advance(now){testNow=now;tiles.forEach(t=>{stepTileMorph(t,now);t.dirty=false;});placements.forEach((pl,slot)=>{stepTouchMove(pl,now);stepOrbScale(pl,slot,now);});return this.state();},legacy(mood){this.build(mood,[0],{contrast:1.8,sat:1.6,light:-.1});tiles[0].cur=gen({mode:'comp',h:12,tone:{s:1.12,l:-.17,c:1.35}});return {mood:mood.id,orbs:sceneFeatures(0).objects,background:S.ground,adjustments:S};},build(mood,selection,settings={},variants={}){testMood=mood;moodIdx=MOODS.indexOf(mood);Object.assign(S,MindfulMood.defaultsFor(mood.id),{ground:mood.background.id},settings);chosen=selection;placements=chosen.map((_,i)=>({x:.3+i*.2,y:.5,tx:.3+i*.2,ty:.5,tj:1}));tiles=mood.palettes.map((p,i)=>{const combo=paletteCombo(p,variants[i]||'base');const cur=gen(combo);return {combo,cur,from:cur,to:cur,t0:0,dur:0,pendingMeaning:false};});return {mood:mood.id,orbs:sceneFeatures(chosen[0]).objects,background:S.ground,adjustments:S};}};`,ctx);
 return ctx.api;
}
const api=sandbox(),keys=Object.keys(model.MOODS[0].combinations);
const allWords=new Set(model.MOODS.flatMap(m=>[m.word,...m.palettes.flatMap(p=>p.variants.map(v=>v.word)),...Object.values(m.combinations).flatMap(e=>Object.values(e))]));
Object.values(model.ROLE_WORDS).flatMap(Object.values).forEach(w=>allWords.add(w));
test('five agreed moods, five four-layer palettes and 25 explicit combinations each',()=>{
 assert.deepEqual(model.MOODS.map(m=>m.id),['joy','sadness','anger','fear','peace']);
 for(const m of model.MOODS){assert.equal(m.palettes.length,5);assert.equal(new Set(m.palettes.map(p=>p.id)).size,5);assert.equal(Object.keys(m.combinations).length,25);
  for(const p of m.palettes){assert.equal(p.variants.length,3);assert.equal(new Set(p.variants.map(v=>v.word)).size,3);for(const v of p.variants){assert.equal(v.colors.length,4);v.colors.forEach(c=>assert.match(c,/^#[0-9a-f]{6}$/));}}
  const sizes=keys.map(k=>k.split('+').length);assert.deepEqual([1,2,3].map(n=>sizes.filter(x=>x===n).length),[5,10,10]);
 }
});
test('finite bilingual lexicon: <=400, no duplicate translation keys, every output translated',()=>{
 const raw=html.slice(html.indexOf('const FEEL_KO='),html.indexOf('Object.assign(FEEL_KO'));
 const keys=[...raw.matchAll(/^\s*"([^"]+)":/gm)].map(m=>m[1]);assert.equal(keys.length,new Set(keys).size);
 assert.ok(Object.keys(api.FEEL_KO).length<=400);assert.ok(allWords.size<=400);
 for(const w of allWords)assert.ok(api.FEEL_KO[w],`Missing Korean: ${w}`);
 console.log(`Vocabulary: ${allWords.size} active bilingual expressions; ${Object.keys(api.FEEL_KO).length} total dictionary entries.`);
});
function variations(ids){if(!ids.length)return [{}];return variations(ids.slice(1)).flatMap(rest=>['base','soft','bold'].map(v=>({...rest,[ids[0]]:v})));}
test('125 default selections match; all 1875 reference variants remain guarded',()=>{
 let count=0,blocked=0;for(const m of model.MOODS)for(const key of keys){const ids=key.split('+').map(Number);
 assert.equal(model.resolve(api.build(m,ids)).status,'matched',`${m.id} ${key} default`);
 for(const variants of variations(ids)){
 const input=api.build(m,ids,{},variants),r=model.resolve(input);count++;
 assert.ok(['matched','mismatch'].includes(r.status));if(r.status==='mismatch'){assert.equal(r.word,null);blocked++;continue;}
 assert.ok(api.FEEL_KO[r.word]);if(['anger','fear'].includes(m.id))assert.ok(!model.SOOTHING.has(r.word));
 }}assert.equal(count,1875);console.log(`Authored defaults: 125 matched; reference variants: ${count} checked, ${blocked} excluded.`);
});
test('actual generated RGB across seeds, combinations, variants and contrast settings',()=>{
 let checked=0,blocked=0;for(const seed of [7,42]){const a=sandbox(seed);
 for(const m of model.MOODS)for(const key of keys){const ids=key.split('+').map(Number);for(const variants of variations(ids))for(const contrast of [.3,1,1.8]){
 const input=a.build(m,ids,{contrast},variants),r=model.resolve(input);checked++;
 assert.ok(['matched','mismatch'].includes(r.status));if(r.status==='mismatch'){assert.equal(r.word,null);blocked++;continue;}
 if(['anger','fear'].includes(m.id)||r.strength==='strong')assert.ok(!model.SOOTHING.has(r.word));
 assert.equal(model.resolve(input).word,r.word);assert.equal(model.resolve({...input,orbs:[...input.orbs].reverse()}).word,r.word);
 }}}console.log(`Contrast matrix: ${checked} actual-color conditions; ${blocked} incompatible conditions excluded.`);
});
test('pair and trio have authored, different meanings; background keeps the parent',()=>{
 for(const bg of ['peace']){
  const m=model.MOODS[4],pair=model.resolve(api.build(m,[0,2],{ground:bg})),trio=model.resolve(api.build(m,[0,2,3],{ground:bg}));
  assert.notEqual(pair.word,trio.word);assert.equal(pair.mood,'peace');assert.equal(trio.mood,'peace');
 }
});
test('area roles use rendered size, not last click or slot index',()=>{
 const input=api.build(model.MOODS[4],[0,2]);input.orbs[0].area=5;input.orbs[1].area=1;
 assert.equal(model.resolve(input).word,'cherished');input.orbs.reverse();assert.equal(model.resolve(input).word,'cherished');
 input.orbs.find(o=>o.paletteId==='peace.blue').area=12;assert.equal(model.resolve(input).word,'harmonious');
});
test('tension regression: serene category + harsh actual colors rejects all soothing words',()=>{
 const input=api.build(model.MOODS[4],[0,1,2]);for(const o of input.orbs){o.internalContrast=.8;o.backgroundContrast=.7;o.chroma=.24;}
 for(const bg of ['peace']){input.background=bg;const r=model.resolve(input);assert.equal(r.status,'mismatch');assert.equal(r.word,null);}
});
test('changed hue, washed-out scene, absent selection and invalid signatures have no emotional fallback',()=>{
 const input=api.build(model.MOODS[2],[0]);assert.equal(model.resolve({...input,adjustments:{hue:120}}).word,null);
 for(const o of input.orbs){o.light=.92;o.internalContrast=.05;}assert.equal(model.resolve(input).status,'mismatch');
 assert.equal(model.resolve({...input,orbs:[]}).status,'empty');
 assert.equal(model.resolve({...input,mood:'missing'}).status,'unmapped');
 assert.equal(model.resolve({...input,background:'ivory'}).status,'unmapped');
 assert.equal(model.resolve({...input,orbs:[input.orbs[0],input.orbs[0]]}).status,'unmapped');
});
test('UI uses automatic backgrounds, cyclic moods and current-color analysis',()=>{
 assert.ok(!html.includes('id="bgBtn"'));assert.ok(!html.includes('function cycleGround'));assert.match(html,/S.ground=m.background.id/);assert.ok(!html.includes("['ivory'"));assert.ok(!html.includes('moodChooser'));
 assert.match(html,/addEventListener\('click',cycleColors\)/);assert.match(html,/id="currentMood"/);assert.match(html,/tiles\[tileIndex\]\.cur\.layers/);
 assert.ok(!html.includes('moodSceneScores'));assert.ok(!html.includes('baseFeelingWeights'));
});

function moodSwitchSandbox(){
 const synced=[],placementCalls=[],ctx={synced,placementCalls,placements:[{touchActive:true,scaleTween:{from:1}}],leaving:[],MindfulMood:model,MOODS:model.MOODS,S:{szL:2.5,szM:.8,szS:.25},moodIdx:0,KEY:0,KEY_BY_HUE:Array(12).fill(0),rgb2hsl:()=>[0,1,.5],hex2rgb:()=>[0,0,0],paletteCombo:p=>({paletteId:p.id}),tiles:Array.from({length:5},()=>({})),chosen:[0],mkPl:(role,others,jitter)=>{placementCalls.push({role,others,jitter});return {sizeRole:role,tj:1,x:.3,y:.4,tx:.3,ty:.4,cs:null};},renderGround(){},syncSlider:k=>synced.push(k),retarget(){},performance:{now:()=>0},moodTransitionUntil:0,feel:null,prevFeel:null,syncFeelingStatus(){},updateColorUI(){},refreshTiles(){},showToast(){},L:k=>k,clearTimeout(){},feelingTimer:0,setTimeout:()=>0,showPrimaryMood(){}};
 vm.createContext(ctx);vm.runInContext(functionSource(html,'applyMood')+'\n'+functionSource(html,'cycleColors'),ctx);return ctx;
}
test('user-approved mood settings are initial values and replace custom edits on every mood switch',()=>{
 const expected=[{hue:0,sat:1.26,light:-.16,contrast:1},{hue:0,sat:1.2,light:-.1,contrast:.78},{hue:-38,sat:1,light:-.21,contrast:.7},{hue:-40,sat:1,light:0,contrast:1},{hue:0,sat:1,light:-.1,contrast:1}];
 const fresh=sandbox();for(const key of Object.keys(expected[0]))assert.equal(fresh.S[key],expected[0][key]);
 const ctx=moodSwitchSandbox();
 for(let i=0;i<5;i++){Object.assign(ctx.S,{hue:120,sat:.1,light:.3,contrast:1.8});ctx.applyMood(i);for(const key of Object.keys(expected[i]))assert.equal(ctx.S[key],expected[i][key],model.MOODS[i].id+' '+key);assert.equal(ctx.S.ground,model.MOODS[i].id);assert.equal(ctx.placements[0].touchActive,false);assert.equal(ctx.placements[0].scaleTween,null);assert.equal(ctx.synced.length,(i+1)*4);}
 const returned=model.defaultsFor('joy');returned.sat=0;assert.equal(model.defaultsFor('joy').sat,1.26);
});
test('every mood change clears prior selections and touch motion, selecting only its first subtype at baseline size',()=>{
 for(const count of [0,1,2,3])for(let mood=0;mood<5;mood++){
  const ctx=moodSwitchSandbox();ctx.chosen=[4,3,2].slice(0,count);ctx.placements=ctx.chosen.map((_,i)=>({sizeRole:2-i,tj:1.1,cs:1.2,tx:.8,ty:.7,x:.6,y:.5,touchActive:true,scaleTween:{from:1,t0:10},touchMove:{x:.6,y:.5,t0:10},touchAt:10,shakeMotion:{active:true}}));
  const previous=ctx.placements;ctx.leaving=[{idx:1,pl:{cs:.2}}];ctx.applyMood(mood);
  assert.deepEqual([...ctx.chosen],[0]);assert.equal(ctx.placements.length,1);assert.equal(ctx.leaving.length,0);assert.ok(!previous.includes(ctx.placements[0]));
  const pl=ctx.placements[0];assert.equal(pl.x,.56);assert.equal(pl.y,.63);assert.equal(pl.tx,.56);assert.equal(pl.ty,.63);assert.equal(pl.cs,ctx.S.szL);assert.equal(pl.sizeRole,0);assert.equal(pl.tj,1);assert.equal(pl.touchActive,false);assert.equal(pl.scaleTween,null);assert.equal(pl.touchMove,null);assert.ok(!pl.shakeMotion);
  assert.equal(ctx.moodIdx,mood);assert.equal(ctx.S.combo.paletteId,model.MOODS[mood].palettes[0].id);assert.deepEqual(Array.from(ctx.tiles,t=>t.combo.paletteId),model.MOODS[mood].palettes.map(p=>p.id));
  const call=ctx.placementCalls.at(-1);assert.equal(call.role,0);assert.equal(call.others.length,0);assert.deepEqual([...call.jitter],[1,1]);
 }
 const ctx=moodSwitchSandbox();ctx.moodIdx=4;ctx.chosen=[2,3,4];ctx.placements=[{touchActive:true,touchMove:{}},{},{}];ctx.cycleColors();assert.equal(ctx.moodIdx,0);assert.deepEqual([...ctx.chosen],[0]);assert.equal(ctx.S.combo.paletteId,'joy.red');assert.equal(ctx.placements[0].touchMove,null);
});
test('invalid mood indices leave selections, active touch and settings unchanged',()=>{
 const ctx=moodSwitchSandbox();ctx.chosen=[2,4];ctx.placements=[{touchActive:true,touchMove:{x:.2,y:.3},scaleTween:{from:1}},{}];ctx.leaving=[{idx:1}];
 const before=JSON.stringify({chosen:ctx.chosen,placements:ctx.placements,leaving:ctx.leaving,settings:ctx.S,mood:ctx.moodIdx,tiles:ctx.tiles});
 for(const index of [-1,5,1.5,NaN,undefined,'1']){ctx.applyMood(index);assert.equal(JSON.stringify({chosen:ctx.chosen,placements:ctx.placements,leaving:ctx.leaving,settings:ctx.S,mood:ctx.moodIdx,tiles:ctx.tiles}),before);assert.equal(ctx.placementCalls.length,0);assert.equal(ctx.synced.length,0);}
});

test('approved defaults keep labels; large changes are measured relative to each mood default',()=>{
 for(const m of model.MOODS){const input=api.build(m,[0]),defaults=model.defaultsFor(m.id);assert.equal(model.resolve(input).status,'matched');
 for(const settings of [{hue:defaults.hue+31},{light:defaults.light+.201},{sat:.1}])assert.equal(model.resolve({...input,adjustments:{...defaults,...settings}}).reason,'palette-shift');
 }
});

test('scene taps invoke same-mood color cycling and reject non-primary input',()=>{
 const calls=[],ctx={performance:{now:()=>0},posterTouchTarget:()=>({slot:0,x:.5,y:.5}),curSheet:null,guideGone:true,chosen:[2],cycleTouchEmotion:()=>{calls.push('cycle');return [0];},strum:()=>{},showFeeling:i=>calls.push(['feeling',i]),offerShakeAfterTouch:()=>{},updateColorUI:()=>{},swapOrbScales:()=>{throw Error('Tap must cycle feelings instead of swapping sizes');}};
 vm.createContext(ctx);vm.runInContext(functionSource(html,'touchPoster'),ctx);
 for(let i=0;i<6;i++)ctx.touchPoster({isPrimary:true,pointerType:'mouse',button:0,clientX:60,clientY:220});
 assert.equal(calls.length,12);assert.equal(calls[0],'cycle');assert.deepEqual(calls[1],['feeling',2]);
 ctx.touchPoster({isPrimary:false});ctx.touchPoster({pointerType:'mouse',button:2});assert.equal(calls.length,12);
});
test('direct touch cycling defaults to the largest orb through unused base palettes without changing the parent mood or settings',()=>{
 for(const m of model.MOODS)for(const selection of [[4],[0,1],[0,1,2]]){
  const a=sandbox(42);a.build(m,selection);const before=a.state(),positions=JSON.stringify(before.placements.map(p=>[p.x,p.y,p.tx,p.ty])),settings=before.settings;
  let now=0;for(let step=0;step<10;step++){
   const previous=a.state().chosen,occupied=new Set(previous.slice(1));let expected=(previous[0]+1)%5;while(occupied.has(expected))expected=(expected+1)%5;
   const outline=a.state().tiles[previous[0]].cur.layers.map(l=>[l.r,l.ox,l.oy]);const current=a.tap(now);assert.deepEqual(Array.from(current.tiles[expected].to.layers,l=>[l.r,l.ox,l.oy]),Array.from(outline,l=>[...l]));assert.deepEqual([...current.chosen],[expected,...previous.slice(1)]);assert.equal(new Set(current.chosen).size,selection.length);assert.equal(current.mood,model.MOODS.indexOf(m));
   for(const key of ['hue','sat','light','contrast','ground'])assert.equal(current.settings[key],settings[key]);
   assert.equal(current.tiles[expected].combo.variant,'base');assert.equal(current.tiles[expected].combo.paletteId,m.palettes[expected].id);assert.equal(JSON.stringify(current.placements.map(p=>[p.x,p.y,p.tx,p.ty])),positions);
   assert.equal(model.resolve(current.input).status,'transitioning');const settled=a.advance(now+1050);assert.equal(model.resolve(settled.input).status,'matched');now+=1200;
  }
 }
});
test('touch focus follows actual visible radius and keeps other selected orbs unchanged',()=>{
 const a=sandbox();a.build(model.MOODS[0],[0,1,2]);a.setScale(0,.2);a.setScale(1,1.8);a.setScale(2,.3);const before=a.state(),otherColors=[before.tiles[0].cur,before.tiles[2].cur];
 const current=a.tap(10);assert.deepEqual([...current.affected],[1]);assert.deepEqual([...current.chosen],[0,3,2]);assert.equal(current.tiles[0].cur,otherColors[0]);assert.equal(current.tiles[2].cur,otherColors[1]);
});
test('rapid touch restarts from visible colors without accumulating more than 20% growth',()=>{
 const a=sandbox();a.build(model.MOODS[0],[0]);const target=a.state().settings.szL;a.tap(0);let current=a.advance(350);const source=current.tiles[current.chosen[0]].cur,size=current.placements[0].cs;
 assert.ok(size>target&&size<=target*1.2);current=a.tap(350);assert.equal(current.tiles[current.chosen[0]].cur,source);assert.equal(current.tiles[current.chosen[0]].from,source);assert.equal(current.placements[0].cs,size);
 for(let now=400;now<1000;now+=50){current=a.advance(now);const visible=current.tiles[current.chosen[0]].cur,visibleSize=current.placements[0].cs;current=a.tap(now);assert.equal(current.tiles[current.chosen[0]].cur,visible);assert.equal(current.placements[0].cs,visibleSize);assert.ok(current.placements[0].cs<=target*1.2+1e-12);}
 current=a.advance(2050);assert.equal(current.placements[0].cs,target*1.2);assert.equal(current.placements[0].touchActive,true);assert.equal(current.placements[0].scaleTween,null);assert.equal(model.resolve(current.input).status,'matched');
});
test('touch hit mapping prefers the small front orb, uses wide-scene radii, and clamps blank-space destinations',()=>{
 const a=sandbox();a.build(model.MOODS[0],[0,1,2]);
 assert.equal(a.hit(280,350,{left:0,top:0,width:400,height:700}).slot,2);
 const blank=a.hit(396,14);assert.equal(blank.slot,2);assert.equal(blank.x,.94);assert.equal(blank.y,.12);
 for(let i=0;i<3;i++){a.setPlacement(i,{x:.2+i*.3,y:.5});a.state().tiles[i].cur.layers[0].r=.1;}
 const rect={left:100,top:30,width:1000,height:500};assert.equal(a.hit(500,280,rect,true).slot,1);assert.equal(a.hit(500,280,rect,false).slot,0);
});
test('only one touched orb stays 20% larger; switching focus releases the previous orb without changing baseline sizes',()=>{
 const a=sandbox();a.build(model.MOODS[0],[0,1,2]);a.advance(0);const before=a.state(),baseline=before.placements.map(p=>p.cs),settings=JSON.stringify(before.settings),positions=JSON.stringify(before.placements.map(p=>[p.x,p.y,p.tx,p.ty]));
 let current=a.tap(0,false,2);assert.equal(current.placements[2].cs,baseline[2]);current=a.advance(1050);assert.deepEqual(Array.from(current.placements,p=>p.cs),[baseline[0],baseline[1],baseline[2]*1.2]);
 for(let i=0;i<5;i++){a.tap(1200+i*1200,false,2);current=a.advance(2250+i*1200);assert.equal(current.placements[2].cs,baseline[2]*1.2);}
 const visible=Array.from(current.placements,p=>p.cs);current=a.tap(7200,false,1);assert.deepEqual(Array.from(current.placements,p=>p.cs),visible);current=a.advance(8250);
 assert.deepEqual(Array.from(current.placements,p=>p.cs),[baseline[0],baseline[1]*1.2,baseline[2]]);assert.equal(current.placements.filter(p=>p.touchActive).length,1);assert.equal(current.placements[1].touchActive,true);
 assert.equal(JSON.stringify(current.settings),settings);assert.equal(JSON.stringify(current.placements.map(p=>[p.x,p.y,p.tx,p.ty])),positions);assert.deepEqual(Array.from(current.placements,p=>p.tj),[1,1,1]);
});
test('the touched nonlargest orb alone drifts over 1600ms and rapid touches start at its painted position',()=>{
 const a=sandbox();a.build(model.MOODS[0],[0,1,2]);a.advance(0);a.setPlacement(2,{lx:.72,ly:.44});const before=a.state(),others=JSON.stringify(before.placements.slice(0,2));
 let current=a.tap(0,false,2,{x:.9,y:.85}),pl=current.placements[2];assert.equal(pl.x,.72);assert.equal(pl.y,.44);assert.equal(pl.tx,.9);assert.equal(pl.ty,.85);assert.equal(pl.touchMove.t0,0);assert.equal(pl.shakeMotion,null);
 current=a.advance(800);pl=current.placements[2];assert.ok(Math.abs(pl.x-.81)<1e-12);assert.ok(Math.abs(pl.y-.645)<1e-12);assert.ok(pl.touchMove);assert.equal(JSON.stringify(current.placements.slice(0,2)),others);
 const painted={x:pl.x,y:pl.y};a.setPlacement(2,{lx:painted.x,ly:painted.y});current=a.tap(800,false,2,{x:.12,y:.2});pl=current.placements[2];assert.equal(pl.x,painted.x);assert.equal(pl.y,painted.y);assert.equal(pl.touchMove.x,painted.x);
 current=a.advance(2400);pl=current.placements[2];assert.equal(pl.x,.12);assert.equal(pl.y,.2);assert.equal(pl.touchMove,null);assert.equal(JSON.stringify(current.placements.slice(0,2)),others);
});
test('reduced motion settles the next authored palette and size immediately',()=>{
 const a=sandbox();a.build(model.MOODS[1],[0,1,2]);const current=a.tap(0,true,0,{x:.75,y:.6}),tile=current.tiles[current.chosen[0]];
 assert.deepEqual([...current.chosen],[3,1,2]);assert.equal(tile.cur,tile.to);assert.equal(tile.from,tile.to);assert.equal(tile.pendingMeaning,false);assert.equal(current.placements[0].touchActive,true);assert.equal(current.placements[0].scaleTween,null);assert.equal(current.placements[0].cs,current.settings.szL*1.2);assert.equal(current.placements[0].touchMove,null);assert.equal(current.placements[0].x,.75);assert.equal(current.placements[0].y,.6);assert.equal(model.resolve(current.input).status,'matched');
});
test('touch transition gates words until completion and export snapshots the currently painted colors',()=>{
 const a=sandbox();a.build(model.MOODS[0],[0]);let current=a.tap(0);assert.equal(model.resolve(current.input).status,'transitioning');current=a.advance(450);const tile=current.tiles[current.chosen[0]],exported=JSON.parse(a.exportCode().match(/var D=(.*);\n/)[1]);
 assert.equal(model.resolve(current.input).word,null);assert.deepEqual(exported.orbs[0].layers.map(l=>l.c),Array.from(tile.cur.layers,l=>a.tf(l.col).map(Math.round).join(',')));assert.equal(exported.orbs[0].p.s,+current.placements[0].cs.toFixed(4));
 current=a.advance(1050);assert.equal(model.resolve(current.input).status,'matched');assert.equal(current.tiles[current.chosen[0]].pendingMeaning,false);
});
function scaleSandbox(count=3,reduced=false){
 const sizes=[2.5,.8,.25],ctx={SZ:()=>sizes,reduce:reduced,performance:{now:()=>0},TOUCH_SCALE_MS:780,clamp:(v,min=0,max=1)=>Math.max(min,Math.min(max,v)),lerp:(a,b,t)=>a+(b-a)*t,touchEase:t=>t*t*t*(t*(6*t-15)+10)};
 ctx.chosen=Array.from({length:count},(_,i)=>i);ctx.placements=ctx.chosen.map((_,i)=>({sizeRole:i,tj:1,cs:sizes[i],x:.3+i*.2,y:.5,tx:.3+i*.2,ty:.5}));ctx.tiles=Array.from({length:5},(_,i)=>({combo:{paletteId:'test.'+i},cur:{layers:[{r:.4}]}}));
 vm.createContext(ctx);vm.runInContext(['targetOrbScale','currentOrbScale','stepOrbScale','swapOrbScales'].map(n=>functionSource(html,n)).join('\n'),ctx);return ctx;
}
test('one, two and three orbs exchange scale hierarchy; middle orb and colors stay stable',()=>{
 for(const count of [1,2,3]){const a=scaleSandbox(count),before=a.placements.map(p=>p.cs),palettes=a.tiles.map(t=>t.combo),positions=JSON.stringify(a.placements.map(p=>[p.x,p.y,p.tx,p.ty]));
 a.swapOrbScales(0);a.placements.forEach((p,i)=>a.stepOrbScale(p,i,390));assert.ok(a.placements[0].cs<before[0]&&a.placements[0].cs>(count===1?.8:before[count-1]));
 a.placements.forEach((p,i)=>a.stepOrbScale(p,i,780));assert.equal(a.placements[0].cs,count===1?.8:before[count-1]);if(count>1)assert.equal(a.placements[count-1].cs,before[0]);if(count===3)assert.equal(a.placements[1].cs,before[1]);
 assert.equal(JSON.stringify(a.placements.map(p=>[p.x,p.y,p.tx,p.ty])),positions);a.tiles.forEach((t,i)=>assert.equal(t.combo,palettes[i]));a.swapOrbScales(800);a.placements.forEach((p,i)=>a.stepOrbScale(p,i,1580));assert.deepEqual(a.placements.map(p=>p.cs),before);
 }
});
test('rapid taps resume from the visible size and reduced motion settles immediately',()=>{
 const a=scaleSandbox();a.swapOrbScales(0);a.placements.forEach((p,i)=>a.stepOrbScale(p,i,390));const halfway=a.placements.map(p=>p.cs);a.swapOrbScales(390);assert.deepEqual(a.placements.map(p=>p.cs),halfway);a.placements.forEach((p,i)=>a.stepOrbScale(p,i,1170));assert.deepEqual(a.placements.map(p=>p.cs),[2.5,.8,.25]);
 const b=scaleSandbox(2,true);b.swapOrbScales(0);assert.deepEqual(b.placements.map(p=>p.cs),[.8,2.5]);assert.ok(b.placements.every(p=>p.scaleTween===null));assert.equal(scaleSandbox(0).swapOrbScales().length,0);
});
test('selection changes reuse free size roles after swaps',()=>{
 const a=scaleSandbox();Object.assign(a,{S:{},leaving:[],mkPl:i=>({sizeRole:i,tj:1,cs:null}),showFeeling(){},refreshTiles(){},updateColorUI(){}});vm.runInContext(functionSource(html,'toggle'),a);
 a.swapOrbScales(0);a.toggle(0);a.toggle(4);assert.equal(new Set(a.placements.map(p=>p.sizeRole)).size,3);assert.deepEqual([...a.chosen],[1,2,4]);assert.equal(a.placements[2].sizeRole,2);
});
test('emotion area and HTML export use the current animated scale',()=>{
 const a=sandbox(),input=a.build(model.MOODS[4],[0,2]),original=input.orbs[0].area;const changed=a.setScale(0,1.25);assert.ok(Math.abs(changed[0].area/original-.25)<1e-10);
 const exported=JSON.parse(a.exportCode().match(/var D=(.*);\n/)[1]);assert.equal(exported.orbs[0].p.s,1.25);assert.equal(exported.orbs[1].p.s,.8);
 a.setScale(1,0);a.setScale(0,0);const empty=a.setScale(0,0);assert.ok(empty.every(o=>Number.isFinite(o.weight)&&o.weight>0));
});
test('peace keeps a single hue and a luminous core',()=>{
 for(const m of [model.MOODS[4]])for(const p of m.palettes)for(const v of p.variants){const hsl=v.colors.map(c=>api.rgb2hsl([1,3,5].map(i=>parseInt(c.slice(i,i+2),16))));
 const chromatic=hsl.filter(c=>c[1]>.15);for(const c of chromatic){const diff=Math.abs(c[0]-chromatic[0][0]);assert.ok(Math.min(diff,360-diff)<28,`${m.id} ${p.color}`);}
 assert.ok(m.id==='peace'?hsl[3][2]>hsl[0][2]:hsl[3][2]<hsl[0][2]);}
});
test('each single orb has three distinct visible meanings from three color presets',()=>{for(const m of model.MOODS)for(let i=0;i<5;i++){const words=['base','soft','bold'].map(v=>model.resolve(api.build(m,[i],{},{[i]:v})).word);assert.equal(new Set(words).size,3,`${m.id} ${i}: ${words}`);}});

test('original complementary generator with actual harsh RGB cannot output comfort',()=>{for(const seed of [7,42,20261028]){const input=sandbox(seed).legacy(model.MOODS[4]);const result=model.resolve(input);assert.equal(result.status,'mismatch');assert.equal(result.reason,'contrast');assert.equal(result.word,null);}});
function functionSource(source,name){const start=source.indexOf('function '+name+'(');assert.ok(start>=0,name);let i=source.indexOf('{',start),depth=1;for(i++;depth&&i<source.length;i++){if(source[i]==='{')depth++;if(source[i]==='}')depth--;}return source.slice(start,i);}
test('original palette generator and orb renderer match both pinned backups and main',()=>{const cp=require('node:child_process');for(const ref of ['64468a3','f4376cf','16cf33b']){const source=cp.execFileSync('git',['show',ref+':index.html'],{encoding:'utf8',cwd:__dirname});for(const name of ['genPalette','hueSet','toneOK','drawOrb'])assert.equal(functionSource(html,name),functionSource(source,name),ref+' '+name);}});
test('sadness subtypes keep the user-assigned words across rendered seeds and contrast settings',()=>{
 const expected=['heartsore','regretful','melancholic','resigned','wistful'];
 for(const seed of [7,42,20261028]){const a=sandbox(seed);for(let i=0;i<5;i++)for(const contrast of [.3,1,1.8]){
 const input=a.build(model.MOODS[1],[i],{contrast}),result=model.resolve(input);assert.equal(result.status,'matched');assert.equal(result.word,expected[i]);if(i===3)assert.equal(a.FEEL_KO[result.word],'체념한');
 }}
});
test('feeling ink follows the painted surface without text outlines',()=>{
 function sampleInk(rgb){const sample={clearRect(){},drawImage(){},getImageData(){return {data:Array.from({length:9},()=>[...rgb,255]).flat()};}};
 const ctx={performance:{now:()=>0},document:{createElement:()=>({getContext:()=>sample})},WeakMap};vm.createContext(ctx);vm.runInContext(functionSource(html,'contrastInk'),ctx);
 return ctx.contrastInk({canvas:{width:100,height:160},getTransform:()=>({a:1,b:0,c:0,d:1,e:0,f:0})},50,80,50,30,'fallback');}
 assert.equal(sampleInk([241,243,245]),'#24212b');assert.equal(sampleInk([16,29,56]),'#f7f5fa');assert.ok(!html.includes('strokeText('));
});

test('anger subtypes keep user-assigned words and exact Korean labels at high contrast',()=>{
 const expected=['angry','indignant','frustrated','confused','resentful'],ko=['화가 난','불공평한','답답한','혼란스러운','억울한'];
 for(const seed of [7,42,20261028]){const a=sandbox(seed);for(let i=0;i<5;i++)for(const contrast of [.3,1,1.8]){const result=model.resolve(a.build(model.MOODS[2],[i],{contrast}));assert.equal(result.status,'matched');assert.equal(result.word,expected[i]);assert.equal(a.FEEL_KO[result.word],ko[i]);}}
});

test('custom sizes with unequal orb geometry exchange visible radii exactly',()=>{
 const a=scaleSandbox(2);a.SZ=()=>[.6,.65,.25];a.tiles[0].cur.layers[0].r=.4;a.tiles[1].cur.layers[0].r=.3;a.placements[0].tj=1.1;a.placements[1].tj=.9;a.placements.forEach((p,i)=>p.cs=a.targetOrbScale(p,i));
 const before=a.placements.map((p,i)=>a.tiles[i].cur.layers[0].r*p.cs);assert.ok(before[0]>before[1]);a.swapOrbScales(0);a.placements.forEach((p,i)=>a.stepOrbScale(p,i,780));const after=a.placements.map((p,i)=>a.tiles[i].cur.layers[0].r*p.cs);
 assert.ok(Math.abs(after[0]-before[1])<1e-12);assert.ok(Math.abs(after[1]-before[0])<1e-12);
});

test('size-swapped small orbs are painted in front without reordering selection',()=>{
 const a=scaleSandbox(2,true),painted=[];Object.assign(a,{clock:0,S:{speed:1,drift:0},leaving:[],TAU:Math.PI*2,drawOrb:(_ctx,p)=>painted.push(a.tiles.findIndex(t=>t.cur===p))});a.placements.forEach(p=>Object.assign(p,{amp:0,ph1:0,ph2:0,ph3:0,f1:0,f2:0}));vm.runInContext(functionSource(html,'drawSceneOrbs'),a);
 a.swapOrbScales(0);a.drawSceneOrbs({},100,160);assert.deepEqual(painted,[1,0]);assert.deepEqual([...a.chosen],[0,1]);
});

test('all moods share core and support sizes while anger keeps its stronger same-color gradient',()=>{
 for(const seed of [7,42,20261028]){const a=sandbox(seed);for(const m of model.MOODS)for(const p of m.palettes){const orb=a.gen(a.paletteCombo(p)),ratio=orb.layers[3].r/orb.layers[1].r,halo=orb.layers[2].r/orb.layers[1].r;
 assert.ok(ratio>=.25&&ratio<=.48);assert.ok(halo>=.55&&halo<=.8);assert.equal(m.coreRadius,undefined);assert.equal(m.innerRadius,undefined);
 if(m.id==='anger'){const swatch=a.comboColors(a.paletteCombo(p));assert.equal(swatch[2],swatch[3]);assert.deepEqual(orb.layers[2].col,orb.layers[3].col);assert.ok(orb.layers[2].soft>=.82&&orb.layers[2].soft<=.95);assert.ok(orb.layers[3].soft>=.50&&orb.layers[3].soft<=.70);assert.equal(orb.layers[2].a,.82);assert.equal(orb.layers[3].a,.98);assert.equal(orb.layers[2].ox,orb.layers[3].ox);assert.equal(orb.layers[2].oy,orb.layers[3].oy);assert.ok(Math.hypot(orb.layers[3].ox,orb.layers[3].oy)<=orb.layers[1].r*.18);}}}
});

test('sunny and mellow cores keep the requested yellow character after the default transform',()=>{
 for(const [moodIndex,hueRange] of [[0,[55,68]],[4,[48,65]]]){const m=model.MOODS[moodIndex];api.build(m,[1]);const colors=m.palettes[1].variants[0].colors.map(c=>api.tf([1,3,5].map(i=>parseInt(c.slice(i,i+2),16)))),core=api.rgb2hsl(colors[3]);assert.ok(core[0]>=hueRange[0]&&core[0]<=hueRange[1]);assert.ok(core[2]>.6);
 if(moodIndex===0){assert.ok(core[1]>.95);assert.ok(api.rgb2hsl(colors[0])[0]<40);}else assert.ok(api.rgb2hsl(colors[0])[0]>48);
 }
});

test('all base selections preserve meaning at approved settings across four generated scenes',()=>{
 for(const seed of [7,42,20261028,953]){const a=sandbox(seed);for(const m of model.MOODS)for(const key of keys){const result=model.resolve(a.build(m,key.split('+').map(Number)));assert.equal(result.status,'matched',`${seed} ${m.id} ${key}: ${result.reason}`);}}
});

test('resigned uses a black exterior and neutral gray core after sadness defaults',()=>{
 const m=model.MOODS[1],p=m.palettes[3];api.build(m,[3]);const colors=p.variants[0].colors.map(c=>api.tf([1,3,5].map(i=>parseInt(c.slice(i,i+2),16))));assert.ok(colors[0].every(c=>c<16));assert.ok(colors[3].every(c=>c>125&&c<170));assert.ok(Math.max(...colors[3])-Math.min(...colors[3])<1);assert.equal(model.resolve(api.build(m,[3])).word,'resigned');assert.equal(api.FEEL_KO.resigned,'체념한');
});
