(function(root,factory){
'use strict';
if(typeof module==='object'&&module.exports)module.exports=factory();else root.ColorNameContext=factory();
})(typeof window==='object'?window:this,function(){
'use strict';
const VERSION='color-name-context/2026-10-28.v1';
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
const clone=value=>JSON.parse(JSON.stringify(value));
const finite=value=>typeof value==='number'&&Number.isFinite(value);
const round=value=>Math.round(value*1e6)/1e6;
const SOURCES=[
 {id:'css-names',title:'CSS Color Module Level 4 · Named colors',publisher:'W3C',url:'https://www.w3.org/TR/css-color-4/#named-colors',kind:'naming-standard'},
 {id:'figma-names',title:'Color meanings and named color reference',publisher:'Figma',url:'https://www.figma.com/colors/',kind:'design-color-reference'},
 {id:'figma-avocado',title:'Avocado Green · #568203',publisher:'Figma',url:'https://www.figma.com/colors/avocado-green/',kind:'design-color-reference'},
 {id:'figma-mint',title:'Mint Green · #ADEBB3',publisher:'Figma',url:'https://www.figma.com/colors/mint-green/',kind:'design-color-reference'},
 {id:'figma-sage',title:'Green Sage · #98A869',publisher:'Figma',url:'https://www.figma.com/colors/green-sage/',kind:'design-color-reference'},
 {id:'ng-ultramarine',title:'Studying Raphael · Pigments and medium',publisher:'The National Gallery, London',url:'https://www.nationalgallery.org.uk/research/publications/studying-raphael/studying-raphael-pigments-and-medium',kind:'museum-research'},
 {id:'met-egyptian-blue',title:'Lump of Blue Paste · object 36.3.202',publisher:'The Metropolitan Museum of Art',url:'https://www.metmuseum.org/art/collection/search/568012',kind:'museum-collection'},
 {id:'met-cochineal',title:'Cochineal Red: The Art History of a Color',publisher:'The Metropolitan Museum of Art',url:'https://resources.metmuseum.org/resources/metpublications/pdf/Cochineal_Red_the_art_history_of_a_color.pdf',kind:'museum-publication'},
 {id:'kelsey-purple',title:'Ancient Color · Purple Pigments',publisher:'Kelsey Museum of Archaeology, University of Michigan',url:'https://exhibitions.kelsey.lsa.umich.edu/ancient-color/map_purple.php',kind:'museum-exhibition'},
 {id:'loc-verdigris',title:'Corrosive Media: Verdigris',publisher:'Library of Congress',url:'https://www.loc.gov/preservation/scientists/projects/verdigris.html',kind:'conservation-research'},
 {id:'raa-ochre',title:'Traditional Swedish Colours · Yellow ochre',publisher:'Swedish National Heritage Board',url:'https://www.raa.se/in-english/cultural-heritage/traditional-swedish-colours-kulturkulor/yellow-ochre/',kind:'heritage-research'},
 {id:'met-ancient-pigments',title:'Chroma · Pigment Glossary',publisher:'The Metropolitan Museum of Art',url:'https://www.metmuseum.org/zh/exhibitions/chroma/glossary',kind:'museum-exhibition'},
 {id:'adobe-context',title:'A guide to color meaning',publisher:'Adobe',url:'https://www.adobe.com/creativecloud/design/discover/color-meaning.html',kind:'design-guide'}
].map(source=>({...source,accessedAt:'2026-10-28'}));

// These names label sRGB appearance. They do not identify a physical pigment.
// CSS supplies exact standardized RGB anchors; the three plant names use the
// stated Figma reference, whose naming convention can differ from other lists.
const ANCHORS=[
 ['white','White','흰색','#ffffff','neutral'],['off-white','Off White','오프화이트','#e6e6e6','neutral'],['light-gray','Light Gray','밝은 회색','#d3d3d3','neutral'],['silver','Silver','은회색','#c0c0c0','neutral'],['gray','Gray','회색','#808080','neutral'],['dim-gray','Dim Gray','짙은 회색','#696969','neutral'],['charcoal','Charcoal','차콜','#333333','neutral'],['near-black','Near Black','먹색','#181818','neutral'],['black','Black','검정','#000000','neutral'],
 ['crimson','Crimson','크림슨','#dc143c','red'],['firebrick','Firebrick','벽돌 빨강','#b22222','red'],['dark-red','Dark Red','짙은 빨강','#8b0000','red'],['tomato','Tomato','토마토 빨강','#ff6347','red'],['salmon','Salmon','살몬','#fa8072','red'],['coral','Coral','코랄','#ff7f50','orange'],['dark-orange','Dark Orange','짙은 주황','#ff8c00','orange'],['orange','Orange','주황','#ffa500','orange'],['peach-puff','Peach Puff','피치 퍼프','#ffdab9','orange'],['papaya-whip','Papaya Whip','파파야 휩','#ffefd5','orange'],
 ['lemon','Lemon Yellow','레몬 노랑','#fff44f','yellow'],['gold','Gold','금빛 노랑','#ffd700','yellow'],['goldenrod','Goldenrod','골든로드','#daa520','yellow'],['khaki','Khaki','카키','#f0e68c','yellow'],['lemon-chiffon','Lemon Chiffon','레몬 시폰','#fffacd','yellow'],['olive','Olive','올리브','#808000','green'],['yellow-green','Yellow Green','연두','#9acd32','green'],['avocado-green','Avocado Green','아보카도 그린','#568203','green','figma-names'],['sage-green','Sage Green','세이지 그린','#98a869','green','figma-names'],['mint-green','Mint Green','민트 그린','#adebb3','green','figma-names'],['sea-green','Sea Green','씨 그린','#2e8b57','green'],['forest-green','Forest Green','포레스트 그린','#228b22','green'],['dark-green','Dark Green','짙은 초록','#006400','green'],
 ['pale-turquoise','Pale Turquoise','옅은 청록','#afeeee','teal'],['aquamarine','Aquamarine','아쿠아마린','#7fffd4','teal'],['turquoise','Turquoise','터쿼이즈','#40e0d0','teal'],['teal','Teal','틸','#008080','teal'],['dark-cyan','Dark Cyan','짙은 청록','#008b8b','teal'],['light-blue','Light Blue','밝은 파랑','#add8e6','blue'],['sky-blue','Sky Blue','하늘색','#87ceeb','blue'],['powder-blue','Powder Blue','파우더 블루','#b0e0e6','blue'],['steel-blue','Steel Blue','스틸 블루','#4682b4','blue'],['cornflower-blue','Cornflower Blue','콘플라워 블루','#6495ed','blue'],['royal-blue','Royal Blue','로열 블루','#4169e1','blue'],['midnight-blue','Midnight Blue','미드나이트 블루','#191970','blue'],['navy-blue','Navy Blue','네이비 블루','#000080','blue'],
 ['lavender','Lavender','라벤더','#e6e6fa','purple'],['thistle','Thistle','옅은 라일락','#d8bfd8','purple'],['plum','Plum','플럼','#dda0dd','purple'],['orchid','Orchid','오키드','#da70d6','purple'],['medium-purple','Medium Purple','중간 보라','#9370db','purple'],['blue-violet','Blue Violet','청보라','#8a2be2','purple'],['indigo','Indigo','인디고','#4b0082','purple'],['dark-violet','Dark Violet','짙은 보라','#9400d3','purple'],['pink','Pink','분홍','#ffc0cb','pink'],['light-pink','Light Pink','옅은 분홍','#ffb6c1','pink'],['hot-pink','Hot Pink','핫 핑크','#ff69b4','pink'],['deep-pink','Deep Pink','진한 분홍','#ff1493','pink'],
 ['ivory','Ivory','아이보리','#fffff0','brown'],['beige','Beige','베이지','#f5f5dc','brown'],['wheat','Wheat','밀빛 베이지','#f5deb3','brown'],['tan','Tan','탄','#d2b48c','brown'],['rosy-brown','Rosy Brown','로지 브라운','#bc8f8f','brown'],['sandy-brown','Sandy Brown','샌디 브라운','#f4a460','brown'],['sienna','Sienna','시에나','#a0522d','brown'],['saddle-brown','Saddle Brown','새들 브라운','#8b4513','brown'],['maroon','Maroon','마룬','#800000','red']
].map(([id,en,ko,hex,family,sourceId])=>{const projectDescriptor=['off-white','charcoal','near-black','lemon'].includes(id),direct={'avocado-green':'figma-avocado','mint-green':'figma-mint','sage-green':'figma-sage'};return {id,en,ko,hex,family,sourceId:projectDescriptor?null:direct[id]||sourceId||'css-names',namingConvention:projectDescriptor?'project-descriptor':sourceId?'Figma color reference':'CSS named color'};});

const HISTORY=[
 {id:'ultramarine',families:['blue'],title:'파랑 계열 참고 · 울트라마린',material:'천연 울트라마린 안료',region:'아프가니스탄과 르네상스 유럽의 교역',period:'르네상스 회화',summary:'라파엘로 작품 연구에서 천연 울트라마린은 아프가니스탄 광산의 청금석으로 만든 값비싼 안료로 설명된다.',sourceIds:['ng-ultramarine'],scope:'pigment-history'},
 {id:'egyptian-blue',families:['blue','teal'],title:'파랑 계열 참고 · 이집션 블루',material:'합성 청색 안료',region:'고대 이집트',period:'이집트 신왕국 소장품, 기원전 15세기 사례',summary:'메트로폴리탄 소장품 36.3.202는 여러 원료를 가열해 만든 이집션 블루 덩어리다. 화면의 하늘색 이름이 이 안료와 같은 물질이라는 뜻은 아니다.',sourceIds:['met-egyptian-blue'],scope:'pigment-history'},
 {id:'cochineal',families:['red','pink'],title:'빨강 계열 참고 · 코치닐',material:'곤충에서 얻은 붉은 염료',region:'멕시코·안데스에서 유럽·아시아로 이어진 교역',period:'아메리카의 직물 전통과 16세기 이후 국제 교역',summary:'미술관 자료는 코치닐의 붉은색과 분홍색이 아메리카 직물에서 사용되었고 이후 세계 여러 지역으로 유통된 과정을 설명한다.',sourceIds:['met-cochineal'],scope:'dye-history'},
 {id:'tyrian-purple',families:['purple'],title:'보라 계열 참고 · 티리언 퍼플',material:'지중해 바다달팽이 유래 염료',region:'페니키아와 로마를 포함한 지중해권',period:'고대 지중해',summary:'켈시 박물관은 티리언 퍼플을 생산이 어려워 값비싸고 제한적으로 사용된 염료로 설명한다. 보라와 지위의 연결은 이 지역·시기의 역사적 사례다.',sourceIds:['kelsey-purple'],scope:'regional-dye-history'},
 {id:'verdigris',families:['green','teal'],title:'초록 계열 참고 · 버디그리스',material:'구리계 청록 안료',region:'중세부터 17세기 유럽의 지도·삽화',period:'중세–17세기 사례',summary:'미국 의회도서관은 버디그리스를 청록색의 인공 구리계 안료로 설명하고, 역사적 지도와 책의 삽화에 사용된 기록을 다룬다.',sourceIds:['loc-verdigris'],scope:'conservation-history'},
 {id:'yellow-ochre',families:['yellow','orange','brown'],title:'흙빛 계열 참고 · 옐로 오커',material:'갈색 기운이 있는 노란 흙 안료',region:'스웨덴 전통 건축색을 다룬 자료',period:'전통 재료 연구',summary:'스웨덴 국가유산청은 옐로 오커를 갈색 기운의 노란색을 내는 흙 안료로 설명한다. 레몬색이나 모든 노랑의 역사로 일반화하지 않는다.',sourceIds:['raa-ochre'],scope:'regional-material-history'},
 {id:'mineral-earths',families:['red','yellow','orange','brown'],title:'흙빛 계열 참고 · 오커의 여러 색',material:'산화철·수산화철을 포함한 암석과 흙',region:'고대 지중해 미술 연구',period:'고대 조각의 재료',summary:'메트로폴리탄의 안료 용어집은 오커가 광물 구성에 따라 빨강·주황·노랑·보라 등으로 달라질 수 있음을 설명한다.',sourceIds:['met-ancient-pigments'],scope:'material-history'}
].map(entry=>({...entry,relation:'broad-color-family-reference',caution:'RGB의 시각적 계열과 관련된 참고 자료입니다. 이 디지털 색의 안료·유래·보편적 감정을 판정한 결과가 아닙니다.'}));
const USER_SYMBOLISM=[
 {family:'red',positive:['열정','에너지','활력','따뜻함'],tension:['분노','위험','경고']},
 {family:'orange',positive:['따뜻함','친근함','창의성','즐거움'],tension:['가벼움','박탈감']},
 {family:'yellow',positive:['기쁨','낙관','햇살'],tension:['불안','주의','경고']},
 {family:'green',positive:['자연','성장','균형','평온'],tension:['무기력','질병의 연상']},
 {family:'teal',positive:['물빛','신선함','균형'],tension:['차가움','낯섦']},
 {family:'blue',positive:['신뢰','안정','차분함'],tension:['차가움','거리감','우울']},
 {family:'purple',positive:['상상','신비','깊이'],tension:['고독','기이함']},
 {family:'pink',positive:['다정함','배려','로맨스'],tension:['강한 핑크의 자극']},
 {family:'brown',positive:['온기','자연스러움','안정'],tension:['무거움','낡은 느낌']},
 {family:'neutral',positive:['절제','질서','여백'],tension:['공허','쓸쓸함','위협']}
].map(entry=>({...entry,source:'user-provided-editorial-associations',caution:'사용자가 제공한 디자인 연상입니다. 개인·문화·상황에 따라 달라지며 역사적 사실이나 감정 진단이 아닙니다.'}));
function rgb(input){
 if(typeof input==='string'&&/^#[\da-f]{6}$/i.test(input))return [1,3,5].map(i=>parseInt(input.slice(i,i+2),16));
 if(!Array.isArray(input)||input.length!==3||!input.every(v=>finite(v)&&v>=-1e-7&&v<=255+1e-7))throw new TypeError('Use three finite sRGB values from 0 to 255, or a six-digit hex color');
 return input.map(v=>Math.round(Math.max(0,Math.min(255,v))));
}
const hex=values=>'#'+values.map(v=>v.toString(16).padStart(2,'0')).join('');
function lab(values){const [r,g,b]=values.map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4;});const l=Math.cbrt(.4122214708*r+.5363325363*g+.0514459929*b),m=Math.cbrt(.2119034982*r+.6806995451*g+.1073969566*b),s=Math.cbrt(.0883024619*r+.2817188376*g+.6299787005*b);const L=.2104542553*l+.793617785*m-.0040720468*s,a=1.9779984951*l-2.428592205*m+.4505937099*s,bb=.0259040371*l+.7827717662*m-.808675766*s;return {L,a,b:bb,C:Math.hypot(a,bb),h:(Math.atan2(bb,a)*180/Math.PI+360)%360};}
const coordinates=ANCHORS.map(anchor=>({...anchor,rgb:rgb(anchor.hex),lab:lab(rgb(anchor.hex))}));
const distance=(a,b)=>Math.hypot(a.L-b.L,a.a-b.a,a.b-b.b);
const FAMILIES={red:['Red','빨강'],orange:['Orange','주황'],yellow:['Yellow','노랑'],green:['Green','초록'],teal:['Teal','청록'],blue:['Blue','파랑'],purple:['Purple','보라'],pink:['Pink','분홍'],brown:['Brown','갈색'],neutral:['Gray','회색']};
function familyOf(p){if(p.C<.018||p.L<.24&&p.C<.045)return 'neutral';if(p.h>=35&&p.h<90&&p.C<.13&&p.L<.76)return 'brown';return p.h<15||p.h>=330?'pink':p.h<45?'red':p.h<85?'orange':p.h<115?'yellow':p.h<165?'green':p.h<220?'teal':p.h<285?'blue':'purple';}
function toneOf(p){return p.L<.38?'deep':p.L<.57?'dark':p.L>=.84&&p.C<.12?'pale':p.L>=.76?'light':p.C>=.18?'vivid':p.C<.075?'muted':'mid';}
const TONES={deep:['Deep','아주 짙은'],dark:['Dark','짙은'],pale:['Pale','옅은'],light:['Light','밝은'],vivid:['Vivid','선명한'],muted:['Muted','차분한'],mid:['','']};
function describeRGB(input){
 const values=rgb(input),code=hex(values),p=lab(values),exact=coordinates.find(anchor=>anchor.hex===code);let family=familyOf(p),tone=toneOf(p),match=exact;
 if(!match&&family==='neutral'){
  const id=p.L>=.98?'white':p.L>=.89?'off-white':p.L>=.76?'light-gray':p.L>=.66?'silver':p.L>=.5?'gray':p.L>=.36?'dim-gray':p.L>=.23?'charcoal':p.L>=.09?'near-black':'black';match=coordinates.find(anchor=>anchor.id===id);
 }
 let delta=match?distance(p,match.lab):Infinity;
 if(!match){const candidates=coordinates.filter(anchor=>anchor.family===family);for(const anchor of candidates){const d=distance(p,anchor.lab);if(d<delta){delta=d;match=anchor;}}if(delta>.072)match=null;}
 if(match){family=match.family;return freeze({id:match.id,en:match.en,ko:match.ko,rgb:values,hex:code,family,tone,exact:Boolean(exact),approximate:!exact,referenceHex:match.hex,sourceId:match.sourceId,namingConvention:match.namingConvention,nameBasis:exact?'named-srgb-anchor':'nearest-named-srgb-anchor',distance:round(delta),oklch:{L:round(p.L),C:round(p.C),h:round(p.h)}});}
 const [toneEn,toneKo]=TONES[tone],[familyEn,familyKo]=FAMILIES[family];return freeze({id:`${tone}-${family}`,en:[toneEn,familyEn].filter(Boolean).join(' '),ko:[toneKo,familyKo].filter(Boolean).join(' '),rgb:values,hex:code,family,tone,exact:false,approximate:true,referenceHex:null,sourceId:null,nameBasis:'descriptive-lightness-chroma-hue',distance:null,oklch:{L:round(p.L),C:round(p.C),h:round(p.h)}});
}
const ROLES=[{role:'halo',roleEn:'Halo',roleKo:'바깥 번짐'},{role:'body',roleEn:'Surrounding body',roleKo:'주변 몸체'},{role:'inner',roleEn:'Inner layer',roleKo:'안쪽 층'},{role:'core',roleEn:'Core',roleKo:'핵'}];
function contextsFor(input){const family=typeof input==='string'&&FAMILIES[input]?input:describeRGB(input).family;return freeze(HISTORY.filter(entry=>entry.families.includes(family)).map(clone));}
function describePalette({layers,background,poeticName=null}={}){
 if(!Array.isArray(layers)||layers.length!==4)throw new TypeError('A palette contains exactly four renderer-order layers');
 if(poeticName!=null&&(typeof poeticName!=='string'||poeticName.length>160))throw new TypeError('The creative label must be a short string');
 const components=layers.map((layer,index)=>({...ROLES[index],...describeRGB(layer&&layer.col!==undefined?layer.col:layer)}));
 const selected=[];for(const component of [components[3],components[1],components[2],components[0]])if(!selected.some(previous=>previous.id===component.id||previous.family===component.family&&previous.tone===component.tone&&distance(lab(previous.rgb),lab(component.rgb))<.07))selected.push(component);
 const bg=background==null?null:{role:'background',roleEn:'Background',roleKo:'바탕',...describeRGB(background)},families=[...new Set(components.map(component=>component.family))];
 const tokens=selected.map(component=>({role:component.role,en:component.en,ko:component.ko,hex:component.hex}));
 return freeze({version:VERSION,poeticName,poeticNameKind:poeticName?'creative-label':null,inputKind:'already-transformed-layer-srgb',components,background:bg,descriptor:{en:tokens.map(token=>token.en).join(' × '),ko:tokens.map(token=>token.ko).join(' × '),tokens},context:HISTORY.filter(entry=>entry.families.some(family=>families.includes(family))).map(clone),userSymbolism:USER_SYMBOLISM.filter(entry=>families.includes(entry.family)).map(clone)});
}
function describeScene(scene,{poeticName=null}={}){
 if(!scene||!Array.isArray(scene.orbs)||!scene.orbs.length||scene.orbs.length>3)throw new TypeError('A scene contains one to three orbs');
 const background={role:'background',roleEn:'Background',roleKo:'바탕',...describeRGB(scene.background)};
 return freeze({version:VERSION,inputKind:'already-transformed-layer-srgb',poeticName,background,orbs:scene.orbs.map((orb,index)=>({slot:index,...describePalette({layers:orb.layers,background:scene.background,poeticName:null})})),notice:'구성색 이름은 조정이 적용된 각 층의 RGB에 근거합니다. 투명도와 배경이 합성된 모든 픽셀의 색을 대표하지는 않습니다.'});
}
return freeze({VERSION,SOURCES,ANCHORS,HISTORY,USER_SYMBOLISM,ROLES,describeRGB,describePalette,describeScene,contextsFor});
});
