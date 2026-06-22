const TABLES=window.SCENE_TABLES;function flattenKeys(obj,path=[]){let rows=[];for(const [key,value] of Object.entries(obj)){if(Array.isArray(value))rows.push({path:[...path,key],key,values:value});else rows=rows.concat(flattenKeys(value,[...path,key]));}return rows}const DEFAULT_STATE={campaignName:"",planet:"",biome:"",locationType:"",surroundings:"",intent:"Discovery",pacing:"Curious",phase:"Setup",threatLevel:2,mysteryLevel:2,currentThread:"",missionSeed:"",worldSeed:"",predictability:70,useContinuity:true,escalateOnComplication:true,useConflictArchitecture:true,sceneLog:[],lastSceneText:"",sceneSegments:[],journal:[],activeCenterTab:"journal",activeLeftTab:"scene",oracleUsage:{},oracleFilter:"",entityTagCatalog:{},lynxShip:{name:"Lynx Rescue Ship",preset:"rescue",decks:5,zones:4,threat:"medium",lighting:"emergency",mission:"",threatScore:0,output:""},updatedAt:null};let state=loadState();state.activeCenterTab="journal";let boundFileHandle=null;let autosaveTimer=null;const $=id=>document.getElementById(id);const pick=arr=>arr[Math.floor(Math.random()*arr.length)];const getTable=(...path)=>path.reduce((acc,key)=>acc&&acc[key],TABLES);function populateSelect(id,items){const el=$(id);el.innerHTML="";items.forEach(item=>{const opt=document.createElement("option");opt.value=item;opt.textContent=item;el.appendChild(opt)})}function init(){populateSelect("planet",getTable("Planets","Planetary Class"));populateSelect("biome",["Desert badlands","Frozen plain","Temperate forest","Jungle wetland","Mountain highlands","Subterranean caverns","Urban sprawl","Orbital / vacuum environment","Alien fungal fields","Coastal archipelago","Industrial wasteland","Flooded lowlands"]);populateSelect("locationType",["Settlement edge","Research outpost","Mining facility","Abandoned station","Ancient ruin","Trade depot","Wilderness trail","Crash site","Military checkpoint","Corporate compound","Derelict ship","Colonial district"]);populateSelect("surroundings",["Inside a building","Space station corridor","Cave opening","Underground cave system","Dense forest","Open plain","Vehicle bay","Landing pad","Market concourse","Maintenance tunnel","Ravine / canyon","Storm shelter","Medical ward","Reactor room","Docking arm"]);populateSelect("intent",["Discovery","Travel","Social encounter","Investigation","Resource pressure","Combat pressure","Moral choice","Faction complication","Exploration hazard","Trade opportunity"]);populateSelect("pacing",["Calm","Curious","Tense","Escalating","Dangerous","Aftermath"]);populateSelect("phase",["Setup","Approach","Discovery","Complication","Confrontation","Choice","Consequence","Transition"]);initLynxOptions();if(!state.planet)state.planet=getTable("Planets","Planetary Class")[0];if(!state.biome)state.biome="Desert badlands";if(!state.locationType)state.locationType="Settlement edge";if(!state.surroundings)state.surroundings="Inside a building";for(const id of ["campaignName","planet","biome","locationType","surroundings","intent","pacing","phase","threatLevel","mysteryLevel","currentThread","missionSeed","worldSeed","predictability","useContinuity","escalateOnComplication","useConflictArchitecture"]){$(id).addEventListener("input",readFormAndSave);$(id).addEventListener("change",readFormAndSave)}$("generateScene").addEventListener("click",generateNextScene);$("generateMission").addEventListener("click",generateMissionSeed);$("generateWorld").addEventListener("click",generateWorldSeed);$("advanceOnly").addEventListener("click",()=>{advancePhase(false);render();saveState()});$("copyScene").addEventListener("click",copyCurrentScene);$("undoScene").addEventListener("click",undoScene);$("clearLog").addEventListener("click",clearLog);$("exportJson").addEventListener("click",exportJson);if($("exportJournalRichText"))$("exportJournalRichText").addEventListener("click",exportJournalRichText);$("importJson").addEventListener("change",importJson);$("bindFile").addEventListener("click",bindFile);$("saveBoundFile").addEventListener("click",saveBoundFile);$("autosaveBoundFile").addEventListener("change",configureAutosave);$("newCampaign").addEventListener("click",newCampaign);const openSettings=$("openSettings"),closeSettingsBtn=$("closeSettings"),settingsBackdrop=$("settingsBackdrop");if(openSettings)openSettings.addEventListener("click",openSettingsModal);if(closeSettingsBtn)closeSettingsBtn.addEventListener("click",closeSettingsModal);if(settingsBackdrop)settingsBackdrop.addEventListener("click",closeSettingsModal);$("copyOracleOutput").addEventListener("click",copyOracleOutput);$("appendOracleToJournal").addEventListener("click",appendOracleToJournal);$("clearOracleOutput").addEventListener("click",clearOracleOutput);$("showOutputTab").addEventListener("click",()=>{showLeftTab("scene");showCenterTab("output")});$("showJournalTab").addEventListener("click",()=>{showLeftTab("scene");showCenterTab("journal")});const oh=document.querySelector("#oraclePanel .panel-title-row h2");if(oh)oh.addEventListener("click",()=>showLeftTab("scene"));document.querySelectorAll("[data-left-tab]").forEach(btn=>btn.addEventListener("click",()=>showLeftTab(btn.dataset.leftTab)));$("addCurrentToJournal").addEventListener("click",addCurrentOutputToJournal);$("addJournalComment").addEventListener("click",addJournalComment);$("clearJournalComment").addEventListener("click",clearJournalComment);if($("journalDiceRollButton"))$("journalDiceRollButton").addEventListener("click",rollStarforgedDiceToast);if($("commentDiceRollButton"))$("commentDiceRollButton").addEventListener("click",rollStarforgedDiceToast);$("collapseAllOracles").addEventListener("click",collapseAllOracles);bindLynxGenerator();initRichEditorToolbars();initImageUploads();$("oracleFilter").addEventListener("input",()=>{state.oracleFilter=$("oracleFilter").value;saveState();buildOracleTree()});$("fileSupport").textContent=supportsFileSystemAccess()?"File binding is supported in this browser. Save the JSON in your OneDrive synced folder on Windows for cloud sync.":"File binding is not supported in this browser. Use Export/Import JSON. This is common on Android.";if($("oracleFilter"))$("oracleFilter").value=state.oracleFilter||"";buildOracleTree();render()}function loadState(){try{const saved=localStorage.getItem("hostileSceneOracleV1");return saved?{...DEFAULT_STATE,...JSON.parse(saved)}:structuredClone(DEFAULT_STATE)}catch{return structuredClone(DEFAULT_STATE)}}function saveState(){state.updatedAt=new Date().toISOString();try{localStorage.setItem("hostileSceneOracleV1",JSON.stringify(state));setStatus("Saved locally "+new Date().toLocaleTimeString())}catch(err){console.warn("Local autosave quota exceeded; attempting compact save",err);try{const compact={...state,oracleOutput:"",sceneLog:(state.sceneLog||[]).slice(-25),journal:(state.journal||[]).slice(-100)};localStorage.setItem("hostileSceneOracleV1",JSON.stringify(compact));setStatus("Saved compact copy "+new Date().toLocaleTimeString())}catch(err2){console.warn("Compact autosave failed",err2);setStatus("Autosave storage full — export JSON, then clear old browser data")}}}function readFormAndSave(){state.campaignName=$("campaignName").value;state.planet=$("planet").value;state.biome=$("biome").value;state.locationType=$("locationType").value;state.surroundings=$("surroundings").value;state.intent=$("intent").value;state.pacing=$("pacing").value;state.phase=$("phase").value;state.threatLevel=Number($("threatLevel").value||0);state.mysteryLevel=Number($("mysteryLevel").value||0);state.currentThread=$("currentThread").value;if($("missionSeed"))state.missionSeed=$("missionSeed").value;if($("worldSeed"))state.worldSeed=$("worldSeed").value;state.predictability=Number($("predictability").value||70);state.useContinuity=$("useContinuity").checked;state.escalateOnComplication=$("escalateOnComplication").checked;state.useConflictArchitecture=$("useConflictArchitecture").checked;$("predictabilityLabel").textContent=state.predictability+"% predictable";saveState()}function render(){$("campaignName").value=state.campaignName||"";$("planet").value=state.planet;$("biome").value=state.biome;$("locationType").value=state.locationType;$("surroundings").value=state.surroundings;$("intent").value=state.intent;$("pacing").value=state.pacing;$("phase").value=state.phase;$("threatLevel").value=state.threatLevel;$("mysteryLevel").value=state.mysteryLevel;$("currentThread").value=state.currentThread||"";if($("missionSeed"))$("missionSeed").value=state.missionSeed||"";if($("worldSeed"))$("worldSeed").value=state.worldSeed||"";$("predictability").value=state.predictability;$("predictabilityLabel").textContent=state.predictability+"% predictable";$("useContinuity").checked=!!state.useContinuity;$("escalateOnComplication").checked=!!state.escalateOnComplication;$("useConflictArchitecture").checked=!!state.useConflictArchitecture;const card=$("sceneCard");renderSceneDraft(card);const log=$("sceneLog");log.innerHTML="";state.sceneLog.slice().reverse().forEach(scene=>{const li=document.createElement("li");li.textContent=`#${scene.number} — ${scene.phase} — ${scene.summary}\n\n${scene.text}`;log.appendChild(li)});renderJournal();renderLynxGenerator();showCenterTab(state.activeCenterTab||"output",false);showLeftTab(state.activeLeftTab||"scene",false)}function generateNextScene(){readFormAndSave();const action=pick(getTable("Core Oracles","Action"));const theme=pick(getTable("Core Oracles","Theme"));const descriptor=pick(getTable("Core Oracles","Descriptor"));const focus=pick(getTable("Core Oracles","Focus"));const sensory=pick(getTable("Location Themes","Sensory Detail"));const discovery=pick(getTable("Miscellaneous","Story Clue"));const complication=pick(getTable("Miscellaneous","Story Complication"));const threat=pick(getTable("Planets","Planetside Peril"));const opportunity=pick(getTable("Planets","Planetside Opportunity"));const consequence=pick(getTable("Miscellaneous","Pay the Price"));const plotTarget=pick(getTable("Plot Engine","Plot Target"));const plotMethod=pick(getTable("Plot Engine","Plot Method"));const plotReveal=pick(getTable("Plot Engine","Plot Reveals"));const sceneDriver=pick(getTable("Plot Engine","Scene Driver"));const fearTrigger=pick(getTable("Fear and Dread","Fear Trigger"));const dreadTechnique=pick(getTable("Fear and Dread","Dread Technique"));const uncannyDetail=pick(getTable("Fear and Dread","Uncanny Detail"));const revealTiming=pick(getTable("Fear and Dread","Revelation Timing"));const safeHorror=pick(getTable("Fear and Dread","Safety-Aware Horror Prompt"));const dangerSituation=pick([pick(getTable("Danger Situations","Industrial Hazards")),pick(getTable("Danger Situations","Environmental Dangers")),pick(getTable("Danger Situations","Space and Vacuum Dangers")),pick(getTable("Danger Situations","Social Dangers"))]);const horrorPayoff=pick(getTable("Miscellaneous","Horror Payoff"));const nextLocation=pick(["sealed service passage","upper observation deck","nearby settlement","underground chamber","emergency shelter","docking bay","forest ridge","old survey beacon","abandoned cargo module","restricted archive","commercial concourse","research annex","asteroid service tunnel","comet ice fissure"]);let conflictBlock="";if(state.useConflictArchitecture){conflictBlock=`\nConflict Architecture:\nStake Anchor: ${pick(getTable("Conflict Architecture","Stake Anchor"))}\nOpposition Logic: ${pick(getTable("Conflict Architecture","Opposition Logic"))}\nMeaningful Choice: ${pick(getTable("Conflict Architecture","Meaningful Choice"))}\nEscalation: ${pick(getTable("Conflict Architecture","Escalation"))}`;}const sceneNo=state.sceneLog.length+1;const text=`Scene ${sceneNo}: ${state.phase} — ${state.intent}\n\nPlanet / Biome: ${state.planet}; ${state.biome}\nLocation: ${state.locationType}; ${state.surroundings}\nPacing: ${state.pacing}\nThreat ${state.threatLevel}/10, Mystery ${state.mysteryLevel}/10\n\nOracle Spine:\nAction ${action} / Theme ${theme} / Descriptor ${descriptor} / Focus ${focus}\n\nOpening Image:\nThe scene opens in a ${descriptor} ${state.surroundings.toLowerCase()} connected to a ${state.locationType.toLowerCase()}. The first sensory impression is ${sensory}. ${describePressure()}\n\nContinuity:\n${continuityLine()}\n\nDiscovery:\nThe useful clue is ${discovery}. It points toward the current thread without fully resolving it.\n\nPlot Pressure:\nTarget: ${plotTarget}.\nMethod: ${plotMethod}.\nDriver: ${sceneDriver}.\nPossible reveal: ${plotReveal}.\n\nComplication:\n${complication}.\n\nDanger Situation:\n${dangerSituation}.\n\nFear / Dread Layer:\nFear trigger: ${fearTrigger}.\nDread technique: ${dreadTechnique}.\nUncanny detail: ${uncannyDetail}.\nReveal timing: ${revealTiming}.\nSafety-aware handling: ${safeHorror}.\n\nThreat / Opportunity:\nThreat: ${threat}.\nOpportunity: ${opportunity}.\nHorror payoff: ${horrorPayoff}.\n${conflictBlock}\n\nDecision Point:\nChoose between immediate safety, mission progress, and preserving leverage over the people or faction behind this scene.\n\nLikely Consequence:\nPay the price: ${consequence}. The most reasonable next location is the ${nextLocation}.\n\nCurrent Thread:\n${state.currentThread||"No active thread set. Create one from the discovery, stake anchor, or faction pressure."}`;addOutput(sceneNo,text,`${state.locationType} / ${state.surroundings}`,nextLocation);applyConsequence(consequence);advancePhase(true);saveState();render()}function generateMissionSeed(){readFormAndSave();const text=`Mission Seed\n\nMission: ${pick(getTable("Missions","Mission Type"))}\nPatron: ${pick(getTable("Missions","Patron"))}\nTarget Site: ${pick(getTable("Settlements","Settlement Type"))} / ${pick(getTable("Districts","District Type"))}\nComplication: ${pick(getTable("Missions","Twist"))}\nOpposition: ${pick(getTable("Factions","Faction Type"))} trying to ${pick(getTable("Factions","Project"))}\nReward: ${pick(getTable("Missions","Reward"))}\nHeat on Failure or Noise: ${pick(getTable("Missions","Heat Result"))}\n\nConflict Pressure:\nStake: ${pick(getTable("Conflict Architecture","Stake Anchor"))}\nHard Choice: ${pick(getTable("Conflict Architecture","Meaningful Choice"))}`;state.missionSeed=text;if($("missionSeed"))$("missionSeed").value=text;addOutput(state.sceneLog.length+1,text,"Mission Seed","mission");saveState();render()}function generateWorldSeed(){readFormAndSave();const text=`World / Colony Seed\n\nPlanetary Class: ${pick(getTable("Planets","Planetary Class"))}\nPlanet Trait: ${pick(getTable("Planets","Planet Traits"))}\nSettlement: ${pick(getTable("Settlements","Settlement Type"))}\nAuthority: ${pick(getTable("Settlements","Authority"))}\nSettlement Trouble: ${pick(getTable("Settlements","Settlement Trouble"))}\nLocal Project: ${pick(getTable("Settlements","Settlement Project"))}\nDominant Faction: ${pick(getTable("Factions","Faction Type"))}\nFaction Project: ${pick(getTable("Factions","Project"))}\nSpace Approach: ${pick(getTable("Space Encounters","Space Sighting"))}\nPlanetside Peril: ${pick(getTable("Planets","Planetside Peril"))}\nPlanetside Opportunity: ${pick(getTable("Planets","Planetside Opportunity"))}`;state.worldSeed=text;if($("worldSeed"))$("worldSeed").value=text;addOutput(state.sceneLog.length+1,text,"World Seed","world");saveState();render()}function addOutput(number,text,summary,memory,segments=null){state.lastSceneText=text;state.sceneSegments=segments||segmentsFromText(text);state.sceneLog.push({number,createdAt:new Date().toISOString(),phase:state.phase,intent:state.intent,summary,text,memory,segments:state.sceneSegments,parameters:{...state,sceneLog:undefined,lastSceneText:undefined,sceneSegments:undefined}})}
function renderSceneDraft(card){
  if(!card)return;
  const segments=Array.isArray(state.sceneSegments)?state.sceneSegments:[];
  card.classList.toggle("empty",!state.lastSceneText);
  if(!state.lastSceneText){card.textContent="Generate a scene to begin.";return;}
  if(!segments.length){card.textContent=state.lastSceneText;return;}
  card.innerHTML='<div class="scene-segment-list"></div>';
  const list=card.querySelector('.scene-segment-list');
  segments.forEach((seg,i)=>{
    const wrap=document.createElement('section');wrap.className='scene-segment-card';
    const header=document.createElement('div');header.className='scene-segment-header';
    const h=document.createElement('h3');h.textContent=seg.title||('Section '+(i+1));header.appendChild(h);
    const actions=document.createElement('div');actions.className='scene-segment-actions';
    [['copy','📋','Copy'],['journal','🖋','Add to Journal'],['reroll','🎲','Reroll']].forEach(([act,icon,label])=>{const b=document.createElement('button');b.type='button';b.className='secondary icon-button';b.dataset.sceneSegmentAction=act;b.dataset.sceneSegmentIndex=String(i);b.title=label;b.setAttribute('aria-label',label+' '+(seg.title||''));b.textContent=icon;actions.appendChild(b)});
    header.appendChild(actions);wrap.appendChild(header);
    const box=document.createElement('textarea');box.className='scene-segment-text';box.value=seg.text||'';box.dataset.sceneSegmentText=String(i);setSceneSegmentRows(box);box.addEventListener('input',()=>{state.sceneSegments[i].text=box.value;setSceneSegmentRows(box);syncSceneTextFromSegments();saveState()});wrap.appendChild(box);list.appendChild(wrap);
  });
}
function setSceneSegmentRows(box){const lines=String(box.value||'').split(/\n/).reduce((total,line)=>total+Math.max(1,Math.ceil(line.length/88)),0);box.rows=Math.min(10,Math.max(3,lines));}
function segmentsFromText(text){
  const lines=(text||'').split(/\n/);const segs=[];let current={title:'Scene Header',text:''};
  const headings=new Set(['Oracle Spine','Opening Image','Continuity','Discovery','Plot Pressure','Complication','Danger Situation','Fear / Dread Layer','Threat / Opportunity','Conflict Architecture','Decision Point','Likely Consequence','Current Thread','Mission Seed','World / Colony Seed','Conflict Pressure']);
  for(const line of lines){const clean=line.replace(/:$/,'').trim();if(headings.has(clean)){if(current.text.trim())segs.push({...current,text:current.text.trim()});current={title:clean,text:''};}else current.text+=(current.text?'\n':'')+line;}
  if(current.text.trim())segs.push({...current,text:current.text.trim()});return segs;
}
function syncSceneTextFromSegments(){state.lastSceneText=(state.sceneSegments||[]).map(seg=>(seg.title?seg.title+':\n':'')+(seg.text||'')).join('\n\n');}
document.addEventListener('click',evt=>{const btn=evt.target.closest('[data-scene-segment-action]');if(!btn)return;const idx=Number(btn.dataset.sceneSegmentIndex);const seg=state.sceneSegments&&state.sceneSegments[idx];if(!seg)return;const act=btn.dataset.sceneSegmentAction;if(act==='copy'){navigator.clipboard?.writeText(seg.text||'');setStatus('Copied scene section')}else if(act==='journal'){putTextInJournalComment((seg.title?seg.title+'\n\n':'')+(seg.text||''),'Scene section copied to comment editor for final edit')}else if(act==='reroll'){seg.text=rerollSegmentText(seg.title);syncSceneTextFromSegments();saveState();render();setStatus('Rerolled '+seg.title)}});
function rerollSegmentText(title){
  const t=(title||'').toLowerCase();
  if(t.includes('oracle'))return 'Action '+pick(getTable("Core Oracles","Action"))+' / Theme '+pick(getTable("Core Oracles","Theme"))+' / Descriptor '+pick(getTable("Core Oracles","Descriptor"))+' / Focus '+pick(getTable("Core Oracles","Focus"));
  if(t.includes('opening'))return 'The scene opens in a '+pick(getTable("Core Oracles","Descriptor"))+' '+String(state.surroundings||'place').toLowerCase()+' connected to a '+String(state.locationType||'site').toLowerCase()+'. The first sensory impression is '+pick(getTable("Location Themes","Sensory Detail"))+'. '+describePressure();
  if(t.includes('continuity'))return continuityLine();
  if(t.includes('discovery'))return 'The useful clue is '+pick(getTable("Miscellaneous","Story Clue"))+'. It points toward the current thread without fully resolving it.';
  if(t.includes('plot'))return 'Target: '+pick(getTable("Plot Engine","Plot Target"))+'.\nMethod: '+pick(getTable("Plot Engine","Plot Method"))+'.\nDriver: '+pick(getTable("Plot Engine","Scene Driver"))+'.\nPossible reveal: '+pick(getTable("Plot Engine","Plot Reveals"))+'.';
  if(t.includes('complication'))return pick(getTable("Miscellaneous","Story Complication"))+'.';
  if(t.includes('danger'))return pick([pick(getTable("Danger Situations","Industrial Hazards")),pick(getTable("Danger Situations","Environmental Dangers")),pick(getTable("Danger Situations","Space and Vacuum Dangers")),pick(getTable("Danger Situations","Social Dangers"))])+'.';
  if(t.includes('fear'))return 'Fear trigger: '+pick(getTable("Fear and Dread","Fear Trigger"))+'.\nDread technique: '+pick(getTable("Fear and Dread","Dread Technique"))+'.\nUncanny detail: '+pick(getTable("Fear and Dread","Uncanny Detail"))+'.\nReveal timing: '+pick(getTable("Fear and Dread","Revelation Timing"))+'.\nSafety-aware handling: '+pick(getTable("Fear and Dread","Safety-Aware Horror Prompt"))+'.';
  if(t.includes('threat'))return 'Threat: '+pick(getTable("Planets","Planetside Peril"))+'.\nOpportunity: '+pick(getTable("Planets","Planetside Opportunity"))+'.\nHorror payoff: '+pick(getTable("Miscellaneous","Horror Payoff"))+'.';
  if(t.includes('conflict'))return 'Stake Anchor: '+pick(getTable("Conflict Architecture","Stake Anchor"))+'\nOpposition Logic: '+pick(getTable("Conflict Architecture","Opposition Logic"))+'\nMeaningful Choice: '+pick(getTable("Conflict Architecture","Meaningful Choice"))+'\nEscalation: '+pick(getTable("Conflict Architecture","Escalation"));
  if(t.includes('decision'))return 'Choose between immediate safety, mission progress, and preserving leverage over the people or faction behind this scene.';
  if(t.includes('consequence'))return 'Pay the price: '+pick(getTable("Miscellaneous","Pay the Price"))+'. The most reasonable next location is the '+pick(["sealed service passage","upper observation deck","nearby settlement","underground chamber","emergency shelter","docking bay","forest ridge","old survey beacon","abandoned cargo module","restricted archive","commercial concourse","research annex","asteroid service tunnel","comet ice fissure"])+'.';
  if(t.includes('thread'))return state.currentThread||'No active thread set. Create one from the discovery, stake anchor, or faction pressure.';
  if(t.includes('mission'))return 'Mission: '+pick(getTable("Missions","Mission Type"))+'\nPatron: '+pick(getTable("Missions","Patron"))+'\nTarget Site: '+pick(getTable("Settlements","Settlement Type"))+' / '+pick(getTable("Districts","District Type"))+'\nComplication: '+pick(getTable("Missions","Twist"))+'\nReward: '+pick(getTable("Missions","Reward"));
  if(t.includes('world'))return 'Planetary Class: '+pick(getTable("Planets","Planetary Class"))+'\nPlanet Trait: '+pick(getTable("Planets","Planet Traits"))+'\nSettlement: '+pick(getTable("Settlements","Settlement Type"))+'\nAuthority: '+pick(getTable("Settlements","Authority"))+'\nDominant Faction: '+pick(getTable("Factions","Faction Type"));
  return pick(getTable("Core Oracles","Action"))+' / '+pick(getTable("Core Oracles","Theme"));
}
function describePressure(){if(state.threatLevel>=7)return"Everything feels exposed, watched, or already too late.";if(state.threatLevel>=4)return"There is enough pressure that lingering here has a cost.";if(state.mysteryLevel>=6)return"The scene feels wrong in a way that invites investigation.";return"For now, there is enough room to observe before danger closes in."}function continuityLine(){if(!state.sceneLog.length)return"This is the opening beat. Establish what feels normal before disrupting it.";const last=state.sceneLog[state.sceneLog.length-1];return`This follows from Scene ${last.number}. Carry forward one unresolved element from: ${last.summary}.`}function applyConsequence(consequence){if(consequence.includes("threat"))state.threatLevel=Math.min(10,state.threatLevel+1);if(consequence.includes("mystery"))state.mysteryLevel=Math.min(10,state.mysteryLevel+1);if(state.escalateOnComplication&&state.phase==="Complication")state.threatLevel=Math.min(10,state.threatLevel+1)}function advancePhase(afterScene){const order=["Setup","Approach","Discovery","Complication","Confrontation","Choice","Consequence","Transition"];const i=order.indexOf(state.phase);state.phase=order[(i+1)%order.length];if(afterScene&&state.phase==="Setup")state.pacing=state.threatLevel>=7?"Aftermath":"Calm";else if(afterScene&&state.threatLevel>=6)state.pacing="Dangerous";else if(afterScene&&["Complication","Confrontation","Choice"].includes(state.phase))state.pacing="Escalating"}function buildOracleTree(){const root=$("oracleTree");root.innerHTML="";const filter=(state.oracleFilter||"").trim().toLowerCase();const oracleLayout=[{label:"Core Oracles",children:["Core Oracles"]},{label:"Situations",children:["Campaign","Plot Engine","Missions","Miscellaneous","Danger Situations","Fear and Dread","Conflict Architecture","Space Encounters"]},{label:"NPCs and Orgs",children:["Characters","Factions","Creatures"]},{label:"Locations",children:["Settlements","Location Themes","Colonies and Expeditions","Districts","Starships","Derelicts","Planets","Vaults / Ruins"]}];const matches=(key,value,path)=>{const p=path.concat(key).join(" ").toLowerCase();if(!filter)return true;if(p.includes(filter))return true;if(Array.isArray(value))return value.some(v=>String(v).toLowerCase().includes(filter));return Object.entries(value).some(([ck,cv])=>matches(ck,cv,path.concat(key)))};const buildNode=(key,value,path)=>{if(!matches(key,value,path))return null;if(Array.isArray(value)){const row=document.createElement("div");row.className="table-row";const label=document.createElement("span");label.textContent=`${key} (${value.length})`;const btn=document.createElement("button");btn.className="tiny secondary";btn.textContent="🎲";btn.title="Roll";btn.setAttribute("aria-label","Roll");btn.onclick=()=>{recordOracleUse(path[0]||key);rollTable(path.concat(key),value)};row.appendChild(label);row.appendChild(btn);return row}const details=document.createElement("details");details.className="oracle-node";if(filter)details.open=true;const summary=document.createElement("summary");const label=document.createElement("span");label.textContent=key;const rollAll=document.createElement("button");rollAll.className="tiny secondary";rollAll.textContent="🎲🎲";rollAll.title="Roll group";rollAll.setAttribute("aria-label","Roll group");rollAll.onclick=e=>{e.preventDefault();e.stopPropagation();recordOracleUse(path[0]||key);rollGroup(path.concat(key),value)};summary.appendChild(label);summary.appendChild(rollAll);details.appendChild(summary);for(const[childKey,childValue]of Object.entries(value)){const child=buildNode(childKey,childValue,path.concat(key));if(child)details.appendChild(child)}return details};const buildParent=(parent)=>{if(parent.children.length===1&&parent.children[0]===parent.label){const value=TABLES[parent.label];return value?buildNode(parent.label,value,[]):null}const details=document.createElement("details");details.className="oracle-node oracle-parent";if(filter)details.open=true;const summary=document.createElement("summary");const label=document.createElement("span");label.textContent=parent.label;summary.appendChild(label);details.appendChild(summary);parent.children.forEach(groupName=>{const value=TABLES[groupName];if(!value)return;const node=buildNode(groupName,value,[parent.label]);if(node)details.appendChild(node)});return details.children.length>1?details:null};oracleLayout.forEach(parent=>{const node=buildParent(parent);if(node)root.appendChild(node)});if(!root.children.length){const empty=document.createElement("p");empty.className="small";empty.textContent="No oracle tables match the filter.";root.appendChild(empty)}}function collapseAllOracles(){document.querySelectorAll("#oracleTree details.oracle-node").forEach(node=>node.open=false);setStatus("Collapsed all Oracle sections")}function recordOracleUse(group){if(!group)return;if(!state.oracleUsage)state.oracleUsage={};state.oracleUsage[group]=(state.oracleUsage[group]||0)+1;saveState()}function appendOracleOutput(text){const box=$("oracleOutput");if(!box.dataset.hasRolls){box.textContent="";box.dataset.hasRolls="true"}box.textContent+=(box.textContent?"\n\n---\n":"")+text;box.scrollTop=box.scrollHeight}function rollTable(path,values){appendOracleOutput(`${path.join(" > ")}\n${pick(values)}`)}function rollGroup(path,group){const leaves=flattenKeys(group,path);let prefix=commonPathPrefix(leaves.map(t=>t.path));if(prefix.length===0)prefix=path;const lines=leaves.map(t=>`${t.path.slice(prefix.length).join(" > ")}: ${pick(t.values)}`);appendOracleOutput(`${prefix.join(" > ")}\n${lines.join("\n")}`)}function commonPathPrefix(paths){if(!paths.length)return[];const prefix=[];for(let i=0;i<paths[0].length;i++){const value=paths[0][i];if(paths.every(p=>p[i]===value))prefix.push(value);else break}return prefix}async function copyOracleOutput(){const box=$("oracleOutput");await navigator.clipboard.writeText((box.innerText||box.textContent||""));setStatus("Copied table output")}function appendOracleToJournal(){const box=$("oracleOutput");const text=box&&box.dataset.hasRolls?(box.innerText||box.textContent||"").trim():"";if(!text){setStatus("No table output to add");return}putTextInJournalComment(text,"Oracle output copied to comment editor for final edit")}function clearOracleOutput(){const box=$("oracleOutput");box.textContent="Roll from the table tree.";delete box.dataset.hasRolls;setStatus("Cleared table output")}function undoScene(){state.sceneLog.pop();state.lastSceneText=state.sceneLog.length?state.sceneLog[state.sceneLog.length-1].text:"";saveState();render()}function clearLog(){if(!confirm("Clear the scene log?"))return;state.sceneLog=[];state.lastSceneText="";saveState();render()}async function copyCurrentScene(){if(!state.lastSceneText)return;await navigator.clipboard.writeText(state.lastSceneText);setStatus("Copied output")}function exportJson(){readFormAndSave();const blob=new Blob([JSON.stringify(state,null,2)],{type:"application/json"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);const stamp=new Date().toISOString().slice(0,19).replaceAll(":","-");a.download=`hostile-sci-fi-worldbuilder-${stamp}.json`;a.click();URL.revokeObjectURL(a.href);setStatus("Exported JSON")}function escapeRtfText(text){return String(text||"").replace(/[\\{}]/g,"\\$&").replace(/\r?\n/g,"\\par ").replace(/[\u0080-\uFFFF]/g,ch=>"\\u"+ch.charCodeAt(0)+"?")}function htmlToRtf(html){const doc=new DOMParser().parseFromString("<div>"+(html||"")+"</div>","text/html");function walk(node){if(node.nodeType===3)return escapeRtfText(node.nodeValue);if(node.nodeType!==1)return"";const tag=node.tagName.toLowerCase();if(tag==="br")return"\\par ";if(tag==="img"){const src=node.getAttribute("src")||"";const m=src.match(/^data:image\/(png|jpeg|jpg);base64,(.+)$/i);if(!m)return" [image] ";const kind=m[1].toLowerCase()==="png"?"pngblip":"jpegblip";const bin=atob(m[2]);let hex="";for(let i=0;i<bin.length;i++)hex+=("0"+bin.charCodeAt(i).toString(16)).slice(-2);return"{\\pict\\"+kind+" "+hex+"}\\par ";}let inner="";node.childNodes.forEach(c=>inner+=walk(c));if(tag==="b"||tag==="strong")return"{\\b "+inner+"}";if(tag==="i"||tag==="em")return"{\\i "+inner+"}";if(tag==="h1"||tag==="h2"||tag==="h3")return"\\par {\\b\\fs32 "+inner+"}\\par ";if(tag==="li")return"\\par \\bullet "+inner;if(tag==="blockquote")return"\\par \\li360 {\\i "+inner+"}\\li0 \\par ";if(["p","div","section","article","ul","ol"].includes(tag))return inner+"\\par ";return inner}let out="";doc.body.firstChild.childNodes.forEach(c=>out+=walk(c));return out}function exportJournalRichText(){if(!Array.isArray(state.journal)||!state.journal.length){setStatus("No journal entries to export");return}const stamp=new Date().toISOString().slice(0,19).replaceAll(":","-");let body="{\\b\\fs36 Hostile Sci-fi Worldbuilder Journal}\\par\\par ";state.journal.forEach(entry=>{body+="{\\b "+escapeRtfText(new Date(entry.createdAt).toLocaleString()+" — "+(entry.source||"Journal"))+"}\\par ";body+=entry.isHtml?htmlToRtf(entry.text):escapeRtfText(entry.text||"");body+="\\par\\par "});const rtf="{\\rtf1\\ansi\\deff0{\\fonttbl{\\f0 Arial;}}\\f0\\fs22 "+body+"}";const blob=new Blob([rtf],{type:"application/rtf"});const a=document.createElement("a");a.href=URL.createObjectURL(blob);a.download=`hostile-sci-fi-worldbuilder-journal-${stamp}.rtf`;a.click();URL.revokeObjectURL(a.href);setStatus("Exported Journal RTF")}function importJson(evt){const file=evt.target.files[0];if(!file)return;const reader=new FileReader();reader.onload=()=>{try{const imported=JSON.parse(reader.result);state={...DEFAULT_STATE,...imported};saveState();render();setStatus("Imported campaign JSON")}catch(e){alert("Could not import JSON: "+e.message)}};reader.readAsText(file)}function supportsFileSystemAccess(){return"showSaveFilePicker"in window}async function bindFile(){if(!supportsFileSystemAccess()){alert("This browser does not support file binding. Use Export/Import JSON instead.");return}try{boundFileHandle=await window.showSaveFilePicker({suggestedName:"hostile-sci-fi-worldbuilder-campaign.json",types:[{description:"JSON",accept:{"application/json":[".json"]}}]});await saveBoundFile();setStatus("Bound save file")}catch(e){if(e.name!=="AbortError")alert("File binding failed: "+e.message)}}async function saveBoundFile(){if(!boundFileHandle){alert("No bound file yet. Use Bind Save File first.");return}readFormAndSave();const writable=await boundFileHandle.createWritable();await writable.write(JSON.stringify(state,null,2));await writable.close();setStatus("Saved bound file "+new Date().toLocaleTimeString())}function configureAutosave(){if(autosaveTimer)clearInterval(autosaveTimer);autosaveTimer=null;if($("autosaveBoundFile").checked){autosaveTimer=setInterval(()=>{if(boundFileHandle)saveBoundFile().catch(err=>setStatus("Autosave failed"))},10*60*1000);setStatus("10-minute autosave enabled")}else setStatus("10-minute autosave disabled")}

function showCenterTab(tab,save=true){state.activeCenterTab=tab==="journal"?"journal":"output";const out=$("currentOutputView");const journal=$("journalView");const outBtn=$("showOutputTab");const journalBtn=$("showJournalTab");if(out)out.classList.toggle("active-view",state.activeCenterTab==="output");if(journal)journal.classList.toggle("active-view",state.activeCenterTab==="journal");if(outBtn)outBtn.classList.toggle("active",state.activeCenterTab==="output");if(journalBtn)journalBtn.classList.toggle("active",state.activeCenterTab==="journal");document.body.classList.toggle("center-focused",state.activeCenterTab==="output"||state.activeCenterTab==="journal");if(save)saveState()}function showLeftTab(tab,save=true){state.activeLeftTab=(tab==="crew"||tab==="living")?tab:"scene";const scene=$("controlsPanel");const crew=$("crewLinkPanel");const living=$("livingShipPanel");if(scene)scene.classList.toggle("active-left-view",state.activeLeftTab==="scene");if(crew)crew.classList.toggle("active-left-view",state.activeLeftTab==="crew");if(living)living.classList.toggle("active-left-view",state.activeLeftTab==="living");document.querySelectorAll("[data-left-tab]").forEach(btn=>btn.classList.toggle("active",btn.dataset.leftTab===state.activeLeftTab));document.body.classList.toggle("left-crew-expanded",state.activeLeftTab==="crew"||state.activeLeftTab==="living");if(document.body.classList.contains("side-panel-open")&&window.matchMedia("(max-width: 900px)").matches){if(scene)scene.classList.toggle("is-open",state.activeLeftTab==="scene");if(crew)crew.classList.toggle("is-open",state.activeLeftTab==="crew");if(living)living.classList.toggle("is-open",state.activeLeftTab==="living");}if(save)saveState()}
function sanitizeHtml(html){const template=document.createElement("template");template.innerHTML=html||"";template.content.querySelectorAll("script,style,iframe,object,embed").forEach(n=>n.remove());template.content.querySelectorAll("*").forEach(el=>{[...el.attributes].forEach(attr=>{const name=attr.name.toLowerCase();const value=attr.value||"";if(name.startsWith("on")||value.toLowerCase().startsWith("javascript:"))el.removeAttribute(attr.name)})});return template.innerHTML.trim()}
function editorHtml(id){const el=$(id);return el?sanitizeHtml(el.innerHTML):""}
function putTextInJournalComment(text,statusMsg){const editor=$("journalCommentEditor");const clean=(text||"").trim();if(!clean){setStatus("Nothing to add to comment editor");return}if(editor){const html=escapeHtml(clean).replace(/\n/g,"<br>");if(editor.innerHTML.trim()&&editor.innerHTML.trim()!=="<br>")editor.insertAdjacentHTML("beforeend","<br><br>"+html);else editor.innerHTML=html;showCenterTab("journal");editor.focus();setStatus(statusMsg||"Copied to comment editor for final edit")}}function addJournalEntry(text,source="Comment",isHtml=false){const clean=isHtml?sanitizeHtml(text):(text||"").trim();if(!clean||clean==="<br>"){setStatus("Nothing to add to journal");return}if(!Array.isArray(state.journal))state.journal=[];state.journal.push({id:"j"+Date.now()+Math.random().toString(16).slice(2),createdAt:new Date().toISOString(),source,text:clean,isHtml:!!isHtml,isEditing:false});saveState();renderJournal();showCenterTab("journal");setStatus("Added to journal")}
function addCurrentOutputToJournal(){putTextInJournalComment(state.lastSceneText||"","Scene draft copied to comment editor for final edit")}
function addJournalComment(){const editor=$("journalCommentEditor");addJournalEntry(editor?editor.innerHTML:"","Comment",true);if(editor)editor.innerHTML=""}
function clearJournalComment(){const editor=$("journalCommentEditor");if(editor)editor.innerHTML="";setStatus("Cleared comment editor")}
function makeFormatToolbar(targetId){const toolbar=document.createElement("div");toolbar.className="format-toolbar";toolbar.dataset.editorToolbar=targetId;[["bold","𝗕","Bold"],["italic","𝘐","Italic"],["insertUnorderedList","•","Bullet list"],["insertOrderedList","☷","Numbered list"],["formatBlock","❝","Quote","blockquote"],["formatBlock","▣","Header","h2"],["indent","⇥","Indent"],["outdent","⇤","Outdent"]].forEach(item=>{const btn=document.createElement("button");btn.type="button";btn.className="icon-button secondary";btn.dataset.format=item[0];if(item[3])btn.dataset.formatValue=item[3];btn.title=item[2];btn.setAttribute("aria-label",item[2]);btn.textContent=item[1];toolbar.appendChild(btn)});const img=document.createElement("label");img.className="icon-button secondary image-upload-button";img.title="Insert image";img.setAttribute("aria-label","Insert image");img.textContent="🖼";const input=document.createElement("input");input.type="file";input.accept="image/*";input.dataset.imageTarget=targetId;img.appendChild(input);toolbar.appendChild(img);return toolbar}
function initRichEditorToolbars(){document.addEventListener("click",evt=>{const btn=evt.target.closest("[data-format]");if(!btn)return;const toolbar=btn.closest("[data-editor-toolbar]");if(!toolbar)return;evt.preventDefault();const editor=$(toolbar.dataset.editorToolbar);if(editor)editor.focus();const cmd=btn.dataset.format;const value=btn.dataset.formatValue||null;document.execCommand(cmd,false,value);if(editor)editor.focus()})}function initImageUploads(){document.addEventListener("change",evt=>{const input=evt.target.closest("input[type='file'][data-image-target]");if(!input||!input.files||!input.files[0])return;const editor=$(input.dataset.imageTarget);if(!editor)return;const file=input.files[0];const reader=new FileReader();reader.onload=()=>{editor.focus();document.execCommand("insertHTML",false,makeResizableImageHtml(reader.result,file.name));input.value=""};reader.readAsDataURL(file)});initImageResizeHandles()}
function makeResizableImageHtml(src,name){return `<span class="resizable-image" contenteditable="false"><img src="${src}" alt="${escapeHtml(name)}"><span class="resize-handle" title="Drag to resize"></span></span>&nbsp;`}
function initImageResizeHandles(){let active=null;document.addEventListener("pointerdown",evt=>{const handle=evt.target.closest(".resize-handle");if(!handle)return;const wrap=handle.closest(".resizable-image");const img=wrap&&wrap.querySelector("img");if(!img)return;evt.preventDefault();active={img,startX:evt.clientX,startY:evt.clientY,startW:img.offsetWidth,startH:img.offsetHeight,ratio:(img.naturalWidth&&img.naturalHeight)?img.naturalHeight/img.naturalWidth:(img.offsetHeight/img.offsetWidth||.65)};handle.setPointerCapture&&handle.setPointerCapture(evt.pointerId)});document.addEventListener("pointermove",evt=>{if(!active)return;evt.preventDefault();const dx=evt.clientX-active.startX;const dy=evt.clientY-active.startY;const width=Math.max(80,active.startW+dx);const height=Math.max(50,active.startH+dy);active.img.style.width=width+"px";active.img.style.height=(evt.shiftKey?height:Math.round(width*active.ratio))+"px"});document.addEventListener("pointerup",()=>{active=null})}

function lynxDefaults(){if(!state.lynxShip)state.lynxShip={};state.lynxShip={name:"Lynx Rescue Ship",preset:"rescue",decks:5,zones:4,threat:"medium",lighting:"emergency",mission:"",threatScore:0,output:"",...state.lynxShip};return state.lynxShip}
function initLynxOptions(){if(!$('lynxPreset'))return;populateSelect('lynxPreset',['rescue','derelict','military','research','frontier','horror']);populateSelect('lynxThreat',['low','medium','high','extreme']);populateSelect('lynxLighting',['normal','emergency','blackout'])}
function bindLynxGenerator(){['lynxShipName','lynxPreset','lynxDecks','lynxZones','lynxThreat','lynxLighting','lynxMission'].forEach(id=>{const el=$(id);if(el){el.addEventListener('input',readLynxAndSave);el.addEventListener('change',readLynxAndSave)}});const gen=$('lynxGenerate'),event=$('lynxEvent'),clear=$('lynxClearOutput'),toJournal=$('lynxToJournal');if(gen)gen.addEventListener('click',generateLynxShip);if(event)event.addEventListener('click',generateLynxEvent);if(clear)clear.addEventListener('click',()=>{lynxDefaults().output='';saveState();renderLynxGenerator();setStatus('Cleared ship generator output')});if(toJournal)toJournal.addEventListener('click',()=>{const lx=lynxDefaults();putTextInJournalComment(lx.output||'', 'Ship output copied to comment editor for final edit')})}
function readLynxAndSave(){const lx=lynxDefaults();if(!$('lynxShipName'))return;lx.name=$('lynxShipName').value||'Lynx Rescue Ship';lx.preset=$('lynxPreset').value||'rescue';lx.decks=Math.max(1,Math.min(12,Number($('lynxDecks').value||5)));lx.zones=Math.max(2,Math.min(8,Number($('lynxZones').value||4)));lx.threat=$('lynxThreat').value||'medium';lx.lighting=$('lynxLighting').value||'emergency';lx.mission=$('lynxMission').value||'';saveState()}
function renderLynxGenerator(){const lx=lynxDefaults();if(!$('lynxShipName'))return;$('lynxShipName').value=lx.name||'Lynx Rescue Ship';$('lynxPreset').value=lx.preset||'rescue';$('lynxDecks').value=lx.decks||5;$('lynxZones').value=lx.zones||4;$('lynxThreat').value=lx.threat||'medium';$('lynxLighting').value=lx.lighting||'emergency';$('lynxMission').value=lx.mission||'';const out=$('lynxOutput');if(out){out.textContent=lx.output||'Configure the ship generator, then generate a modular ship interior.';out.classList.toggle('empty',!lx.output)}}
function lynxPick(list){return list[Math.floor(Math.random()*list.length)]}
function lynxRoll(n){return Math.floor(Math.random()*n)+1}
const LYNX_DECKS=['Bridge / Command','Passenger Habitat','Medical and Triage','Cargo Handling','Engineering Core','Cryo / Cold Sleep','Sensor and Comms','Security Deck','Launch and Docking','Life Support Spine','Data Archive','Drone Operations'];
const LYNX_ZONES=['Cabins','Med Bay','Cargo Hold','Security Node','Life Support','Escape Corridor','Drone Bay','Auxiliary Control','Airlock Cluster','Maintenance Crawlway','Power Junction','Galley / Commons','Isolation Ward','Sensor Alcove','Workshop','Specimen Locker','Briefing Room','Emergency Shelter'];
const LYNX_HAZARDS=['Fire spreads through a service duct','Door lockdown splits the crew','Oxygen loss in a pressure zone','Hostile breach detected','System failure cascades across the deck','Radiation alarm from a damaged conduit','Gravity flickers or reverses locally','A sealed hatch hides movement','Coolant fog obscures the corridor','Automated defense routine wakes up'];
const LYNX_EVENTS=['Fire spreads','Door lockdown','Oxygen loss','Hostile breach','System failure','Distress ping from a hidden compartment','Cargo restraint failure','Emergency bulkhead slams shut','Unknown life sign appears','Main lights fail for one deck'];
function lynxThreatHazards(level){return {low:1,medium:2,high:3,extreme:4}[level]||2}
function lynxLightingText(mode){return {normal:'Normal operating lights with clear routes and readable panels.',emergency:'Emergency red lighting, pulsing alarms, and long shadowed corridors.',blackout:'Blackout conditions: handheld lights, sparks, silhouettes, and intermittent terminal glow.'}[mode]||'Emergency lighting.'}
function lynxPresetText(preset){return {rescue:'Rescue ship under pressure: triage, survivors, blocked passages, and evacuation choices.',derelict:'Derelict boarding scenario: lost crew, failing systems, and uncertain salvage rights.',military:'Military response craft: hardpoints, security nodes, and tactical choke points.',research:'Research vessel: labs, quarantine, sensor anomalies, and dangerous samples.',frontier:'Frontier utility ship: patched systems, mixed cargo, and improvised repairs.',horror:'Hostile survival scenario: isolation, dread, and a ship that reveals problems slowly.'}[preset]||'Procedural Lynx-class ship interior.'}
function generateLynxShip(){readLynxAndSave();const lx=lynxDefaults();const deckCount=lx.decks||5;const zoneCount=lx.zones||4;const hazardsPerDeck=lynxThreatHazards(lx.threat);let lines=[];lines.push('🚀 Lynx-Class Ship Generated');lines.push('Ship: '+(lx.name||'Lynx Rescue Ship'));lines.push('Preset: '+lynxPresetText(lx.preset));lines.push('Lighting: '+lynxLightingText(lx.lighting));lines.push('Threat Intensity: '+String(lx.threat||'medium').toUpperCase());if(lx.mission)lines.push('Mission: '+lx.mission);lines.push('');lines.push('Foundry-style module behavior: scene flagged as a Lynx instance, threat clock initialized, decks rendered as modular notes/tiles, and each zone can become a scene node.');lines.push('');for(let d=0;d<deckCount;d++){const deckName=lynxPick(LYNX_DECKS);lines.push('DECK '+(d+1)+': '+deckName);let zones=[];for(let z=0;z<zoneCount;z++){const zone=lynxPick(LYNX_ZONES);zones.push(zone)}lines.push('  Zones: '+zones.join(' | '));let hazards=[];for(let h=0;h<hazardsPerDeck;h++)hazards.push(lynxPick(LYNX_HAZARDS));lines.push('  Hazards: '+hazards.join(' ; '));lines.push('  Scene Preset: '+lynxDeckPreset(deckName,zones));lines.push('')}lx.threatScore=0;lx.output=lines.join('\n');saveState();renderLynxGenerator();setStatus('Ship generated')}
function lynxDeckPreset(deckName,zones){if(deckName.includes('Bridge'))return 'Command decisions, comms failures, and route control.';if(deckName.includes('Medical'))return 'Triage pressure, contamination checks, and survivor conflicts.';if(deckName.includes('Engineering'))return 'Repair clock, reactor access, and cascading system danger.';if(deckName.includes('Cargo'))return 'Blocked movement, salvage, hidden cargo, and ambush cover.';if(deckName.includes('Cryo'))return 'Awakening pods, identity questions, and failing life support.';if(deckName.includes('Security'))return 'Lockdowns, restricted doors, and automated countermeasures.';return 'Exploration node with one clear route, one risky shortcut, and one hidden complication.'}
function generateLynxEvent(){readLynxAndSave();const lx=lynxDefaults();lx.threatScore=Number(lx.threatScore||0)+1;const event=lynxPick(LYNX_EVENTS);const zone=lynxPick(LYNX_ZONES);const action=pick(getTable('Core Oracles','Action')||['React']);const theme=pick(getTable('Core Oracles','Theme')||['Survival']);const output='⚡ Lynx Gameplay Event\n\nThreat Clock: '+lx.threatScore+'\nEvent: '+event+'\nAffected Zone: '+zone+'\nOracle Cue: '+action+' / '+theme+'\nGM Move: escalate the ship map, reveal a new route, cut off a safe path, or force a crew resource decision.';lx.output=(lx.output?lx.output+'\n\n---\n':'')+output;saveState();renderLynxGenerator();setStatus('Lynx gameplay event generated')}
function iconImg(src,alt){return `<img class="button-inline-icon" src="${src}" alt="${escapeHtml(alt||"")}">`}
function renderJournal(){const list=$("journalList");if(!list)return;if(!Array.isArray(state.journal))state.journal=[];list.innerHTML="";if(state.journal.length===0){const empty=document.createElement("p");empty.className="small";empty.textContent="No journal entries yet.";list.appendChild(empty);return}state.journal.forEach(entry=>{const card=document.createElement("div");card.className="journal-entry";const top=document.createElement("div");top.className="journal-entry-top";const meta=document.createElement("div");meta.className="journal-meta";meta.textContent=`${new Date(entry.createdAt).toLocaleString()} — ${entry.source||"Journal"}`;const actions=document.createElement("div");actions.className="journal-actions top-actions";top.appendChild(meta);top.appendChild(actions);card.appendChild(top);if(entry.isEditing){const editorId="edit_"+entry.id;card.appendChild(makeFormatToolbar(editorId));const edit=document.createElement("div");edit.id=editorId;edit.className="rich-editor journal-edit";edit.contentEditable="true";edit.innerHTML=entry.isHtml?sanitizeHtml(entry.text):escapeHtml(entry.text||"").replace(/\n/g,"<br>");card.appendChild(edit);const saveBtn=document.createElement("button");saveBtn.className="secondary icon-button";saveBtn.title="Save";saveBtn.setAttribute("aria-label","Save");saveBtn.textContent="💾";saveBtn.addEventListener("click",()=>{entry.text=sanitizeHtml(edit.innerHTML);entry.isHtml=true;entry.isEditing=false;saveState();renderJournal()});const cancelBtn=document.createElement("button");cancelBtn.className="secondary icon-button";cancelBtn.title="Cancel";cancelBtn.setAttribute("aria-label","Cancel");cancelBtn.textContent="↩";cancelBtn.addEventListener("click",()=>{entry.isEditing=false;renderJournal()});actions.appendChild(saveBtn);actions.appendChild(cancelBtn)}else{const text=document.createElement("div");text.className="journal-text";if(entry.isHtml)text.innerHTML=sanitizeHtml(entry.text);else text.textContent=entry.text||"";card.appendChild(text);const editBtn=document.createElement("button");editBtn.className="secondary icon-button";editBtn.title="Edit";editBtn.setAttribute("aria-label","Edit");editBtn.innerHTML=iconImg("./edit-icon.png","Edit");editBtn.addEventListener("click",()=>{entry.isEditing=true;renderJournal()});const delBtn=document.createElement("button");delBtn.className="secondary icon-button";delBtn.title="Delete";delBtn.setAttribute("aria-label","Delete");delBtn.innerHTML=iconImg("./delete-icon.png","Delete");delBtn.addEventListener("click",()=>{if(confirm("Delete this journal entry?")){state.journal=state.journal.filter(j=>j.id!==entry.id);saveState();renderJournal()}});actions.appendChild(editBtn);actions.appendChild(delBtn)}list.appendChild(card)});list.scrollTop=list.scrollHeight}
function escapeHtml(text){return(text||"").replace(/[&<>"']/g,ch=>({"&":"&amp;","<":"&lt;",">":"&gt;","\"":"&quot;","'":"&#039;"}[ch]))}
function newCampaign(){if(!confirm("Start a new campaign and clear local state? Export first if you want a backup."))return;state=structuredClone(DEFAULT_STATE);saveState();render()}function setStatus(msg){$("saveStatus").textContent=msg}

