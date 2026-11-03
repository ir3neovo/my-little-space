/* MY LITTLE SPACE — Notes / reflections frontend prototype.
   Entries added here remain on this device in localStorage, not publicly shared.
*/
(() => {
  'use strict';
  const KEY = 'my-little-space:note-drafts:v1';
  const demo = [
    {id:'demo-note-1',title:'A gentle reminder',category:'Reflection',mood:'☁️ Thoughtful',content:'I’m learning that rest isn’t something I need to earn. Some days, showing up is already enough.\n\nMaybe the smallest victories deserve the most celebration.',createdAt:'2026-10-29',source:'demo'},
    {id:'demo-note-2',title:'On the little things',category:'Quote',mood:'✨ Hopeful',content:'“There is magic in making ordinary days feel a little special.”\n\nAn original little reminder to notice the good stuff.',createdAt:'2026-10-26',source:'demo'},
    {id:'demo-note-3',title:'Things that made me smile',category:'Gratitude',mood:'🍓 Happy',content:'Warm sunlight on my desk. A message from an old friend. Finding the perfect snack after a long afternoon.\n\nA small list, but a happy one.',createdAt:'2026-10-24',source:'demo'},
    {id:'demo-note-4',title:'Dear future me...',category:'Reflection',mood:'🌷 Peaceful',content:'I hope you remember that you were doing your best with what you knew at the time.\n\nLife was loud, but you kept making room for beautiful things.',createdAt:'2026-10-20',source:'demo'},
    {id:'demo-note-5',title:'Slow mornings',category:'Gratitude',mood:'🌷 Peaceful',content:'A quiet cup of tea, a window cracked open, a few pages of a good book.\n\nA little space between the busy moments is a gift.',createdAt:'2026-10-17',source:'demo'},
    {id:'demo-note-6',title:'One day at a time',category:'Quote',mood:'✨ Hopeful',content:'“You are allowed to grow at your own pace.”\n\nA small original note for the days when comparison gets too loud.',createdAt:'2026-10-13',source:'demo'},
  ];
  const $=sel=>document.querySelector(sel);
  const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const date=s=>{const d=new Date(String(s).slice(0,10)+'T12:00:00');return isNaN(d)?'':d.toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'});};
  function load(){ try {const v=JSON.parse(localStorage.getItem(KEY)||'[]');return Array.isArray(v)?v.filter(x=>x&&typeof x.title==='string'):[];}catch{return [];} }
  let drafts=load(),category='All',search='',editing=null;
  const all=()=>[...drafts,...demo];
  const store=()=>{try{localStorage.setItem(KEY,JSON.stringify(drafts));return true;}catch{alert('This browser could not save your note. Please check local storage settings.');return false;}};
  const bg={Reflection:'#fffafc',Quote:'#fff4f8',Gratitude:'#fff9f3'};
  function render(){
    const entries=all().filter(n=>(category==='All'||n.category===category)&&[n.title,n.content,n.mood].join(' ').toLowerCase().includes(search));
    $('#note-grid').innerHTML=entries.map(n=>`<article class="panel-card note-card" style="--note-bg:${bg[n.category]||'#fffafc'}"><span class="card-meta">${esc(n.mood||'☁️ Thoughtful')} · ${esc(n.category)}</span><h3 class="card-title">${esc(n.title)}</h3><p class="card-desc">${esc(n.content.replace(/\n/g,' ').slice(0,165))}${n.content.length>165?'…':''}</p><div class="card-bottom"><span class="note-date">${n.source==='local'?'♡ LOCAL DRAFT':'✿ SAMPLE ENTRY'} · ${esc(date(n.createdAt))}</span><button type="button" class="subtle-link" data-open-note="${esc(n.id)}">Read note ↗</button></div></article>`).join('');
    $('#note-empty').hidden=entries.length!==0;
  }
  const dialog=$('#note-dialog'),formDialog=$('#note-form-dialog'),form=$('#note-form');
  function showNote(id){const n=all().find(x=>x.id===id);if(!n)return;
    $('#note-detail-title').textContent=n.title;
    $('#note-detail-content').innerHTML=`<span class="dialog-stamp">${esc(n.category)} · ${esc(n.mood)} · ${esc(date(n.createdAt))} ${n.source==='local'?'· Local draft':'· Sample entry'}</span><div style="white-space:pre-wrap;font:400 18px/1.8 var(--display);color:#7b4a62">${esc(n.content)}</div>${n.source==='local'?`<div class="dialog-actions" style="margin-top:20px"><button type="button" class="delete-action" data-delete-note="${esc(n.id)}">Delete this draft</button><button type="button" class="outline-btn" data-edit-note="${esc(n.id)}">Edit note</button></div>`:''}`;
    dialog.showModal();
  }
  function openForm(id=null){editing=id;form.reset();const n=drafts.find(x=>x.id===id);$('#note-form-title').textContent=n?'Edit my little thought ♡':'Dear little diary... ♡';if(n){ for(const f of ['title','category','mood','content'])form.elements[f].value=n[f];} formDialog.showModal();}
  $('#new-note-btn').addEventListener('click',()=>openForm());
  $('#note-grid').addEventListener('click',e=>{const b=e.target.closest('[data-open-note]');if(b)showNote(b.dataset.openNote);});
  $('#note-filters').addEventListener('click',e=>{const b=e.target.closest('[data-category]');if(!b)return;category=b.dataset.category;document.querySelectorAll('#note-filters .filter-chip').forEach(x=>{const on=x===b;x.classList.toggle('is-active',on);x.setAttribute('aria-pressed',String(on));});render();});
  $('#note-search').addEventListener('input',e=>{search=e.target.value.toLowerCase().trim();render();});
  form.addEventListener('submit',e=>{e.preventDefault();const d=new FormData(form),n={id:editing||`local-${Date.now()}`,title:String(d.get('title')).trim(),category:String(d.get('category')),mood:String(d.get('mood')),content:String(d.get('content')).trim(),createdAt:new Date().toISOString().slice(0,10),source:'local'};if(!n.title||!n.content)return;
    if(editing)drafts=drafts.map(x=>x.id===editing?n:x);else drafts.unshift(n);if(!store())return;
    category='All';search='';$('#note-search').value='';document.querySelectorAll('#note-filters .filter-chip').forEach(b=>{const on=b.dataset.category==='All';b.classList.toggle('is-active',on);b.setAttribute('aria-pressed',String(on));});formDialog.close();render();
  });
  $('#note-detail-content').addEventListener('click',e=>{const del=e.target.closest('[data-delete-note]'),edit=e.target.closest('[data-edit-note]');if(del&&confirm('Delete this locally saved note?')){drafts=drafts.filter(n=>n.id!==del.dataset.deleteNote);if(store()){dialog.close();render();}}if(edit){const id=edit.dataset.editNote;dialog.close();openForm(id);}});
  document.querySelectorAll('[data-close-dialog]').forEach(b=>b.addEventListener('click',()=>document.getElementById(b.dataset.closeDialog).close()));
  [dialog,formDialog].forEach(d=>d.addEventListener('click',e=>{if(e.target===d)d.close();}));
  render();
})();
