const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const html = fs.readFileSync('karuscan/index.html', 'utf8');
const script = html.match(/<script>([\s\S]*?)<\/script>/)[1];
function app() {
  const elements = new Map();
  const document = {getElementById(id) {
    if (!elements.has(id)) elements.set(id,{value:'',textContent:'',hidden:true});
    return elements.get(id);
  }};
  const ctx = vm.createContext({console, document, localStorage:{setItem(){},getItem(){return null}}});
  const core = script.slice(script.indexOf('const APPSTORE_NOTE'), script.indexOf('/* ---------- Rendering'));
  vm.runInContext(core+`;function toast(kind,msg){document.getElementById('toast').textContent=msg} function render(){} function syncSettings(){};
    globalThis.api={parseCSV, rowsToTxns,textToTxns,analyse,validateState,identify,cadenceOf,disputeLetter,importText,commitImport,
      set(s){S=s},get(){return S},settings(x){Object.assign(S.settings,x)}}`,ctx);
  const api=ctx.api;
  api.set({txns:[],meta:{},settings:{cur:'K',order:'dmy',sign:'negative'},example:false});
  return {api,document};
}
const txn=(date,desc,amount)=>({date,desc,amount});
const setTxns=(a,txns,meta={})=>a.set({txns,meta,settings:{cur:'K',order:'dmy',sign:'negative'},example:false});
test('large pasted amounts retain all digits, grouped amounts and credits',()=>{
  const {api:a}=app();
  for (const str of ['1234.56','1,234.56','123456.78']) {
    const rows=a.textToTxns(`01/09/2026 OPENAI  ${str}  9000.00`);
    assert.equal(rows[0].amount,Number(str.replaceAll(',','')));assert.equal(rows[0].desc,'OPENAI');
  }
  assert.equal(a.textToTxns('01/09/2026 OPENAI 20.00 CR 900.00').length,0);
});
test('CSV uses explicit DR/CR and selected signed debit convention',()=>{
  const {api:a}=app();
  const csv='Date,Description,Amount\n01/09/2026,OPENAI,20\n02/09/2026,NETFLIX,-45';
  assert.equal(a.rowsToTxns(a.parseCSV(csv))[0].desc,'NETFLIX');
  a.settings({sign:'positive'}); assert.equal(a.rowsToTxns(a.parseCSV(csv))[0].desc,'OPENAI');
  const typed='Date,Description,Amount,Type\n01/09/2026,OPENAI,20,DR\n02/09/2026,NETFLIX,-45,CR';
  assert.equal(a.rowsToTxns(a.parseCSV(typed)).length,1);
});
test('unknown billing is not monthly; users can confirm annual billing',()=>{
  const {api:a}=app(); const t=txn('2026-09-01','GRAMMARLY',590);setTxns(a,[t]);
  let s=a.analyse()[0]; assert.equal(s.billingKnown,false); assert.equal(s.monthly,0);
  setTxns(a,[t],{[s.key]:{billing:'yearly'}});assert.equal(a.analyse()[0].monthly,590/12);
});
test('reseller apps and prices do not inherit another cancellation',()=>{
  const {api:a}=app();const t=[txn('2026-09-01','PADDLE.NET* APPONE',20),txn('2026-09-02','PADDLE.NET* APPTWO',100),txn('2026-09-03','PADDLE.NET* APPONE',25)];
  setTxns(a,t);let subs=a.analyse();assert.equal(subs.length,3);
  setTxns(a,t,{[subs[0].key]:{status:'cancelled',cancelledOn:'2026-08-01'}});
  assert.equal(a.analyse().filter(s=>s.rec==='after').length,1);
});
test('different known vendor descriptors remain separate',()=>{
  const {api:a}=app();setTxns(a,[txn('2026-09-01','OPENAI API',100),txn('2026-09-02','OPENAI CHATGPT',20)]);assert.equal(a.analyse().length,2);
});
test('irregular or same-day spending is not assigned a cadence',()=>{
  const {api:a}=app();assert.equal(a.cadenceOf(['2026-01-01','2026-01-02','2026-03-02']),null);
  assert.equal(a.cadenceOf(['2026-01-01','2026-01-01','2026-02-01']),null);
  assert.equal(a.cadenceOf(['2026-01-31','2026-02-28','2026-03-31']),'monthly');
});
test('old history is stale relative to the latest imported payment',()=>{
  const {api:a}=app();setTxns(a,[txn('2026-01-01','OPENAI',20),txn('2026-02-01','OPENAI',20),txn('2026-09-01','SHOP',5)]);assert.equal(a.analyse()[0].stale,true);
});
test('dispute draft contains only selected payments and neutral language',()=>{
  const {api:a}=app();setTxns(a,[txn('2026-09-01','OPENAI',20),txn('2026-10-01','OPENAI',20)]);
  const s=a.analyse()[0];assert.equal(a.disputeLetter(s),'');
  const letter=a.disputeLetter(s,[s.charges[1]]);assert.match(letter,/Total disputed: K 20.00/);assert.doesNotMatch(letter,/1 Sept|knowingly authorise/);
});
test('preview is reversible and duplicate multiplicity is retained across imports',()=>{
  const {api:a,document:d}=app();d.getElementById('importCur').value='K';d.getElementById('importOrder').value='dmy';d.getElementById('debitSign').value='negative';
  const csv='Date,Description,Debit\n01/09/2026,OPENAI,20\n01/09/2026,OPENAI,20';
  a.importText(csv,'test.csv');assert.equal(a.get().txns.length,0);a.commitImport();assert.equal(a.get().txns.length,2);
  a.importText(csv,'test.csv');a.commitImport();assert.equal(a.get().txns.length,2);
});
test('malformed backup rejects before state changes',()=>{
  const {api:a}=app();const original=a.get();
  for (const bad of [{txns:[{}]}, {...original,meta:null},{...original,txns:[txn('2026-02-31','OPENAI',20)]},{...original,txns:[txn('2026-02-01','OPENAI',-20)]}]) assert.throws(()=>a.validateState(bad));
  assert.equal(a.get(),original);
});