function openSettingsModal(){const modal=$("settingsModal"),backdrop=$("settingsBackdrop");if(modal)modal.hidden=false;if(backdrop)backdrop.hidden=false;document.body.classList.add("settings-open");}
function closeSettingsModal(){const modal=$("settingsModal"),backdrop=$("settingsBackdrop");if(modal)modal.hidden=true;if(backdrop)backdrop.hidden=true;document.body.classList.remove("settings-open");}
function initMobilePanels(){
  const backdrop = $("panelBackdrop");
  const controls = $("controlsPanel");
  const oracles = $("oraclePanel");
  const storage = $("storagePanel");
  const crewLink = $("crewLinkPanel");
  const livingShip = $("livingShipPanel");
  const entityTracker = $("entityTrackerPanel");
  const output = $("outputPanel");
  const panels = [controls, oracles, storage, crewLink, livingShip, entityTracker].filter(Boolean);

  function closePanels(){
    panels.forEach(p => p.classList.remove("is-open"));
    if (backdrop) backdrop.hidden = true;
    document.body.classList.remove("side-panel-open");
  }

  function openPanel(panel){
    if (!panel) return;
    panels.forEach(p => p.classList.toggle("is-open", p === panel));
    if (backdrop) backdrop.hidden = false;
    document.body.classList.add("side-panel-open");
  }

  const openControls = $("openControlsPanel");
  const openOracle = $("openOraclePanel");
  const openStorage = $("openStoragePanel");
  const focusOutput = $("focusOutputPanel");
  const openCrewLink = $("openCrewLinkPanel");
  const openLivingShip = $("openLivingShipPanel");
  const openEntityTracker = $("openEntityTrackerPanel");

  if (openControls) openControls.addEventListener("click", () => { showLeftTab("scene"); openPanel(controls); });
  if (openOracle) openOracle.addEventListener("click", () => openPanel(oracles));
  if (openStorage) openStorage.addEventListener("click", () => openSettingsModal());
  if (openCrewLink) openCrewLink.addEventListener("click", () => { showLeftTab("crew"); openPanel(crewLink); });
  if (openLivingShip) openLivingShip.addEventListener("click", () => { showLeftTab("living"); openPanel(livingShip); });
  if (openEntityTracker) openEntityTracker.addEventListener("click", () => { showLeftTab("entity"); openPanel(entityTracker); });
  if (focusOutput) focusOutput.addEventListener("click", () => {
    closePanels();
    if (output) output.scrollIntoView({behavior:"smooth", block:"start"});
  });

  if (backdrop) backdrop.addEventListener("click", closePanels);
  document.querySelectorAll("[data-close-panel]").forEach(btn => btn.addEventListener("click", closePanels));
  document.addEventListener("keydown", evt => {
    if (evt.key === "Escape"){ closePanels(); closeSettingsModal(); }
  });

  // Auto-close after generating content on narrow screens so the middle output stays visible.
  ["generateScene","generateMission","generateWorld"].forEach(id => {
    const btn = $(id);
    if (btn) btn.addEventListener("click", () => {
      if (window.matchMedia("(max-width: 900px)").matches) {
        setTimeout(closePanels, 120);
      }
    });
  });
}


