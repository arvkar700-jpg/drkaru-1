const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const {JSDOM,VirtualConsole}=require('jsdom');
const html=fs.readFileSync('karuscan/index.html','utf8');
function boot(options={}) {
  const errors=[];
  const virtualConsole=new VirtualConsole();virtualConsole.on('jsdomError',e=>errors.push(e.message));
  const dom=new JSDOM(html,{url:'https://karuscan.test/',runScripts:'dangerously',virtualConsole,beforeParse(w){
    w.confirm=()=>false;
    Object.defineProperty(w.navigator,'clipboard',{value:{writeText:async()=>{throw Error('Clipboard blocked')}}});
    if(options.saved) w.localStorage.setItem('karuscan.v1',JSON.stringify(options.saved));
    if(options.storageFails) w.Storage.prototype.setItem=()=>{throw Error('Quota exceeded')};
  }});
  const w=dom.window,d=w.document;
  const $=id=>d.getElementById(id);
  const change=(el,value)=>{el.value=value;el.dispatchEvent(new w.Event('change',{bubbles:true}))};
  const state=()=>JSON.parse(w.localStorage.getItem('karuscan.v1'));
  const preview=text=>{$('pasteBox').value=text;$('scanPaste').click()};
  return {w,d,$,change,state,preview,errors,close:()=>w.close()};
}
const csv='Date,Description,Debit,Credit\n01/09/2026,OPENAI,20,\n01/10/2026,OPENAI,20,\n02/10/2026,SALARY,,500';
test('full import, usage, selected investigation letter, blocked clipboard and erasure',async()=>{
  const a=boot();try{
    const {$,d}=a;
    assert.equal(d.querySelectorAll('.sub').length,0);
    a.preview(csv);assert.equal($('preview').hidden,false);assert.equal(d.querySelectorAll('.sub').length,0);
    $('confirmImport').click();assert.equal(a.state().txns.length,2);assert.equal($('pasteBox').value,'');
    a.change(d.querySelector('[data-act="usage"]'),'week');
    assert.equal(d.activeElement.dataset.act,'usage');
    d.querySelector('[data-act="toggle"]').click();assert.equal(d.querySelector('[data-act="dispute"]'),null);
    a.change(d.querySelector('[data-act="usage"]'),'unknown');
    d.querySelector('[data-act="dispute"]').click();assert.match($('toast').textContent,/Select the payments/);
    d.querySelector('input[data-charge="1"]').click();d.querySelector('[data-act="dispute"]').click();
    await new Promise(r=>setImmediate(r));
    assert.match(d.querySelector('.copybox').value,/Total disputed: K 20.00/);
    assert.doesNotMatch(d.querySelector('.copybox').value,/knowingly authorise|1 Sept/);
    assert.match(d.querySelector('p.note[id^="m-"]').textContent,/phone/);
    $('pasteBox').value='secret';$('ioBox').value='secret backup';
    $('eraseAll').click();$('eraseAll').click();assert.equal(a.state().txns.length,0);
    for(const id of ['pasteBox','ioBox','previewRows']) assert.equal($(id).value || $(id).textContent,'');
    assert.deepEqual(a.errors,[]);
  }finally{a.close()}
});
test('demo replacement confirmation preserves real statements on decline',()=>{
  const a=boot();try{a.preview(csv);a.$('confirmImport').click();const before=a.w.localStorage.getItem('karuscan.v1');a.$('loadExample').click();assert.equal(a.w.localStorage.getItem('karuscan.v1'),before);assert.deepEqual(a.errors,[])}finally{a.close()}
});
test('invalid restore is atomic and unknown billing can be confirmed or excluded',()=>{
  const a=boot();try{
    a.preview('01/09/2026 GRAMMARLY 590.00 1000.00');a.$('confirmImport').click();
    const row=()=>a.d.querySelector('.sub');row().querySelector('[data-act="toggle"]').click();
    assert.match(a.$('insights').textContent,/unknown billing periods/);
    a.change(row().querySelector('[data-act="billing"]'),'yearly');assert.match(a.$('summary').textContent,/49.17/);
    row().querySelector('[data-act="exclude"]').click();assert.match(a.$('summary').textContent,/K 0.00/);
    const before=a.w.localStorage.getItem('karuscan.v1');
    a.$('restoreBackup').click();a.$('ioBox').value=JSON.stringify({txns:[{}]});a.$('restoreBackup').click();
    assert.equal(a.w.localStorage.getItem('karuscan.v1'),before);assert.deepEqual(a.errors,[]);
  }finally{a.close()}
});
test('save failure is visible rather than reported as success',()=>{
  const a=boot({storageFails:true});try{a.preview(csv);a.$('confirmImport').click();assert.match(a.$('toast').textContent,/storage failed/);assert.match(a.$('insights').textContent,/storage is unavailable/);assert.deepEqual(a.errors,[])}finally{a.close()}
});
test('credit-only CSV does not fall back to interpreting rows as debits',()=>{
  const a=boot();try{a.preview('Date,Description,Amount,Type\n01/09/2026,OPENAI,20,CR');assert.equal(a.$('preview').hidden,true);assert.equal(a.d.querySelectorAll('.sub').length,0)}finally{a.close()}
});
test('legacy unambiguous decisions migrate; reseller decisions require reconfirmation',()=>{
  const a=boot({saved:{txns:[{date:'2026-09-01',desc:'OPENAI',amount:20},{date:'2026-09-02',desc:'PADDLE.NET* APP',amount:20}],meta:{'c:chatgpt':{usage:'week'},'c:paddle':{status:'cancelled',cancelledOn:'2026-08-01'}},settings:{cur:'K',order:'dmy'},example:false}});
  try{assert.equal(a.d.querySelector('[data-key="c:chatgpt:OPENAI"] [data-act="usage"]').value,'week');assert.match(a.$('insights').textContent,/older version/);assert.equal(a.d.querySelectorAll('.is-cancelled').length,0);assert.deepEqual(a.errors,[])}finally{a.close()}
});
