(() => {
  'use strict';

  const KEY = 'my-little-space:note-drafts:v1';
  const SUPABASE_URL = 'https://wkxtaladteeyiwniyguv.supabase.co';
  const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_a17phmd41BZGfemra65VPQ_Iic-YEJ7';

  const $ = (selector) => document.querySelector(selector);
  const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
  })[character]);
  const niceDate = (value) => {
    if (!value) return '';
    const date = new Date(`${String(value).slice(0, 10)}T12:00:00`);
    return Number.isNaN(date.getTime())
      ? ''
      : date.toLocaleDateString('en-CA', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const colors = {
    Reflection: '#fffafc', Quote: '#fff4f8', Gratitude: '#fff9f3'
  };

  const configured =
    SUPABASE_URL.startsWith('https://') &&
    SUPABASE_URL.includes('.supabase.co') &&
    SUPABASE_PUBLISHABLE_KEY.startsWith('sb_publishable_');

  const db = configured && window.supabase?.createClient
    ? window.supabase.createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
    : null;

  function loadDrafts() {
    try {
      const value = JSON.parse(localStorage.getItem(KEY) || '[]');
      return Array.isArray(value)
        ? value.filter((note) => note && typeof note.title === 'string' && typeof note.content === 'string')
        : [];
    } catch {
      return [];
    }
  }

  let drafts = loadDrafts();
  let databaseNotes = [];
  let category = 'All';
  let search = '';
  let editingId = null;
  const all = () => [...drafts, ...databaseNotes];

  const grid = $('#note-grid');
  const emptyMessage = $('#note-empty');
  const dialog = $('#note-dialog');
  const formDialog = $('#note-form-dialog');
  const form = $('#note-form');

  function setStatus(message) {
    if (!grid) return;
    let status = $('#note-status');
    if (!status) {
      status = document.createElement('p');
      status.id = 'note-status';
      status.setAttribute('role', 'status');
      status.style.cssText = 'text-align:center;margin:14px 0;color:#8d7180;';
      grid.before(status);
    }
    status.textContent = message;
    status.hidden = !message;
  }

  function storeDrafts() {
    try {
      localStorage.setItem(KEY, JSON.stringify(drafts));
      return true;
    } catch {
      alert('This browser could not save your note. Please check local storage settings.');
      return false;
    }
  }

  function render() {
    if (!grid) return;
    const entries = all().filter((note) =>
      (category === 'All' || note.category === category) &&
      [note.title, note.content, note.mood, note.category]
        .join(' ').toLowerCase().includes(search)
    );

    grid.innerHTML = entries.map((note) => {
      const content = String(note.content || '');
      const preview = content.replace(/\s+/g, ' ').slice(0, 165);
      const label = note.source === 'local' ? '♡ LOCAL DRAFT' : '✿ FROM MY LITTLE SPACE';
      return `<article class="panel-card note-card" style="--note-bg:${colors[note.category] || '#fffafc'}">
        <span class="card-meta">${esc(note.mood || '☁️ Thoughtful')} · ${esc(note.category || 'Reflection')}</span>
        <h3 class="card-title">${esc(note.title)}</h3>
        <p class="card-desc">${esc(preview)}${content.length > 165 ? '…' : ''}</p>
        <div class="card-bottom">
          <span class="note-date">${label} · ${esc(niceDate(note.createdAt))}</span>
          <button type="button" class="subtle-link" data-open-note="${esc(note.id)}">Read note ↗</button>
        </div>
      </article>`;
    }).join('');

    if (emptyMessage) emptyMessage.hidden = entries.length !== 0;
  }

  async function loadNotesFromDatabase() {
    if (!db) {
      setStatus('Database connection is not configured. Check the Supabase script and publishable key.');
      console.warn('Supabase client unavailable or not configured for Little Thoughts.');
      return;
    }

    setStatus('Loading little thoughts…');
    try {
      const { data, error } = await db
        .from('thoughts')
        .select('id, title, content, type, mood, created_at')
        .eq('published', true)
        .order('created_at', { ascending: false });

      if (error) throw error;

      databaseNotes = (data || []).map((row) => ({
        id: row.id,
        title: row.title || 'Untitled thought',
        content: row.content || '',
        category: row.type || 'Reflection', // Supabase uses "type", UI uses "category"
        mood: row.mood || '☁️ Thoughtful',
        createdAt: row.created_at,
        source: 'database'
      }));

      setStatus(databaseNotes.length === 0
        ? 'No published thoughts yet. Your browser-only drafts, if any, are shown below.'
        : '');
      render();
    } catch (error) {
      console.error('Unable to load Little Thoughts from Supabase:', error);
      setStatus('Could not load published thoughts. Check the browser Console for details.');
    }
  }

  function showNote(id) {
    const note = all().find((item) => item.id === id);
    if (!note || !dialog) return;

    const heading = $('#note-detail-title');
    const content = $('#note-detail-content');
    if (!heading || !content) return;
    heading.textContent = note.title;
    content.innerHTML = `
      <span class="dialog-stamp">${esc(note.category)} · ${esc(note.mood || '')} · ${esc(niceDate(note.createdAt))}${note.source === 'local' ? ' · Local draft' : ''}</span>
      <div style="white-space:pre-wrap;font:400 18px/1.8 var(--display);color:#7b4a62">${esc(note.content)}</div>
      ${note.source === 'local' ? `<div class="dialog-actions" style="margin-top:20px">
        <button type="button" class="delete-action" data-delete-note="${esc(note.id)}">Delete this draft</button>
        <button type="button" class="outline-btn" data-edit-note="${esc(note.id)}">Edit note</button>
      </div>` : ''}`;
    dialog.showModal();
  }

  function openForm(id = null) {
    if (!form || !formDialog) return;
    editingId = id;
    form.reset();
    const note = drafts.find((item) => item.id === id);
    const title = $('#note-form-title');
    if (title) title.textContent = note ? 'Edit my little thought ♡' : 'Dear little diary... ♡';
    if (note) {
      for (const name of ['title', 'category', 'mood', 'content']) {
        if (form.elements[name]) form.elements[name].value = note[name] ?? '';
      }
    }
    formDialog.showModal();
  }

  // Use optional chaining so one missing HTML control doesn't stop the database fetch.
  $('#new-note-btn')?.addEventListener('click', () => openForm());

  grid?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-open-note]');
    if (button) showNote(button.dataset.openNote);
  });

  $('#note-filters')?.addEventListener('click', (event) => {
    const button = event.target.closest('[data-category]');
    if (!button) return;
    category = button.dataset.category;
    document.querySelectorAll('#note-filters .filter-chip').forEach((chip) => {
      const active = chip === button;
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    render();
  });

  $('#note-search')?.addEventListener('input', (event) => {
    search = event.target.value.trim().toLowerCase();
    render();
  });

  form?.addEventListener('submit', (event) => {
    event.preventDefault();
    const data = new FormData(form);
    const entry = {
      id: editingId || `local-${Date.now()}`,
      title: String(data.get('title') || '').trim(),
      category: String(data.get('category') || 'Reflection'),
      mood: String(data.get('mood') || '☁️ Thoughtful'),
      content: String(data.get('content') || '').trim(),
      createdAt: new Date().toISOString().slice(0, 10),
      source: 'local'
    };
    if (!entry.title || !entry.content) return;

    const previous = drafts;
    drafts = editingId
      ? drafts.map((note) => note.id === editingId ? entry : note)
      : [entry, ...drafts];
    if (!storeDrafts()) { drafts = previous; return; }

    category = 'All';
    search = '';
    if ($('#note-search')) $('#note-search').value = '';
    document.querySelectorAll('#note-filters .filter-chip').forEach((chip) => {
      const active = chip.dataset.category === 'All';
      chip.classList.toggle('is-active', active);
      chip.setAttribute('aria-pressed', String(active));
    });
    formDialog.close();
    render();
  });

  $('#note-detail-content')?.addEventListener('click', (event) => {
    const removeButton = event.target.closest('[data-delete-note]');
    const editButton = event.target.closest('[data-edit-note]');
    if (removeButton && confirm('Delete this locally saved note?')) {
      const previous = drafts;
      drafts = drafts.filter((note) => note.id !== removeButton.dataset.deleteNote);
      if (storeDrafts()) { dialog?.close(); render(); }
      else drafts = previous;
    }
    if (editButton) {
      dialog?.close();
      openForm(editButton.dataset.editNote);
    }
  });

  document.querySelectorAll('[data-close-dialog]').forEach((button) => {
    button.addEventListener('click', () => document.getElementById(button.dataset.closeDialog)?.close());
  });
  [dialog, formDialog].filter(Boolean).forEach((element) => {
    element.addEventListener('click', (event) => {
      if (event.target === element) element.close();
    });
  });

  render();
  loadNotesFromDatabase();
})();