// Entity Tracker extension
const ENTITY_TYPES = {
  npc: { label: 'NPCs', singular: 'NPC', icon: '♟' },
  location: { label: 'Locations', singular: 'Location', icon: 'img:entity-compass.png' },
  faction: { label: 'Factions', singular: 'Faction', icon: '⚑' },
  asset: { label: 'Assets', singular: 'Asset', icon: '▣' }
};
const ENTITY_SUBTYPES = {
  npc: [
    {key:'person', label:'Person', icon:'♟'},
    {key:'crew', label:'Crew', icon:'♙'},
    {key:'agent', label:'Agent', icon:'◉'},
    {key:'contact', label:'Contact', icon:'◎'},
    {key:'rival', label:'Rival', icon:'◍'}
  ],
  location: [
    {key:'compass', label:'General Location', icon:'img:entity-compass.png'},
    {key:'planet', label:'Planet', icon:'img:entity-planet.png'},
    {key:'city', label:'City', icon:'⌂'},
    {key:'colony', label:'Colony', icon:'⌘'},
    {key:'station', label:'Space Station', icon:'◎'},
    {key:'asteroid', label:'Asteroid Belt', icon:'◌'},
    {key:'district', label:'District', icon:'▦'},
    {key:'ruin', label:'Vault / Ruin', icon:'△'}
  ],
  faction: [
    {key:'faction', label:'Faction', icon:'⚑'},
    {key:'corporation', label:'Corporation', icon:'▣'},
    {key:'government', label:'Government', icon:'◈'},
    {key:'cult', label:'Cult', icon:'◆'},
    {key:'crew', label:'Crew / Cell', icon:'⬢'},
    {key:'syndicate', label:'Syndicate', icon:'⬟'}
  ],
  asset: [
    {key:'asset', label:'Asset', icon:'▣'},
    {key:'starship', label:'Starship', icon:'img:entity-starship.png'},
    {key:'vehicle', label:'Vehicle', icon:'◧'},
    {key:'cargo', label:'Cargo', icon:'▤'},
    {key:'artifact', label:'Artifact', icon:'◇'},
    {key:'equipment', label:'Equipment', icon:'◫'}
  ]
};
const ENTITY_THUMBNAILS = Object.fromEntries(Object.entries(ENTITY_SUBTYPES).map(([type,rows])=>[type, rows.map(r=>r.icon)]));
const ENTITY_TAGS = {npc:[],location:[],faction:[],asset:[]};
function entityTagCatalog(){
  if(!state.entityTagCatalog || typeof state.entityTagCatalog!=="object") state.entityTagCatalog={};
  Object.keys(ENTITY_TYPES||{}).forEach(type=>{if(!Array.isArray(state.entityTagCatalog[type])) state.entityTagCatalog[type]=[];});
  return state.entityTagCatalog;
}
function tagSlug(label){return String(label||"").trim().toLowerCase().replace(/[^a-z0-9]+/g,"-").replace(/^-+|-+$/g,"").slice(0,40)||"custom-tag"}
function tagRowsForType(type){
  const custom=(entityTagCatalog()[type]||[]).filter(t=>t&&t.key&&t.label);
  const seen=new Set();
  return custom.filter(t=>{if(seen.has(t.key))return false;seen.add(t.key);return true;});
}
function defaultTagForType(type){return ""}
function tagMeta(type,tag){
  return tagRowsForType(type).find(t=>t.key===tag)||{key:tag||"",label:String(tag||"").replace(/[-_]/g," ").replace(/\b\w/g,c=>c.toUpperCase())||"Untagged",icon:"◇"};
}
function addCustomTagForType(type,label){
  const clean=String(label||"").trim(); if(!clean)return null;
  const rows=tagRowsForType(type);
  const existing=rows.find(t=>t.key===clean || t.label.toLowerCase()===clean.toLowerCase());
  if(existing)return existing;
  const catalog=entityTagCatalog();
  let key=tagSlug(clean); let base=key; let i=2;
  while(tagRowsForType(type).some(t=>t.key===key)){key=base+"-"+i++;}
  const tag={key,label:clean,icon:"◇"};
  catalog[type].unshift(tag);
  return tag;
}
function pruneUnusedEntityTags(){
  const catalog=entityTagCatalog();
  const used={npc:new Set(),location:new Set(),faction:new Set(),asset:new Set()};
  (state.entities?.items||[]).forEach(ent=>{
    const type=ent.type||"asset";
    (ent.tags||[]).filter(Boolean).forEach(tag=>{if(used[type])used[type].add(tag);});
  });
  Object.keys(catalog).forEach(type=>{
    catalog[type]=(catalog[type]||[]).filter(tag=>used[type]?.has(tag.key));
  });
}
function normalizeEntityTags(ent){
  if(!ent.tags||!Array.isArray(ent.tags)) ent.tags=[];
  ent.tags=[...new Set(ent.tags.filter(Boolean))];
  return ent.tags;
}
function entityTagLabels(ent){const tags=normalizeEntityTags(ent);return tags.length?tags.map(t=>tagMeta(ent.type,t).label).join(", "):"No tags"}
function entityPrimaryTagIcon(ent){const tag=normalizeEntityTags(ent)[0];return tag?tagMeta(ent.type,tag).icon:(ENTITY_TYPES[ent.type]?.icon||"⬢")}


