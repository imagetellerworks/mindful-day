(function(root,factory){
'use strict';
if(typeof module==='object'&&module.exports)module.exports=factory();
else root.SemanticMixing=factory();
})(typeof window==='object'?window:this,function(){
'use strict';

// An editorial graph of word meanings, not a trained model or a psychological
// measurement. It never sees RGB, layer sizes, or a global weighted word list.
const VERSION='editorial-semantic-graph/v1';
const GROUPS={
 joy:['cheerful','lively','sunny','joyful','buoyant','bubbly','excited'],
 play:['playful','curious'],
 warmth:['cozy','warm','tender','comfortable','gentle','content','mellow'],
 calm:['calm','peaceful','serene','relaxed','composed','rested'],
 clarity:['clear','refreshed'],
 reflection:['quiet','still','restrained','detached','pensive','solemn'],
 sorrow:['subdued','somber','wistful','lonesome','melancholy','heavy','withdrawn','forlorn','resigned','lonely'],
 fear:['tense','uneasy','unsettled','restless','edgy','overwhelmed','alarmed','guarded','vulnerable'],
 anger:['fiery','fierce','heated','angry','irritated','stifled'],
 uncertainty:['conflicted','sensitive','uncertain','complex'],
 dream:['dreamy','enchanted','delicate'],
 intensity:['intense','bold'],
 neutral:['mixed']
};
// New dream nuances are separate semantic nodes. Existing 65-word paths keep
// their exact rules; an added word must actually be present to use this branch.
const DREAM_GROUPS={
 absorption:['hypnotic','enraptured'],mystery:['mysterious'],mist:['hazy'],
 fantasy:['fantastical','fairytale','magical'],uncanny:['eerie'],unreality:['surreal'],
 grandeur:['magnificent'],radiance:['luminous'],otherworld:['otherworldly'],ethereal:['ethereal'],heavenly:['heavenly']
};
Object.assign(GROUPS,DREAM_GROUPS);
const FRICTION_WORDS=["ambivalent","torn","bittersweet","poignant","dissonant","discordant","clashing","jarring","unbalanced","wavering","strained","unresolved","agitated","overstimulated","overloaded","disoriented","fragmented","disconnected","alienated","hollow"];
GROUPS.friction=FRICTION_WORDS.slice();
const DREAM_WORDS=Object.values(DREAM_GROUPS).flat(),NEW_WORDS=new Set(DREAM_WORDS);
const ROMANCE_WORDS=['sensual','romantic','enchanting'];GROUPS.romance=ROMANCE_WORDS.slice();
const ART_GROUPS={"forbiddenHeat": ["forbidden", "smoldering", "molten", "repressed-anger", "alluring", "cruel-beauty", "fatal-danger", "decadent"], "electricToxicity": ["toxic", "high-voltage", "nerve-stimulating", "acidic", "hallucinatory", "hacking", "viral"], "ruin": ["abandoned", "weathered", "decaying", "ruined"], "uncannyLife": ["mutating", "proliferating", "outbreak", "uncanny-vitality", "alien-substance", "disquieting"], "liberation": ["innovative", "evolving", "liberated", "scintillating", "timeless", "awakening"], "cosmicDepth": ["abyssal", "cosmic-majesty", "immovable", "contemplative"], "velvetPassion": ["captivating", "velvety", "deep-passion"]};
Object.assign(GROUPS,ART_GROUPS);
const ART_WORDS=Object.values(ART_GROUPS).flat();
const BY_WORD=Object.fromEntries(Object.entries(GROUPS).flatMap(([group,words])=>words.map(word=>[word,group])));
// These two semantic inputs cover older labels. They are accepted for meaning
// comparison but never emitted as new word IDs outside the existing vocabulary.
const INPUT_ALIASES={hopeful:'hope',optimistic:'hope'};
const ORDER=['anger','fear','sorrow','uncertainty','intensity','joy','play','hope','warmth','calm','clarity','dream','reflection','neutral',...Object.keys(DREAM_GROUPS),'romance','friction',...Object.keys(ART_GROUPS)];
const NEGATIVE=new Set(['anger','fear','sorrow','uncertainty','uncanny']);
const PURE={joy:['cheerful','lively'],play:['playful','lively'],warmth:['warm','tender'],calm:['calm','serene'],clarity:['clear','refreshed'],reflection:['quiet','pensive'],sorrow:['somber','melancholy'],fear:['uneasy','restless'],anger:['angry','heated'],uncertainty:['uncertain','conflicted'],dream:['dreamy','enchanted'],intensity:['intense','bold'],neutral:['uncertain','complex'],hope:['buoyant','cheerful']};
Object.assign(PURE,{absorption:['hypnotic','enraptured'],mystery:['mysterious','curious'],mist:['hazy','wistful'],fantasy:['fantastical','magical'],uncanny:['eerie','mysterious'],unreality:['surreal','fantastical'],grandeur:['magnificent','intense'],radiance:['luminous','clear'],otherworld:['otherworldly','mysterious'],ethereal:['ethereal','luminous'],heavenly:['heavenly','content']});
PURE.romance=['romantic','enchanting'];
for(const [group,words] of Object.entries(ART_GROUPS))PURE[group]=words.slice(0,2);
const PEERS={cheerful:'lively',lively:'cheerful',playful:'lively',quiet:'still',somber:'subdued',subdued:'somber',tense:'uneasy',fiery:'heated',mixed:'complex',clear:'refreshed',dreamy:'enchanted',intense:'bold',pensive:'quiet',wistful:'pensive',cozy:'comfortable',calm:'serene'};
Object.assign(PEERS,{fairytale:'magical',magical:'fairytale',enraptured:'hypnotic'});
Object.assign(PEERS,{sensual:'romantic',romantic:'enchanting',enchanting:'romantic'});
for(let i=0;i<FRICTION_WORDS.length;i+=2){PEERS[FRICTION_WORDS[i]]=FRICTION_WORDS[i+1];PEERS[FRICTION_WORDS[i+1]]=FRICTION_WORDS[i];}
for(const words of Object.values(ART_GROUPS))for(const [index,word] of words.entries())PEERS[word]=words[(index+1)%words.length];
const REASONS={
 'artistic-imagery':['서로 가까운 창작 이미지의 뜻을 유지합니다. 실제 오브에서 읽힌 두 표현을 남기며 다른 감정으로 확대하지 않습니다.','Related artistic images retain the meanings actually read from the orbs.'],
 'joy-sorrow':['밝은 마음과 슬픔이 함께 읽혀, 아련함과 사색의 느낌을 제안해요.','Joy and sorrow coexist, suggesting wistfulness and reflection.'],
 'anger-fear':['분노와 불안이 만나는 뜻에서, 날 선 긴장과 갈등을 제안해요.','Anger and anxiety meet in an edgy, conflicted impression.'],
 'anger-sorrow':['분노와 슬픔이 함께 남는 뜻에서, 답답함과 갈등을 제안해요.','Anger and sorrow coexist as a stifled or conflicted impression.'],
 'fear-sorrow':['불안과 슬픔이 함께 읽혀, 위태로움과 불안을 제안해요.','Anxiety and sorrow suggest vulnerability or unease.'],
 'joy-fear':['밝은 마음과 불안이 엇갈려, 초조함과 갈등을 제안해요.','Joy and anxiety pull in different directions, suggesting restlessness or conflict.'],
 'joy-anger':['밝은 마음과 분노가 함께 읽혀, 달아오름과 갈등을 제안해요.','Joy and anger coexist as heat or conflict.'],
 'joy-play-hope':['밝음·기대·장난기를 활기와 장난스러움으로 연결해요. 행동 의지를 뜻하는 열의로 확대하지 않아요.','Brightness, expectation, and play suggest liveliness or playfulness, without inferring goal-directed enthusiasm.'],
 'joy-play':['밝음과 장난기가 서로 이어져, 활기와 장난스러움을 제안해요.','Joy and play reinforce a lively, playful impression.'],
 'joy-hope':['밝은 마음과 기대가 함께 읽혀, 명랑함과 들뜬 느낌을 제안해요.','Joy and expectation suggest cheerfulness or buoyancy.'],
 'joy-clarity':['기쁨과 맑음이 함께 읽혀, 명랑함과 산뜻함을 제안해요.','Joy and clarity suggest cheerfulness and freshness.'],
 'warm-clarity':['다정함과 맑음이 함께 읽혀, 다정함과 산뜻함을 제안해요.','Warmth and clarity retain tenderness and freshness.'],
 'warm-sorrow':['다정함과 슬픔이 함께 읽혀, 다정함과 아련함을 남겨요.','Warmth and sorrow retain tenderness and wistfulness.'],
 'calm-sorrow':['차분함이 슬픔을 지우지는 않아서, 사색과 아련함을 제안해요.','Calm does not erase sorrow; the alternatives retain reflection and wistfulness.'],
 'calm-fear':['차분함과 불안이 상충하여, 방어적인 느낌과 확신이 없는 느낌을 제안해요.','Calm and anxiety conflict, suggesting guardedness or uncertainty.'],
 'calm-anger':['차분함과 분노가 함께 남아, 절제와 갈등을 제안해요.','Calm and anger coexist as restraint or conflict.'],
 'joy-calm':['기쁨과 차분함이 이어져, 흡족함과 여유를 제안해요.','Joy and calm suggest contentment or mellowness.'],
 'warm-calm':['따뜻함과 차분함이 함께 읽혀, 포근함과 편안함을 제안해요.','Warmth and calm suggest coziness or comfort.'],
 'joy-warm':['기쁨과 따뜻함이 서로 이어져, 기쁨과 다정함을 제안해요.','Joy and warmth retain joyfulness and tenderness.'],
 'play-dream':['장난기와 상상이 함께 읽혀, 장난스러움과 호기심을 제안해요.','Play and imagination suggest playfulness or curiosity.'],
 'clarity-calm':['맑음과 차분함이 서로 이어지는 뜻을 유지해요.','Clarity and calm retain their related meanings.'],
 'intense-fear':['강렬함은 불안을 더 긴장된 쪽으로 읽게 해요. 평온함으로 바꾸지 않아요.','Intensity reinforces anxiety as tension or overwhelm rather than calm.'],
 'intense-anger':['강렬함과 분노가 만나 불같고 격렬한 느낌을 제안해요.','Intensity and anger suggest a fiery or fierce impression.'],
 'intense-sorrow':['강렬함과 슬픔이 만나 무게감과 침울함을 제안해요.','Intensity and sorrow suggest heaviness or somberness.'],
 'shared-family':['서로 가까운 감정 단어의 뜻을 유지해요.','The words retain their shared semantic family.'],
 'shared-word':['각 오브에서 같은 단어가 읽혀 그 뜻을 유지해요.','The same word appears across the orbs, so its meaning is retained.'],
 'single-orb':['한 오브에 이미 매칭된 감정 제안을 유지해요.','The suggestions already matched to the single orb are retained.'],
 'coexisting-impressions':['한 뜻으로 단정하기 어려워, 실제 입력 단어의 두 인상을 함께 제안해요.','The meanings do not justify a single synthesis, so two actual input impressions are retained.'],
 'alternative-meanings':['오브마다 두 가지 해석이 가능해, 공통되는 뜻과 남는 가능성을 제안해요.','Each orb has alternative readings; suggestions retain common meaning and remaining possibilities.'],
 'opposing-alternatives':['후보 단어의 뜻이 서로 다른 방향으로 읽혀, 갈등과 불확실함을 제안해요.','Alternative word readings pull in different directions, suggesting conflict or uncertainty.']
};
Object.assign(REASONS,{
 'conflicting-impressions':['서로 엇갈리는 느낌은 한 감정으로 지우지 않고, 실제로 제시된 상충과 잔여 감정을 함께 남깁니다.','Conflicting impressions retain their actual friction and accompanying feeling.'],
 'attention-retained':['검정과 선명한 색에서 온 대담한 주목성을 남기고, 다른 오브의 감정 의미를 함께 제안해요.','Bold attention from a vivid color against darkness remains alongside the other orb impressions.'],
 'uncanny-dream':['낯설고 기묘한 뜻을 유지해, 포근함과 구별되는 신비와 비현실감을 제안해요.','Uncanny meanings retain mystery and unreality rather than becoming cozy.'],
 'dream-fear':['상상이나 낯섦에 불안이 함께 읽혀, 기묘함과 불확실함을 남겨요.','Anxiety alongside imagination or strangeness retains unease and uncertainty.'],
 'dream-anger':['꿈의 인상과 분노를 함께 남기며, 부드러운 편안함으로 합치지 않아요.','The dream impression and anger remain distinct rather than turning into comfort.'],
 'dream-sorrow':['꿈의 인상에 슬픔이 함께 읽혀, 아스라함과 아련함의 결을 남겨요.','Sorrow preserves a hazy or wistful edge within the dream impression.'],
 'dream-grandeur':['장엄함은 규모와 힘의 뜻으로 읽어, 포근한 느낌과 구별해요.','Grandeur retains scale and intensity rather than becoming cozy.'],
 'otherworld-ethereal':['낯선 다른 세계와 투명하고 신비로운 느낌은 서로 다른 두 인상으로 남겨요.','A strange other world and transparent, mysterious ethereality remain distinct impressions.'],
 'dream-otherworld':['익숙한 현실 밖의 낯선 세계를 신비롭거나 기묘한 인상으로 연결해요.','A strange world beyond familiar reality suggests mystery or eeriness.'],
 'dream-ethereal':['투명하고 신비로운 인상을 어둡고 기묘한 낯섦과 구별해요.','Transparent, mysterious ethereality is distinguished from dark, uncanny strangeness.'],
 'dream-heavenly':['성스럽고 완벽한 느낌은 투명하고 신비로운 인상과 구별하는 창작 연상이에요.','A sacred, perfect heavenly impression is a creative association distinct from transparent, mysterious ethereality.'],
 'dream-absorption':['깊이 몰입하는 인상을 최면적인 느낌과 황홀함으로 구분해요.','Absorption is expressed as a hypnotic or enraptured impression.'],
 'dream-mystery':['알 수 없는 신비를 바로 불안이나 편안함으로 단정하지 않아요.','Mystery is not automatically treated as anxiety or comfort.'],
 'dream-unreality':['비현실적인 낯섦을 환상과 초현실의 뜻으로 남겨요.','Unreality retains fantastical and surreal meanings.'],
 'dream-fairytale':['부드러운 이야기 같은 상상을 동화와 마법의 인상으로 구분해요.','A storylike imagination suggests fairytale or magical impressions.'],
 'dream-fantasy':['환상과 마법의 뜻을 유지하며 밝음만으로 기쁨을 단정하지 않아요.','Fantasy and magic retain their meaning without assuming joy from brightness alone.'],
 'dream-mist':['아스라한 느낌을 차분함이나 슬픔으로 한꺼번에 뭉뚱그리지 않아요.','Haziness is retained rather than collapsed into calm or sorrow.'],
 'dream-radiance':['눈부신 빛의 인상을 기쁨이나 강렬함과 문맥에 맞게 연결해요.','Radiance connects with joy or intensity according to the accompanying meanings.']
});
Object.assign(REASONS,{
 'rose-warmth':['로즈빛에 매칭된 관능·설렘·매혹을 온기와 다정함의 뜻으로 연결하는 창작 제안이에요.','The matched rose impressions connect sensuality, romance, and enchantment with warmth as an editorial suggestion.'],
 'rose-contrast':['설렘이나 관능의 인상에 불안·긴장이 함께 남아, 편안함으로 단순화하지 않아요.','Romantic or sensual impressions coexist with tension rather than becoming comfort.'],
 'rose-wistfulness':['설렘과 슬픔이 함께 읽혀, 로맨틱한 아련함을 제안해요.','Romance and sorrow suggest romantic wistfulness.']
});
function freeze(value){if(value&&typeof value==='object'&&!Object.isFrozen(value)){Object.values(value).forEach(freeze);Object.freeze(value);}return value;}
function check(value,message){if(!value)throw new TypeError(message);}
const groupOf=word=>BY_WORD[word]||INPUT_ALIASES[word];
const orderWords=(a,b)=>ORDER.indexOf(groupOf(a))-ORDER.indexOf(groupOf(b))||a.localeCompare(b);
const unique=items=>[...new Set(items)];
function normalize(input){
 check(Array.isArray(input)&&input.length>=1&&input.length<=3,'Combine one to three matched orbs');
 return input.map(orb=>{
  check(orb&&Array.isArray(orb.candidates)&&orb.candidates.length>=1&&orb.candidates.length<=2,'Each orb needs one or two matched candidates');
  const candidates=unique(orb.candidates.map(candidate=>typeof candidate==='string'?candidate:candidate&&candidate.id));
  check(candidates.every(word=>typeof word==='string'&&groupOf(word)),'Every candidate must be a known semantic word');
  const selectedWord=orb.selectedWord??null;
  check(selectedWord===null||candidates.includes(selectedWord),'The selected word must belong to its orb candidates');
  return {candidates,selectedWord,words:selectedWord?[selectedWord]:candidates.slice()};
 });
}
function relation(rule,ids,groups,direction='supporting'){
 const reason=REASONS[rule]||REASONS['coexisting-impressions'];
 return {ids,rule,reason:{ko:reason[0],en:reason[1]},groups,direction};
}
function peer(word){return PEERS[word]||PURE[groupOf(word)]?.find(id=>id!==word)||'complex';}
function interpretDream(words,groups){
 const has=group=>groups.includes(group),includes=word=>words.includes(word),pair=(rule,ids,direction='supporting')=>relation(rule,ids,groups,direction);
 const firstNew=words.find(word=>NEW_WORDS.has(word));
 if(words.length===1)return pair('shared-word',[words[0],peer(words[0])]);
 if(has('uncanny'))return pair('uncanny-dream',['eerie',has('unreality')?'surreal':has('otherworld')?'otherworldly':'mysterious'],'opposing');
 if(has('fear')){
  if(has('grandeur'))return pair('dream-fear',['magnificent','overwhelmed'],'opposing');
  if(has('otherworld'))return pair('dream-fear',['otherworldly','eerie'],'opposing');
  if(has('mystery')||has('unreality')||has('fantasy'))return pair('dream-fear',['eerie',has('unreality')?'surreal':'mysterious'],'opposing');
  return pair('dream-fear',[firstNew,'uneasy'],'opposing');
 }
 if(has('anger'))return pair('dream-anger',[has('grandeur')?'magnificent':firstNew,has('mist')?'stifled':'intense'],'opposing');
 if(has('sorrow'))return pair('dream-sorrow',[firstNew,has('grandeur')?'solemn':'wistful'],'coexisting');
 if(has('grandeur'))return pair('dream-grandeur',['magnificent',has('otherworld')?'otherworldly':has('ethereal')?'ethereal':has('radiance')?'luminous':has('mystery')?'mysterious':has('fantasy')?'fantastical':has('joy')?'enraptured':'intense']);
 if(has('otherworld')&&has('ethereal'))return pair('otherworld-ethereal',['otherworldly','ethereal'],'coexisting');
 if(has('otherworld'))return pair('dream-otherworld',['otherworldly',has('heavenly')?'heavenly':has('unreality')?'surreal':'mysterious'],'coexisting');
 if(has('heavenly'))return pair('dream-heavenly',['heavenly',has('ethereal')?'ethereal':has('intensity')?'enraptured':has('warmth')?'comfortable':has('calm')?'peaceful':has('radiance')?'luminous':'content']);
 if(has('ethereal'))return pair('dream-ethereal',['ethereal',has('mist')?'hazy':has('fantasy')?'magical':has('mystery')?'mysterious':has('calm')?'serene':'luminous']);
 if(has('absorption'))return pair('dream-absorption',[includes('enraptured')?'enraptured':'hypnotic',has('mystery')?'mysterious':has('radiance')?'luminous':includes('enraptured')?'hypnotic':'enraptured']);
 if(has('mystery'))return pair('dream-mystery',['mysterious',has('unreality')?'surreal':has('fantasy')?'magical':has('mist')?'hazy':has('calm')?'quiet':'curious'],'coexisting');
 if(has('unreality'))return pair('dream-unreality',['surreal',has('fantasy')?'fantastical':has('radiance')?'luminous':'dreamy'],'coexisting');
 if(includes('fairytale'))return pair('dream-fairytale',['fairytale','magical']);
 if(has('fantasy'))return pair('dream-fantasy',[includes('magical')?'magical':'fantastical',has('radiance')?'luminous':has('joy')?'enraptured':has('mist')?'hazy':includes('magical')?'fantastical':'magical']);
 if(has('mist'))return pair('dream-mist',['hazy',has('radiance')?'luminous':has('calm')?'quiet':'dreamy'],'coexisting');
 return pair('dream-radiance',['luminous',has('intensity')?'intense':has('joy')?'cheerful':has('calm')||has('clarity')?'clear':'enchanted']);
}
function interpret(input){
 const words=unique(input).sort(orderWords),groups=unique(words.map(groupOf)).sort((a,b)=>ORDER.indexOf(a)-ORDER.indexOf(b)),has=group=>groups.includes(group),any=(...names)=>names.some(has);
 if(words.some(word=>ART_WORDS.includes(word))){const first=words.find(word=>ART_WORDS.includes(word)),second=words.find(word=>word!==first)||peer(first),shared=words.every(word=>groupOf(word)===groupOf(first));return relation(shared?'artistic-imagery':'coexisting-impressions',[first,second],groups,shared?'supporting':'coexisting');}
 if(words.some(word=>FRICTION_WORDS.includes(word))){const first=FRICTION_WORDS.find(word=>words.includes(word)),second=words.find(word=>word!==first)||peer(first);return relation('conflicting-impressions',[first,second],groups,'coexisting');}
 if(words.some(word=>ROMANCE_WORDS.includes(word))){
  const first=words.includes('sensual')?'sensual':words.includes('romantic')?'romantic':'enchanting';
  if(words.length===1)return relation('shared-word',[first,peer(first)],groups);
  if(any('fear','uncanny','uncertainty'))return relation('rose-contrast',[first,has('uncanny')?'eerie':'uneasy'],groups,'opposing');
  if(has('anger')||has('intensity'))return relation('rose-contrast',[first,'intense'],groups,'coexisting');
  if(has('sorrow'))return relation('rose-wistfulness',[first,'wistful'],groups,'coexisting');
  return relation('rose-warmth',[first,words.includes('romantic')&&first!=='romantic'?'romantic':has('warmth')||has('calm')?'tender':first==='enchanting'?'romantic':'enchanting'],groups);
 }
 if(words.some(word=>NEW_WORDS.has(word)))return interpretDream(words,groups);
 const pair=(rule,ids,direction)=>relation(rule,ids,groups,direction);
 if(words.length===1&&words[0]==='mixed')return pair('coexisting-impressions',['uncertain','complex'],'coexisting');
 if(words.length===1&&BY_WORD[words[0]])return pair('shared-word',[words[0],peer(words[0])]);
 // Opposing meanings take precedence over reinforcing meanings. Adding a
 // soothing or joyful third orb cannot erase anger, anxiety, or sorrow.
 if(has('anger')&&has('fear'))return pair('anger-fear',['edgy','conflicted'],'opposing');
 if(has('anger')&&has('sorrow'))return pair('anger-sorrow',['stifled','conflicted'],'opposing');
 if(has('fear')&&has('sorrow'))return pair('fear-sorrow',['vulnerable','uneasy'],'opposing');
 if(any('joy','play')&&has('sorrow'))return pair('joy-sorrow',['wistful','pensive'],'opposing');
 if(any('joy','play','hope')&&has('fear'))return pair('joy-fear',['restless','conflicted'],'opposing');
 if(any('joy','play','hope')&&has('anger'))return pair('joy-anger',['heated','conflicted'],'opposing');
 if(has('warmth')&&has('sorrow'))return pair('warm-sorrow',['tender','wistful'],'coexisting');
 if(any('calm','clarity','reflection','dream','hope')&&has('sorrow'))return pair('calm-sorrow',['pensive','wistful'],'coexisting');
 if(any('calm','clarity','warmth','reflection','dream')&&has('fear'))return pair('calm-fear',['guarded','uncertain'],'opposing');
 if(any('calm','clarity','warmth','reflection','dream')&&has('anger'))return pair('calm-anger',['restrained','conflicted'],'opposing');
 if(has('intensity')&&has('fear'))return pair('intense-fear',['tense','overwhelmed']);
 if(has('intensity')&&has('anger'))return pair('intense-anger',['fiery','fierce']);
 if(has('intensity')&&has('sorrow'))return pair('intense-sorrow',['heavy','somber']);
 if(has('play')&&has('hope')&&any('joy','clarity'))return pair('joy-play-hope',['lively','playful']);
 if(any('joy','clarity')&&has('play'))return pair('joy-play',['lively','playful']);
 if(any('joy','clarity')&&has('hope'))return pair('joy-hope',['cheerful','buoyant']);
 if(has('joy')&&has('clarity'))return pair('joy-clarity',['cheerful','refreshed']);
 if(has('warmth')&&has('clarity'))return pair('warm-clarity',['tender','refreshed']);
 if(has('joy')&&has('calm'))return pair('joy-calm',['content','mellow']);
 if(has('warmth')&&has('calm'))return pair('warm-calm',['cozy','comfortable']);
 if(has('joy')&&has('warmth'))return pair('joy-warm',['joyful','tender']);
 if(has('play')&&has('dream'))return pair('play-dream',['playful','curious']);
 if(has('clarity')&&has('calm'))return pair('clarity-calm',['clear','calm']);
 const meaningful=groups.filter(group=>group!=='neutral');
 if(meaningful.length===1)return pair('shared-family',PURE[meaningful[0]].slice());
 // No made-up motivation or inevitable 'mixed' fallback: retain actual words
 // when the graph has no justified relationship for their meanings.
 const originals=words.filter(word=>BY_WORD[word]&&word!=='mixed');
 if(originals.length>=2)return pair('coexisting-impressions',originals.slice(0,2),'coexisting');
 if(originals.length===1)return pair('coexisting-impressions',[originals[0],peer(originals[0])],'coexisting');
 return pair('shared-family',PURE[meaningful[0]||'neutral'].slice());
}
function cartesian(orbs,index=0,prefix=[],out=[]){if(index===orbs.length){out.push(interpret(prefix));return out;}for(const word of orbs[index].words)cartesian(orbs,index+1,prefix.concat(word),out);return out;}
function combine(input,{attentionWords=[]}={}){
 const inputWords=normalize(input);
 let result,paths;
 if(inputWords.length===1){const words=inputWords[0].words,ids=words.length===2&&words.every(word=>BY_WORD[word])?words.slice():interpret(words).ids;result=relation('single-orb',ids,unique(words.map(groupOf)));paths=[result];}
 else{
  paths=cartesian(inputWords);
  const first=paths[0],same=paths.every(path=>path.rule===first.rule&&path.ids.every((id,index)=>id===first.ids[index]));
  if(same)result=first;
  else{
   const common=first.ids.filter(id=>paths.every(path=>path.ids.includes(id))),allGroups=unique(paths.flatMap(path=>path.groups)).sort((a,b)=>ORDER.indexOf(a)-ORDER.indexOf(b));
   const supporting=paths.some(path=>path.direction==='supporting'&&!path.groups.some(group=>NEGATIVE.has(group))),opposing=paths.some(path=>path.direction==='opposing');
   if(supporting&&opposing&&!common.length)result=relation('opposing-alternatives',['conflicted','uncertain'],allGroups,'opposing');
   else{
    // Enumerate the maximum eight valid readings rather than treating the two
    // alternatives on each orb as simultaneous, weighted emotional inputs.
    const representatives=unique(paths.map(path=>path.ids[0]).sort(orderWords)),alternatives=unique(paths.flatMap(path=>path.ids).sort(orderWords));
    const first=common[0]||representatives[0],second=common[1]||alternatives.find(id=>id!==first&&groupOf(id)!==groupOf(first))||alternatives.find(id=>id!==first),ids=[first,second].filter(Boolean);
    if(ids.length===1)ids.push(peer(ids[0]));
    result=relation('alternative-meanings',ids,allGroups,'coexisting');
   }
  }
 }
 const attention=attentionWords.find(word=>['bold','intense'].includes(word)&&inputWords.some(orb=>orb.words.includes(word)));
 if(attention){const ids=[attention,result.ids.find(word=>word!==attention)||inputWords.flatMap(orb=>orb.words).find(word=>word!==attention)||peer(attention)];result=relation('attention-retained',ids,result.groups,'coexisting');paths=[result];}
 // Legacy classifiers may supply 'mixed'. Keep it in the provenance only;
 // every new suggestion must offer a usable, more specific choice.
 result.ids=unique(result.ids.map(id=>id==='mixed'?'uncertain':id));
 if(result.ids.length===1)result.ids.push(peer(result.ids[0]));
 check(result.ids.length===2&&result.ids[0]!==result.ids[1]&&result.ids.every(id=>BY_WORD[id]&&id!=='mixed'),'A semantic rule must return two distinct existing word IDs');
 return freeze({ids:result.ids.slice(),reason:result.reason,inputWords,rule:result.rule,source:'editorial-linguistic',version:VERSION,relationships:{groups:result.groups,direction:result.direction,interpretations:paths.map(path=>({rule:path.rule,ids:path.ids.slice(),groups:path.groups.slice()}))}});
}

return freeze({VERSION,GROUPS,DREAM_WORDS,ROMANCE_WORDS,FRICTION_WORDS,ART_WORDS,combine});
});
