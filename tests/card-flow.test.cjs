'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),M=require('../spatial-model.js');

test('card flow travels the same distance at different frame rates',()=>{
 for(const view of ['ribbon','helix','wall']){
  const distance=frames=>Array.from({length:frames},()=>M.flowDelta(view,1000/frames)).reduce((a,b)=>a+b,0);
  assert.ok(Math.abs(distance(30)-distance(120))<1e-10,view);
  assert.ok(distance(60)>0,view);
 }
 assert.equal(M.flowDelta('canvas',1000),0);
 assert.equal(M.flowDelta('ribbon',-1),0);
});

test('every animation frame advances a small positive distance',()=>{
 for(const view of ['ribbon','helix','wall'])for(const dt of [8,16,33,40]){
  assert.ok(M.flowDelta(view,dt)>0&&M.flowDelta(view,dt)<1,view);
 }
});

test('virtual cards cross the last-to-first color boundary without a geometry jump',()=>{
 assert.deepEqual([218,219,220].map(i=>M.mod(i,219)),[218,0,1]);
 for(const view of ['ribbon','helix','wall']){
  const axis=view==='ribbon'?'x':'y';
  const points=[218.99,219,219.01].map(position=>M.geometry(view,219-position,219,position,false,1000,228));
  assert.ok(points[0][axis]>points[1][axis]&&points[1][axis]>points[2][axis],view);
  assert.ok(Math.abs(points[2][axis]-points[0][axis])<5,view);
 }
});