function entityIconMarkup(icon,label='Entity'){
  const safeLabel=escapeHtml(label||'Entity');
  if(String(icon||'').startsWith('img:')) return `<img class="entity-icon-img" src="${escapeHtml(String(icon).slice(4))}" alt="${safeLabel}">`;
  return `<span class="entity-icon-text" aria-hidden="true">${escapeHtml(icon||'⬢')}</span>`;
}
function subtypeRowsForType(type){return ENTITY_SUBTYPES[type]||ENTITY_SUBTYPES.asset}
function defaultSubtypeForType(type){return subtypeRowsForType(type)[0]?.key||'asset'}
function subtypeMeta(type,subtype){return subtypeRowsForType(type).find(s=>s.key===subtype)||subtypeRowsForType(type)[0]||{key:'asset',label:'Asset',icon:'▣'}}
function entityResolvedIcon(ent){if(!ent)return '⬢';normalizeEntityTags(ent);if(ent.thumbnailImage)return 'img:'+ent.thumbnailImage;return entityPrimaryTagIcon(ent)||ENTITY_TYPES[ent.type]?.icon||'⬢'}
function ensureEntityState(){
  if(!state.entities) state.entities={items:[], activeId:null, history:[]};
  if(!Array.isArray(state.entities.items)) state.entities.items=[];
  if(!Array.isArray(state.entities.history)) state.entities.history=[];
  state.entities.items.forEach(ent=>{normalizeEntityTags(ent);if(!Array.isArray(ent.relationships))ent.relationships=[];if(ent.links==null)ent.links="";if(ent.thumbnailImage==null)ent.thumbnailImage="";ent.thumbnail=ent.thumbnailImage?("img:"+ent.thumbnailImage):entityPrimaryTagIcon(ent);});
  return state.entities;
}
function entityId(){return 'ent_'+Date.now().toString(36)+'_'+Math.random().toString(36).slice(2,7)}
function entityById(id){return ensureEntityState().items.find(e=>e.id===id)}
function defaultEntity(type){const meta=ENTITY_TYPES[type]||ENTITY_TYPES.asset;return {id:entityId(), type, tags:[], thumbnail:meta.icon, thumbnailImage:'', name:'New '+meta.singular, links:'', relationshipDescription:'', overview:'', revealed:'', relationships:[]}}
function entityDisplayName(ent){return ent ? (ent.name||ENTITY_TYPES[ent.type]?.singular||'Entity') : 'Entity'}
function ensureReciprocalEntityRelationships(){const es=ensureEntityState();const byId=new Map(es.items.map(e=>[e.id,e]));es.items.forEach(ent=>{if(!Array.isArray(ent.relationships))ent.relationships=[];ent.relationships=ent.relationships.filter(r=>r&&r.id&&byId.has(r.id)&&r.id!==ent.id);ent.relationships.forEach(r=>{const other=byId.get(r.id);if(!Array.isArray(other.relationships))other.relationships=[];if(!other.relationships.some(back=>back.id===ent.id)){other.relationships.push({id:ent.id,description:'Connected to '+entityDisplayName(ent)});}});});}
function setActiveEntity(id, pushHistory=true){const es=ensureEntityState();if(!entityById(id))return;if(pushHistory && es.activeId && es.activeId!==id){es.history=[es.activeId,...es.history.filter(x=>x!==es.activeId)].slice(0,8)}es.activeId=id;saveState();renderEntityTracker()}
function addEntity(type){const es=ensureEntityState();const ent=defaultEntity(type);es.items.push(ent);setActiveEntity(ent.id,false);saveState();renderEntityTracker()}
function removeEntity(id){const es=ensureEntityState();if(!id)return;if(!confirm('Remove this entity and its relationships?'))return;es.items=es.items.filter(e=>e.id!==id);es.items.forEach(e=>e.relationships=(e.relationships||[]).filter(r=>r.id!==id));es.history=es.history.filter(x=>x!==id);if(es.activeId===id)es.activeId=es.items[0]?.id||null;pruneUnusedEntityTags();saveState();renderEntityTracker()}
function updateActiveEntityField(field,value){const ent=entityById(ensureEntityState().activeId);if(!ent)return;ent[field]=value;saveState();renderEntityDirectoryOnly()}
function addRelationshipToActive(targetId){const es=ensureEntityState();const active=entityById(es.activeId);const target=entityById(targetId);if(!target)return;if(!active){setActiveEntity(targetId,false);return}if(active.id===target.id)return;if(!Array.isArray(active.relationships))active.relationships=[];if(!Array.isArray(target.relationships))target.relationships=[];let existing=active.relationships.find(r=>r.id===target.id);if(!existing)active.relationships.push({id:target.id, description:'Connected to '+entityDisplayName(target)});let back=target.relationships.find(r=>r.id===active.id);if(!back)target.relationships.push({id:active.id, description:'Connected to '+entityDisplayName(active)});saveState();renderEntityTracker()} 
function removeRelationshipFromActive(targetId){const ent=entityById(ensureEntityState().activeId);const target=entityById(targetId);if(!ent)return;ent.relationships=(ent.relationships||[]).filter(r=>r.id!==targetId);if(target)target.relationships=(target.relationships||[]).filter(r=>r.id!==ent.id);saveState();renderEntityTracker()}
function updateRelationshipDescription(targetId,value){const ent=entityById(ensureEntityState().activeId);if(!ent)return;const rel=(ent.relationships||[]).find(r=>r.id===targetId);if(rel){rel.description=value;saveState()}}
function initEntityTracker(){
  ensureEntityState();
  const generic=$('entityAddGeneric'); if(generic) generic.addEventListener('click',()=>{const choice=(prompt('Entity type to add: NPC, Location, Faction, or Asset','NPC')||'').toLowerCase();const type=choice.startsWith('loc')?'location':choice.startsWith('fac')?'faction':choice.startsWith('ass')?'asset':choice.startsWith('npc')?'npc':''; if(type)addEntity(type);});
  const mobile=$('openEntityTrackerPanel');
  if(mobile) mobile.addEventListener('click',()=>{showLeftTab('entity'); const p=$('entityTrackerPanel'); document.querySelectorAll('.side-panel').forEach(x=>x.classList.toggle('is-open',x===p)); const bd=$('panelBackdrop'); if(bd) bd.hidden=false; document.body.classList.add('side-panel-open');});
  renderEntityTracker();
}
function renderEntityTracker(){ensureReciprocalEntityRelationships();renderEntityActiveCard();renderEntityDirectoryOnly()}
function renderEntityActiveCard(){
  const card=$('entityActiveCard'); if(!card)return; const es=ensureEntityState();
  if(!es.activeId && es.items.length) es.activeId=es.items[0].id;
  const ent=entityById(es.activeId);
  if(!ent){card.innerHTML='<div class="entity-empty"><h3>No active entity</h3><p class="small">Use Add entity or the + icon in a directory header to begin. You can also drag an entity from the directory here to make it active.</p></div>';card.ondragover=e=>e.preventDefault();card.ondrop=e=>{e.preventDefault();const id=e.dataTransfer.getData('text/entity-id');if(id)setActiveEntity(id,false)};return;}
  const typeOptions=Object.entries(ENTITY_TYPES).map(([k,v])=>`<option value="${k}" ${ent.type===k?'selected':''}>${v.singular}</option>`).join('');
  normalizeEntityTags(ent);
  const availableTags=tagRowsForType(ent.type).filter(t=>!ent.tags.includes(t.key));
  const tagOptions=availableTags.map(t=>`<option value="${escapeHtml(t.label)}" data-key="${escapeHtml(t.key)}"></option>`).join('');
  const tagChips=ent.tags.map(t=>{const m=tagMeta(ent.type,t);return `<span class="entity-tag-chip">${entityIconMarkup(m.icon,m.label)}<span>${escapeHtml(m.label)}</span><button type="button" class="entity-tag-remove" data-tag="${escapeHtml(t)}" title="Remove tag">×</button></span>`}).join('');
  const history=(es.history||[]).map(id=>entityById(id)).filter(Boolean).slice(0,5).map((h,i)=>`<button type="button" class="entity-history-tab" data-entity-id="${h.id}">${escapeHtml(h.name||ENTITY_TYPES[h.type]?.singular||'Entity')}</button>`).join('');
  const rels=(ent.relationships||[]).map(r=>{const target=entityById(r.id); if(!target)return ''; return `<li class="entity-rel-row"><button type="button" class="entity-rel-link" data-entity-id="${target.id}"><span class="entity-glyph">${entityIconMarkup(entityResolvedIcon(target),target.name)}</span> ${escapeHtml(target.name||'Unnamed')}</button><input class="entity-rel-desc" data-rel-id="${target.id}" value="${escapeHtml(r.description||('Connected to '+entityDisplayName(target)))}" placeholder="Describe this entity&apos;s view of the relationship"><button type="button" class="secondary entity-rel-remove" data-rel-id="${target.id}" title="Remove relationship">×</button></li>`}).join('');
  card.innerHTML=`<div class="entity-nav-row"><button id="entityBack" type="button" class="secondary entity-back" title="Back">←</button><div class="entity-history-tabs">${history}</div></div>
  <div class="entity-main-drop"><div class="entity-identity-grid"><div class="entity-identity-fields"><div class="entity-form-head entity-form-head-compact"><div class="entity-head-fields"><label>Name<input id="entityName" value="${escapeHtml(ent.name||'')}"></label><label>Type<select id="entityType">${typeOptions}</select></label></div><button id="entityRemove" type="button" class="secondary entity-delete">Remove</button></div><label>Hyperlinks<textarea id="entityLinks" rows="2" placeholder="Paste relevant links, one per line.">${escapeHtml(ent.links||'')}</textarea></label><label>Relationship description<input id="entityRelationshipDescription" value="${escapeHtml(ent.relationshipDescription||'')}" placeholder="How this entity tends to connect to scenes or other entities"></label><div class="entity-tag-panel"><div class="entity-tag-row">${tagChips||'<span class="small">No tags yet.</span>'}</div><div class="entity-tag-add"><input id="entityTagInput" list="entityTagOptions" placeholder="Type a new tag or choose one"><datalist id="entityTagOptions">${tagOptions}</datalist><button id="entityAddTag" type="button" class="secondary compact-button">Add tag</button></div></div><section class="entity-relationships compact-rels"><div class="section-header"><h3>Relationship Outline</h3><button id="entityAddRelated" type="button" class="secondary compact-button">Add Existing</button></div><ul class="entity-rel-list">${rels||'<li class="small">No relationships yet. Drag an entity from the directory onto this card or use Add Existing.</li>'}</ul></section></div><label class="entity-photo-picker" title="Click to choose an entity picture"><span>Thumbnail</span><div class="entity-photo-frame">${entityIconMarkup(entityResolvedIcon(ent),ent.name)}</div><input id="entityThumbnailInput" type="file" accept="image/*"></label></div><label>Overview description<textarea id="entityOverview" rows="4" placeholder="Who or what this is, what it wants, and how it appears in play.">${escapeHtml(ent.overview||'')}</textarea></label>
  <label>Revealed details<textarea id="entityRevealed" rows="4" placeholder="Facts the players have discovered or confirmed.">${escapeHtml(ent.revealed||'')}</textarea></label></div>`;
  const bindInput=(id,field)=>{const el=$(id); if(el) el.addEventListener('input',()=>updateActiveEntityField(field,el.value));};
  bindInput('entityName','name'); bindInput('entityLinks','links'); bindInput('entityRelationshipDescription','relationshipDescription'); bindInput('entityOverview','overview'); bindInput('entityRevealed','revealed');
  const type=$('entityType'); if(type) type.addEventListener('change',()=>{ent.type=type.value;ent.tags=[];ent.thumbnail=ent.thumbnailImage?('img:'+ent.thumbnailImage):(ENTITY_TYPES[ent.type]?.icon||'⬢'); pruneUnusedEntityTags(); saveState(); renderEntityTracker()});
  const addTagBtn=$('entityAddTag'); if(addTagBtn) addTagBtn.addEventListener('click',()=>{const inp=$('entityTagInput'); const val=(inp?.value||'').trim(); if(val){const tag=addCustomTagForType(ent.type,val); if(tag){normalizeEntityTags(ent);ent.tags.push(tag.key);ent.tags=[...new Set(ent.tags)];ent.thumbnail=ent.thumbnailImage?('img:'+ent.thumbnailImage):entityPrimaryTagIcon(ent);} saveState();renderEntityTracker();}});
  document.querySelectorAll('.entity-tag-remove').forEach(btn=>btn.addEventListener('click',()=>{normalizeEntityTags(ent);ent.tags=ent.tags.filter(t=>t!==btn.dataset.tag);ent.thumbnail=ent.thumbnailImage?('img:'+ent.thumbnailImage):entityPrimaryTagIcon(ent);pruneUnusedEntityTags();saveState();renderEntityTracker();}));
  const thumbInput=$('entityThumbnailInput'); if(thumbInput) thumbInput.addEventListener('change',()=>{const file=thumbInput.files&&thumbInput.files[0]; if(!file)return; const reader=new FileReader(); reader.onload=()=>{ent.thumbnailImage=reader.result; ent.thumbnail='img:'+reader.result; saveState(); renderEntityTracker();}; reader.readAsDataURL(file);});
  const del=$('entityRemove'); if(del) del.addEventListener('click',()=>removeEntity(ent.id));
  const back=$('entityBack'); if(back) back.addEventListener('click',()=>{const prev=es.history.shift(); if(prev&&entityById(prev)){setActiveEntity(prev,false)}else renderEntityTracker()});
  document.querySelectorAll('.entity-history-tab,.entity-rel-link').forEach(btn=>btn.addEventListener('click',()=>setActiveEntity(btn.dataset.entityId,true)));
  document.querySelectorAll('.entity-rel-desc').forEach(inp=>inp.addEventListener('input',()=>updateRelationshipDescription(inp.dataset.relId,inp.value)));
  document.querySelectorAll('.entity-rel-remove').forEach(btn=>btn.addEventListener('click',()=>removeRelationshipFromActive(btn.dataset.relId)));
  const addExisting=$('entityAddRelated'); if(addExisting) addExisting.addEventListener('click',()=>{const choices=es.items.filter(e=>e.id!==ent.id && !(ent.relationships||[]).some(r=>r.id===e.id)); if(!choices.length){alert('No unlinked entities available.');return} const pickName=prompt('Type the exact name of an existing entity to relate:\n\n'+choices.map(e=>e.name).join('\n')); const found=choices.find(e=>(e.name||'').toLowerCase() === (pickName||'').toLowerCase()); if(found)addRelationshipToActive(found.id);});
  card.ondragover=e=>{e.preventDefault();card.classList.add('drag-over')};
  card.ondragleave=()=>card.classList.remove('drag-over');
  card.ondrop=e=>{e.preventDefault();card.classList.remove('drag-over');const id=e.dataTransfer.getData('text/entity-id');if(id)addRelationshipToActive(id)};
}
function renderEntityDirectoryOnly(){
  const dir=$('entityDirectory'); if(!dir)return; const es=ensureEntityState();
  dir.innerHTML='';
  Object.entries(ENTITY_TYPES).forEach(([type,meta])=>{
    const items=es.items.filter(e=>e.type===type);
    const details=document.createElement('details'); details.open=items.length<4; details.className='entity-dir-group';
    const summary=document.createElement('summary'); summary.className='entity-dir-summary'; const title=document.createElement('span'); title.textContent=meta.label; const add=document.createElement('button'); add.type='button'; add.className='entity-dir-add icon-button secondary'; add.title='Add '+meta.singular; add.setAttribute('aria-label','Add '+meta.singular); add.textContent='＋'; add.addEventListener('click',ev=>{ev.preventDefault();ev.stopPropagation();addEntity(type)}); summary.appendChild(title); summary.appendChild(add); details.appendChild(summary);
    const list=document.createElement('div'); list.className='entity-dir-list';
    items.forEach(ent=>{
      normalizeEntityTags(ent);
      const btn=document.createElement('button'); btn.type='button'; btn.className='entity-dir-item'+(es.activeId===ent.id?' active':''); btn.draggable=true; btn.dataset.entityId=ent.id; btn.innerHTML=`<span class="entity-glyph">${entityIconMarkup(entityResolvedIcon(ent),ent.name)}</span><span>${escapeHtml(ent.name||meta.singular)}</span><small>${escapeHtml(entityTagLabels(ent))}</small>`;
      btn.addEventListener('click',()=>setActiveEntity(ent.id,true));
      btn.addEventListener('dragstart',ev=>{ev.dataTransfer.setData('text/entity-id',ent.id);ev.dataTransfer.effectAllowed='copy'});
      list.appendChild(btn);
    });
    if(!list.children.length){const empty=document.createElement('p'); empty.className='small entity-dir-empty'; empty.textContent='None yet.'; list.appendChild(empty)}
    details.appendChild(list); dir.appendChild(details);
  });
}
const baseShowLeftTab = showLeftTab;
showLeftTab = function(tab,save=true){
  state.activeLeftTab=(tab==='crew'||tab==='living'||tab==='entity')?tab:'scene';
  const scene=$('controlsPanel'), crew=$('crewLinkPanel'), living=$('livingShipPanel'), entity=$('entityTrackerPanel');
  if(scene)scene.classList.toggle('active-left-view',state.activeLeftTab==='scene');
  if(crew)crew.classList.toggle('active-left-view',state.activeLeftTab==='crew');
  if(living)living.classList.toggle('active-left-view',state.activeLeftTab==='living');
  if(entity)entity.classList.toggle('active-left-view',state.activeLeftTab==='entity');
  document.querySelectorAll('[data-left-tab]').forEach(btn=>btn.classList.toggle('active',btn.dataset.leftTab===state.activeLeftTab));
  document.body.classList.toggle('left-crew-expanded',state.activeLeftTab==='crew'||state.activeLeftTab==='living'||state.activeLeftTab==='entity');
  if(document.body.classList.contains('side-panel-open')&&window.matchMedia('(max-width: 900px)').matches){[scene,crew,living,entity].filter(Boolean).forEach(p=>p.classList.toggle('is-open',p.classList.contains('active-left-view')))}
  if(state.activeLeftTab==='entity')renderEntityTracker();
  if(save)saveState();
};

