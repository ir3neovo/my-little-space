/* MY LITTLE SPACE — Recipe box, frontend-only demo.
   Replace localStorage operations with Supabase queries later.
   Sample recipes are illustrative, not user-submitted recipes.
*/
(() => {
  'use strict';
  const KEY = 'my-little-space:recipe-drafts:v1';
  // One featured sample recipe. Additional user recipes are stored in this browser.
  const demoRecipes = [
    {
      id: 'demo-4',
      title: 'Strawberry Matcha Latte',
      category: 'Drinks',
      time: null, // Preparation time not provided.
      image: 'assets/strawberrymatcha.png',
      emoji: '🍓',
      color: '#e5e8dc',
      description: 'A sweet strawberry-and-matcha treat with beautiful pink and green layers.',
      ingredients: [
        'Strawberry jam — 20 g',
        'Matcha powder — 3 g',
        'Warm water — 30 ml',
        'Milk — 150 ml',
        'Some ice'
      ],
      steps: [
        'Spoon the strawberry jam into the bottom of a glass.',
        'Whisk the matcha powder with the warm water until smooth.',
        'Add some ice to the glass, then pour in the milk.',
        'Slowly pour the prepared matcha over the milk and enjoy.'
      ],
      createdAt: '2026-11-02',
      source: 'demo'
    }
  ];
  const $ = (sel) => document.querySelector(sel);
  const escapeHTML = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const lines = (s) => String(s ?? '').split('\n').map(x => x.trim()).filter(Boolean);
  const niceDate = (date) => { const d = new Date(`${String(date).slice(0,10)}T12:00:00`); return isNaN(d) ? '' : d.toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'}); };
  function loadDrafts() { try { const x = JSON.parse(localStorage.getItem(KEY) || '[]'); return Array.isArray(x) ? x.filter(v => v && typeof v.title === 'string') : []; } catch { return []; } }
  let drafts = loadDrafts();
  let category = 'All';
  let search = '';
  let editingId = null;
  const dialog = $('#recipe-dialog');
  const formDialog = $('#recipe-form-dialog');
  const form = $('#recipe-form');
  const colors = {Breakfast:'#f5d9df',Savoury:'#f6dfd7',Sweets:'#f4dce9',Drinks:'#e3ebe0'};
  const emoji = {Breakfast:'🥞',Savoury:'🍲',Sweets:'🍰',Drinks:'🍵'};
  const all = () => [...drafts, ...demoRecipes];
  const persist = () => { try { localStorage.setItem(KEY, JSON.stringify(drafts)); return true; } catch { alert('This browser blocked local storage. Your recipe could not be saved.'); return false; } };
  function render() {
    const items = all().filter(r => (category === 'All' || r.category === category) && [r.title,r.description,r.category].join(' ').toLowerCase().includes(search));
    $('#recipe-grid').innerHTML = items.map(r => `<article class="panel-card recipe-card">
      <div class="recipe-picture" style="--recipe-bg:${escapeHTML(r.color || colors[r.category] || '#f6dce5')}">
        ${r.image
          ? `<img class="recipe-photo" src="${escapeHTML(r.image)}" alt="${escapeHTML(r.title)}" loading="lazy" decoding="async">`
          : `<span class="recipe-emoji" aria-hidden="true">${escapeHTML(r.emoji || emoji[r.category] || '🍓')}</span>`}
        <span class="recipe-category-label">${escapeHTML(r.category)}</span>
      </div>
      <div class="recipe-body"><span class="card-meta">${r.source === 'local' ? '♡ MY LOCAL RECIPE' : '♡ SAMPLE RECIPE'}</span>
      <h3 class="card-title">${escapeHTML(r.title)}</h3><p class="card-desc">${escapeHTML(r.description || 'A lovely little recipe for a cozy moment.')}</p>
      <div class="card-bottom"><span class="recipe-stats">${r.time ? `◷ ${Number(r.time)} min` : '♡ Made with love'}</span><button type="button" class="subtle-link" data-open-recipe="${escapeHTML(r.id)}">View recipe ↗</button></div></div></article>`).join('');
    $('#recipe-empty').hidden = items.length !== 0;
  }
  function openDetail(id) {
    const r = all().find(x => x.id === id); if (!r) return;
    $('#recipe-detail-title').textContent = r.title;
    const ingredients = Array.isArray(r.ingredients) ? r.ingredients : [];
    const steps = Array.isArray(r.steps) ? r.steps : [];
    $('#recipe-detail-content').innerHTML = `<span class="dialog-stamp">${escapeHTML(r.category)}${r.time ? ` · ${Number(r.time)} minutes` : ''} · ${r.source==='local'?'saved in this browser':'sample recipe'}</span>
      ${r.image ? `<img class="recipe-detail-photo" src="${escapeHTML(r.image)}" alt="${escapeHTML(r.title)}">` : ''}
      <p>${escapeHTML(r.description)}</p><h3>What you'll need</h3><ul>${ingredients.map(t => `<li>${escapeHTML(t)}</li>`).join('')}</ul>
      <h3>How to make it</h3><ol>${steps.map(t => `<li>${escapeHTML(t)}</li>`).join('')}</ol>
      ${r.source === 'local' ? `<div class="dialog-actions"><button type="button" class="delete-action" data-delete-recipe="${escapeHTML(r.id)}">Delete this draft</button><button type="button" class="outline-btn" data-edit-recipe="${escapeHTML(r.id)}">Edit recipe</button></div>` : ''}`;
    dialog.showModal();
  }
  function openForm(id = null) {
    form.reset(); editingId = id;
    const r = drafts.find(x => x.id === id);
    $('#recipe-form-title').textContent = r ? 'Edit this recipe ♡' : 'Add to my recipe box ♡';
    if(r) {
      for(const name of ['title','category','time','description']) form.elements[name].value = r[name] ?? '';
      form.elements.ingredients.value = r.ingredients.join('\n');
      form.elements.steps.value = r.steps.join('\n');
    }
    formDialog.showModal();
  }
  $('#new-recipe-btn').addEventListener('click', () => openForm());
  $('#recipe-grid').addEventListener('click', e => { const button = e.target.closest('[data-open-recipe]'); if(button) openDetail(button.dataset.openRecipe); });
  $('#recipe-filters').addEventListener('click', e => { const button = e.target.closest('[data-category]'); if(!button) return; category=button.dataset.category; document.querySelectorAll('#recipe-filters .filter-chip').forEach(b => { const active = b === button; b.classList.toggle('is-active',active); b.setAttribute('aria-pressed',String(active)); }); render(); });
  $('#recipe-search').addEventListener('input', e => { search = e.target.value.trim().toLowerCase(); render(); });
  form.addEventListener('submit', e => {
    e.preventDefault(); const d = new FormData(form);
    const entry = {id:editingId || `local-${Date.now()}`,title:String(d.get('title')).trim(),category:String(d.get('category')),time:Math.min(600, Math.max(1, Number(d.get('time'))||20)),description:String(d.get('description')).trim(),ingredients:lines(d.get('ingredients')),steps:lines(d.get('steps')),createdAt:new Date().toISOString().slice(0,10),source:'local',emoji:emoji[String(d.get('category'))],color:colors[String(d.get('category'))]};
    if(!entry.title || !entry.ingredients.length || !entry.steps.length) return;
    if(editingId) drafts = drafts.map(r => r.id===editingId?entry:r); else drafts.unshift(entry);
    if(!persist()) return;
    category='All';search='';$('#recipe-search').value='';document.querySelectorAll('#recipe-filters .filter-chip').forEach(b => {const active=b.dataset.category==='All'; b.classList.toggle('is-active',active); b.setAttribute('aria-pressed',String(active));});
    formDialog.close();render();
  });
  $('#recipe-detail-content').addEventListener('click', e => {
    const del=e.target.closest('[data-delete-recipe]'); const edit=e.target.closest('[data-edit-recipe]');
    if(del && confirm('Delete this locally saved recipe?')) {drafts=drafts.filter(x => x.id!==del.dataset.deleteRecipe); if(persist()){dialog.close();render();}}
    if(edit) { const id=edit.dataset.editRecipe; dialog.close();openForm(id); }
  });
  document.querySelectorAll('[data-close-dialog]').forEach(b => b.addEventListener('click', () => document.getElementById(b.dataset.closeDialog).close()));
  [dialog,formDialog].forEach(d => d.addEventListener('click', e => { if(e.target===d)d.close(); }));
  render();
})();
