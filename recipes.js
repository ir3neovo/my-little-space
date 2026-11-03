(() => {
  'use strict';

  const KEY = 'my-little-space:recipe-drafts:v1';
  const SUPABASE_URL = 'https://wkxtaladteeyiwniyguv.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_a17phmd41BZGfemra65VPQ_Iic-YEJ7';

  const $ = (selector) => document.querySelector(selector);
  const escapeHTML = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const lines = (value) => String(value ?? '').split('\n').map((line) => line.trim()).filter(Boolean);

  const colors = {
    Breakfast: '#f5d9df', Savoury: '#f6dfd7', Sweets: '#f4dce9', Drinks: '#e3ebe0'
  };
  const emoji = { Breakfast: '🥞', Savoury: '🍲', Sweets: '🍰', Drinks: '🍵' };

  function loadDrafts() {
    try {
      const saved = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(saved)
        ? saved.filter((recipe) => recipe && typeof recipe.title === 'string')
        : [];
    } catch {
      return [];
    }
  }

  let drafts = loadDrafts();
  let databaseRecipes = [];
  let category = 'All';
  let search = '';
  let editingId = null;

  const dialog = $('#recipe-dialog');
  const formDialog = $('#recipe-form-dialog');
  const form = $('#recipe-form');
  const grid = $('#recipe-grid');
  const emptyMessage = $('#recipe-empty');
  const all = () => [...drafts, ...databaseRecipes];


  const configured =
    !SUPABASE_URL.includes('wkxtaladteeyiwniyguv') &&
    !SUPABASE_PUBLISHABLE_KEY.includes('sb_publishable_a17phmd41BZGfemra65VPQ_Iic-YEJ7');

  const db = configured && window.supabase?.createClient
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

  function setStatus(message) {
    let status = $('#recipe-status');
    if (!status) {
      status = document.createElement('p');
      status.id = 'recipe-status';
      status.setAttribute('role', 'status');
      status.style.cssText = 'text-align:center;margin:12px 0;color:#8d7180;';
      grid.before(status);
    }
    status.textContent = message;
    status.hidden = !message;
  }

  function persist() {
    try {
      localStorage.setItem(KEY, JSON.stringify(drafts));
      return true;
    } catch {
      alert('This browser blocked local storage. Your recipe could not be saved.');
      return false;
    }
  }

  function render() {
    const items = all().filter((recipe) =>
      (category === 'All' || recipe.category === category) &&
      [recipe.title, recipe.description, recipe.category]
        .join(' ').toLowerCase().includes(search)
    );

    grid.innerHTML = items.map((recipe) => `
      <article class="panel-card recipe-card">
        <div class="recipe-picture" style="--recipe-bg:${escapeHTML(recipe.color || colors[recipe.category] || '#f6dce5')}">
          ${recipe.image
            ? `<img class="recipe-photo" src="${escapeHTML(recipe.image)}" alt="${escapeHTML(recipe.title)}" loading="lazy" decoding="async">`
            : `<span class="recipe-emoji" aria-hidden="true">${escapeHTML(recipe.emoji || emoji[recipe.category] || '🍓')}</span>`}
          <span class="recipe-category-label">${escapeHTML(recipe.category)}</span>
        </div>
        <div class="recipe-body">
          <span class="card-meta">${recipe.source === 'local' ? '♡ MY LOCAL RECIPE' : '♡ FROM MY KITCHEN'}</span>
          <h3 class="card-title">${escapeHTML(recipe.title)}</h3>
          <p class="card-desc">${escapeHTML(recipe.description || 'A lovely little recipe for a cozy moment.')}</p>
          <div class="card-bottom">
            <span class="recipe-stats">${recipe.time ? `◷ ${Number(recipe.time)} min` : '♡ Made with love'}</span>
            <button type="button" class="subtle-link" data-open-recipe="${escapeHTML(recipe.id)}">View recipe ↗</button>
          </div>
        </div>
      </article>
    `).join('');

    emptyMessage.hidden = items.length !== 0;
  }

  async function loadRecipesFromDatabase() {
    if (!db) {
      console.warn('Supabase not configured. Check the CDN script, project URL, and publishable key.');
      setStatus('Database connection is not configured yet.');
      return;
    }

    setStatus('Loading recipes…');
    try {
      const { data, error } = await db
        .from('recipes')
        .select('id, title, category, description, ingredients, steps, image_url, prep_minutes, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      databaseRecipes = (data || []).map((recipe) => ({
        id: recipe.id,
        title: recipe.title,
        category: recipe.category,
        description: recipe.description,
        ingredients: recipe.ingredients,
        steps: recipe.steps,
        image: recipe.image_url,
        time: recipe.prep_minutes,
        createdAt: recipe.created_at,
        source: 'database',
        color: colors[recipe.category] || '#f6dce5',
        emoji: emoji[recipe.category] || '🍓'
      }));

      setStatus('');
      render();
    } catch (error) {
      console.error('Unable to load recipes from Supabase:', error);
      setStatus('Recipes could not be loaded right now. Please try again later.');
    }
  }

  function openDetail(id) {
    const recipe = all().find((item) => item.id === id);
    if (!recipe) return;

    $('#recipe-detail-title').textContent = recipe.title;
    const ingredients = Array.isArray(recipe.ingredients) ? recipe.ingredients : [];
    const steps = Array.isArray(recipe.steps) ? recipe.steps : [];

    $('#recipe-detail-content').innerHTML = `
      <span class="dialog-stamp">${escapeHTML(recipe.category)}${recipe.time ? ` · ${Number(recipe.time)} minutes` : ''}${recipe.source === 'local' ? ' · saved in this browser' : ''}</span>
      ${recipe.image ? `<img class="recipe-detail-photo" src="${escapeHTML(recipe.image)}" alt="${escapeHTML(recipe.title)}">` : ''}
      <p>${escapeHTML(recipe.description)}</p>
      <h3>What you'll need</h3>
      <ul>${ingredients.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ul>
      <h3>How to make it</h3>
      <ol>${steps.map((item) => `<li>${escapeHTML(item)}</li>`).join('')}</ol>
      ${recipe.source === 'local' ? `
        <div class="dialog-actions">
          <button type="button" class="delete-action" data-delete-recipe="${escapeHTML(recipe.id)}">Delete this draft</button>
          <button type="button" class="outline-btn" data-edit-recipe="${escapeHTML(recipe.id)}">Edit recipe</button>
        </div>` : ''}`;
    dialog.showModal();
  }

  function openForm(id = null) {
    form.reset();
    editingId = id;
    const recipe = drafts.find((item) => item.id === id);
    $('#recipe-form-title').textContent = recipe ? 'Edit this recipe ♡' : 'Add to my recipe box ♡';

    if (recipe) {
      for (const name of ['title', 'category', 'time', 'description']) {
        form.elements[name].value = recipe[name] ?? '';
      }
      form.elements.ingredients.value = recipe.ingredients.join('\n');
      form.elements.steps.value = recipe.steps.join('\n');
    }
    formDialog.showModal();
  }

  $('#new-recipe-btn').addEventListener('click', () => openForm());

  grid.addEventListener('click', (event) => {
    const button = event.target.closest('[data-open-recipe]');
    if (button) openDetail(button.dataset.openRecipe);
  });

  $('#recipe-filters').addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    category = button.dataset.category;
    document.querySelectorAll('#recipe-filters .filter-chip').forEach((chip) => {
      const active = chip === button;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    render();
  });

  $('#recipe-search').addEventListener('input', (event) => {
    search = event.target.value.trim().toLowerCase();
    render();
  });

  form.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const chosenCategory = String(data.get('category') || 'Other');
    const entry = {
      id: editingId || `local-${Date.now()}`,
      title: String(data.get('title') || '').trim(),
      category: chosenCategory,
      time: Math.min(600, Math.max(1, Number(data.get('time')) || 20)),
      description: String(data.get('description') || '').trim(),
      ingredients: lines(data.get('ingredients')),
      steps: lines(data.get('steps')),
      createdAt: new Date().toISOString().slice(0, 10),
      source: 'local',
      emoji: emoji[chosenCategory],
      color: colors[chosenCategory]
    };
    if (!entry.title || !entry.ingredients.length || !entry.steps.length) return;

    const oldDrafts = drafts;
    drafts = editingId
      ? drafts.map((recipe) => recipe.id === editingId ? entry : recipe)
      : [entry, ...drafts];
    if (!persist()) {
      drafts = oldDrafts;
      return;
    }

    category = 'All';
    search = '';
    $('#recipe-search').value = '';
    document.querySelectorAll('#recipe-filters .filter-chip').forEach((chip) => {
      const active = chip.dataset.category === 'All';
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    formDialog.close();
    render();
  });

  $('#recipe-detail-content').addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-delete-recipe]');
    const editButton = event.target.closest('[data-edit-recipe]');
    if (removeButton && confirm('Delete this locally saved recipe?')) {
      const previous = drafts;
      drafts = drafts.filter((recipe) => recipe.id !== removeButton.dataset.deleteRecipe);
      if (persist()) {
        dialog.close();
        render();
      } else {
        drafts = previous;
      }
    }
    if (editButton) {
      dialog.close();
      openForm(editButton.dataset.editRecipe);
    }
  });

  document.querySelectorAll('[data-close-dialog]').forEach((button) =>
    button.addEventListener('click', () => document.getElementById(button.dataset.closeDialog).close())
  );
  [dialog, formDialog].forEach((item) =>
    item.addEventListener('click', (event) => { if (event.target === item) item.close(); })
  );

  render();
  loadRecipesFromDatabase();
})();