function rollDie(sides){return Math.floor(Math.random()*sides)+1}
function rollStarforgedDiceToast(){
  let stat=2;
  const input=prompt("Starforged action score / stat add:","2");
  if(input===null)return;
  const parsed=Number(input);
  if(Number.isFinite(parsed))stat=parsed;
  const action=rollDie(6);
  const total=action+stat;
  const c1=rollDie(10), c2=rollDie(10);
  const hits=(total>c1?1:0)+(total>c2?1:0);
  const match=c1===c2;
  const outcome=hits===2?"STRONG HIT":hits===1?"WEAK HIT":"MISS";
  const toast=$("sfRollToast");
  const statEl=$("sfToastStat"), formulaEl=$("sfToastActionFormula"), challengeEl=$("sfToastChallengeDice"), outcomeEl=$("sfToastOutcome");
  if(statEl)statEl.textContent="ACTION";
  if(formulaEl)formulaEl.textContent=action+" + "+stat+" = "+total;
  if(challengeEl)challengeEl.textContent=c1+", "+c2+(match?"  • MATCH":"");
  if(outcomeEl){outcomeEl.textContent=outcome;outcomeEl.className="sf-roll-outcome "+(hits===2?"strong-hit":hits===1?"weak-hit":"miss")+(match?" match":"")}
  if(toast){toast.classList.add("show");toast.setAttribute("aria-hidden","false");clearTimeout(rollStarforgedDiceToast._timer);rollStarforgedDiceToast._timer=setTimeout(()=>{toast.classList.remove("show");toast.setAttribute("aria-hidden","true")},9000)}
  setStatus("Starforged roll: "+outcome+(match?" with a match":""));
}

