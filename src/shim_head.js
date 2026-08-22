const store={};
/* ⚠ Enough DOM to see a slot as an ELEMENT, not just a string. The figures-invisible bug
   (2026-08-20) lived entirely in element churn — the markup was identical every frame, so a
   shim that only compares innerHTML strings can never catch it. children/outerHTML let the
   test assert that an unchanged slot keeps the SAME object across frames. */
const SLOT_RE=/<span class="slot[\s\S]*?<\/span>/g;
function mkKid(html,parent,idx){
  const k=(html.match(/data-k="([^"]*)"/)||[])[1];
  return {_html:html,dataset:{k},
    get outerHTML(){return this._html},
    set outerHTML(v){ parent._kids[idx]=mkKid(String(v),parent,idx); parent._sync() }};
}
const mk=id=>({id,_h:"",_t:"",value:"",hidden:false,style:{},dataset:{},_kids:[],
  _parse(){this._kids=(this._h.match(SLOT_RE)||[]).map((s,i)=>mkKid(s,this,i))},
  _sync(){this._h=this._kids.map(k=>k._html).join("")},
  get children(){return this._kids}, get childElementCount(){return this._kids.length},
  set innerHTML(v){this._h=String(v); this._parse()}, get innerHTML(){return this._h},
  set textContent(v){this._t=String(v)}, get textContent(){return this._t},
  set className(v){this._c=v}, get className(){return this._c},
  querySelectorAll:()=>[], insertAdjacentHTML(){}, focus(){}});
const REAL_IDS = new Set(['add', 'apiSave', 'apiUrl', 'arrBars', 'arrHours', 'arrNote', 'asx', 'asxBoth', 'asxOut', 'bedBlake', 'bedExtraCtl', 'bedList', 'bedNone', 'bedPanel', 'bedSum', 'bedx', 'bedxOut', 'cycOut', 'spaceTot', 'barNote', 'bars', 'boardBody', 'boardNote', 'boardSetup', 'ccAll', 'ccList', 'ccLow', 'ccNone', 'ccSum', 'ccHint', 'clearBoard', 'cyc', 'hero', 'hours', 'levels', 'load', 'modes', 'playBtn', 'presets', 'reroll', 'setupRow', 'share', 'sharedTag', 'spaceCtl', 'speedCtl', 'speedSel', 'stageA', 'stageAH', 'stageB', 'stageBH', 'stageBar', 'stageClock', 'stageFoot', 'stageGone', 'stageHint', 'stageSent', 'stageWait', 'stageWaitN', 'unlock', 'who', 'winCtl', 'wlen', 'wlenOut', 'wstart', 'wstartOut']);
global.document={getElementById:id=>{ if(!REAL_IDS.has(id)) return null;
  return store[id]||(store[id]=mk(id)) }};
global.location={origin:"https://ted72782.github.io",pathname:"/ft-lab/",
  hash:"",protocol:"https:",search:"?board=https%3A%2F%2Fscript.google.com%2Fx%2Fexec",
  href:"https://ted72782.github.io/ft-lab/?board=https%3A%2F%2Fscript.google.com%2Fx%2Fexec"};
global.history={replaceState(a,b,u){const s=String(u).split("?")[1];location.search=s?"?"+s.split("#")[0]:"";}};
const LS={}; global.localStorage={getItem:k=>LS[k]??null,setItem:(k,v)=>{LS[k]=v},removeItem:k=>{delete LS[k]}};
global.navigator={}; global.confirm=()=>true; global.alert=()=>{};
let SERVER=[];
global.fetch=(url,opt)=>{
  if(!String(url).startsWith("https://script.google.com")) return Promise.reject(new Error("unreachable"));
  if(opt&&opt.method==="POST"){
    if(opt.headers["Content-Type"]!=="text/plain;charset=utf-8") return Promise.reject(new Error("PREFLIGHT would fire"));
    const e=JSON.parse(opt.body);
    SERVER=SERVER.filter(x=>!(x.who===e.who&&JSON.stringify(x.cfg)===JSON.stringify(e.cfg))); SERVER.push(e);
  }
  return Promise.resolve({ok:true,json:()=>Promise.resolve(SERVER)});
};

global.requestAnimationFrame=fn=>0;
global.cancelAnimationFrame=()=>{};