initMobilePanels();
init();
initEntityTracker();

;(() => {
  function initSettingsTabs(){
    const modal=document.getElementById('settingsModal');
    if(!modal) return;
    const buttons=[...modal.querySelectorAll('[data-settings-tab]')];
    const sections=[...modal.querySelectorAll('[data-settings-section]')];
    function show(name){
      buttons.forEach(b=>b.classList.toggle('active', b.dataset.settingsTab===name));
      sections.forEach(s=>{const on=s.dataset.settingsSection===name; s.hidden=!on; s.classList.toggle('active-settings-section',on);});
    }
    buttons.forEach(b=>b.addEventListener('click',()=>show(b.dataset.settingsTab)));
    show('save');
  }
  if(document.readyState==='loading') document.addEventListener('DOMContentLoaded',initSettingsTabs); else initSettingsTabs();
})();

;(() => {
  const DELETE_ICON = './delete-icon.png';
  const EDIT_ICON = './edit-icon.png';
  const COPY_ICON = './copy-icon.png';
  function esc(s){return String(s ?? '').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
  function iconHtml(src, cls, alt='') { return `<img class="${cls}" src="${src}" alt="${alt}">`; }
  function setIconButton(btn, src, cls, label, keepText=false) {
    if(!btn || btn.dataset.customIconApplied === src) return;
    btn.dataset.customIconApplied = src;
    const text = keepText ? (' ' + (btn.textContent || '').trim().replace(/^[✏️🗑×]+\s*/,'')).trimEnd() : '';
    btn.innerHTML = iconHtml(src, cls, label) + (text ? ' ' + esc(text) : '');
  }
  function decorateActionIcons(root=document){
    root.querySelectorAll('button[title="Edit"], button[aria-label="Edit"]').forEach(btn=>setIconButton(btn, EDIT_ICON, 'icon-img-edit', 'Edit'));
    root.querySelectorAll('button[title="Delete"], button[aria-label="Delete"], .entity-rel-remove, .entity-tag-remove').forEach(btn=>setIconButton(btn, DELETE_ICON, 'icon-img-delete', 'Delete'));
    root.querySelectorAll('#entityRemove, button.entity-delete').forEach(btn=>setIconButton(btn, DELETE_ICON, 'icon-img-delete', 'Remove', true));
  }
  function getCurrentDiceParts(){
    const stat = document.querySelector('#sfToastOutcome')?.textContent ? document.querySelector('#sfRollToast .sf-roll-stat')?.textContent : document.querySelector('#sfRollCard .sf-roll-stat')?.textContent;
    const formula = document.getElementById('sfToastActionFormula')?.textContent || document.getElementById('sfActionFormula')?.textContent || '';
    const challenges = document.getElementById('sfToastChallengeDice')?.textContent || document.getElementById('sfChallengeDice')?.textContent || '';
    const outcome = document.getElementById('sfToastOutcome')?.textContent || document.getElementById('sfOutcome')?.textContent || '';
    return { stat: (stat || 'EDGE').trim(), formula: formula.trim(), challenges: challenges.trim(), outcome: outcome.trim() || 'MISS' };
  }
  function diceRollSvgDataUrl(){
    const r = getCurrentDiceParts();
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="460" height="190" viewBox="0 0 460 190">
      <rect x="0" y="0" width="460" height="190" rx="18" fill="#080d1b"/>
      <line x1="320" y1="18" x2="320" y2="172" stroke="#394056" stroke-width="2"/>
      <text x="28" y="52" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="800">${esc(r.stat.toUpperCase())}</text>
      <text x="50" y="105" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="700">${esc(r.formula)}</text>
      <text x="52" y="150" fill="#d8deea" font-family="Arial, Helvetica, sans-serif" font-size="32" font-weight="700">${esc(r.challenges)}</text>
      <text x="365" y="115" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="38" font-weight="900" text-anchor="middle">${esc(r.outcome.toUpperCase())}</text>
      <path d="M28 86 L46 76 L64 86 L46 96 Z" fill="none" stroke="#ffffff" stroke-width="3"/>
      <path d="M28 132 L46 112 L64 132 L46 162 Z" fill="none" stroke="#ffffff" stroke-width="3"/>
    </svg>`;
    return 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
  }
  async function insertDiceRollImageToJournal(){
    const editor = document.getElementById('journalCommentEditor');
    if(!editor) return;
    const src = diceRollSvgDataUrl();
    const html = `<p><img src="${src}" alt="Starforged dice roll result" style="max-width:100%;border-radius:14px;"></p>`;
    if(editor.innerHTML.trim() && editor.innerHTML.trim() !== '<br>') editor.insertAdjacentHTML('beforeend', html);
    else editor.innerHTML = html;
    if(typeof showCenterTab === 'function') showCenterTab('journal');
    editor.focus();
    try {
      if(navigator.clipboard && window.ClipboardItem){
        const blob = await (await fetch(src)).blob();
        await navigator.clipboard.write([new ClipboardItem({[blob.type]: blob})]);
      }
    } catch(e) { /* Clipboard image copy is optional; insertion above is the main behavior. */ }
    if(typeof setStatus === 'function') setStatus('Dice result image added to Journal comment');
  }
  function bindDiceImageButtons(){
    const toastBtn = document.getElementById('sfToastImageToJournal');
    if(toastBtn && !toastBtn.dataset.bound){toastBtn.dataset.bound='1';toastBtn.addEventListener('click',insertDiceRollImageToJournal);}
    const footer = document.querySelector('.sf-roll-footer');
    if(footer && !document.getElementById('sfRollImageToJournal')){
      const btn=document.createElement('button');
      btn.id='sfRollImageToJournal';
      btn.type='button';
      btn.className='secondary compact-button';
      btn.title='Add dice card image to Journal comment';
      btn.textContent='🖼 Add image';
      btn.addEventListener('click',insertDiceRollImageToJournal);
      footer.appendChild(btn);
    }
  }
  function initIconAndDicePatch(){
    decorateActionIcons();
    bindDiceImageButtons();
    const mo = new MutationObserver(muts=>{
      for(const m of muts){
        m.addedNodes.forEach(n=>{ if(n.nodeType===1) decorateActionIcons(n); });
      }
    });
    mo.observe(document.body,{childList:true,subtree:true});
  }
  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initIconAndDicePatch); else initIconAndDicePatch();
})();
