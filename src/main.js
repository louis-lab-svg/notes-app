// Démarrage de l'appli et navigation entre les écrans.
//
// Adresses (la partie après # dans la barre d'adresse) :
//   #/n/<id>   → ouvre une note
//   #/graphe   → la vue graphe
// Utiliser l'adresse permet au bouton « retour » du téléphone de fonctionner.
import './style.css';
import { store, requestPersistence } from './storage/store.js';
import { createNote, cleanTitle, findByTitle, uniqueTitle } from './core/notes.js';
import { renderMarkdown } from './core/markdown.js';
import { toggleTask } from './core/tasks.js';
import { renderNoteList } from './ui/sidebar.js';

const $ = (id) => document.getElementById(id);
const el = {
  app: $('app'),
  list: $('note-list'),
  title: $('note-title'),
  editor: $('editor'),
  preview: $('preview'),
  btnEdit: $('btn-edit'),
  btnRead: $('btn-read'),
  topbarTitle: $('topbar-title'),
  views: { note: $('view-note'), graph: $('view-graph'), empty: $('view-empty') },
};

const state = {
  notes: [], // toutes les notes, gardées en mémoire
  current: null, // la note ouverte
  dirty: false, // vrai si la note ouverte a des modifications pas encore enregistrées
  mode: readSetting('mode', 'edit'), // 'edit' ou 'read'
};

// ---------- Réglages mémorisés (petites préférences, pas les notes) ----------
function readSetting(key, fallback) {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}
function writeSetting(key, value) {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* navigation privée : tant pis */
  }
}

// ---------- Enregistrement automatique ----------
let saveTimer = null;

function scheduleSave() {
  state.dirty = true;
  clearTimeout(saveTimer);
  saveTimer = setTimeout(flushSave, 500);
}

async function flushSave() {
  clearTimeout(saveTimer);
  if (!state.current || !state.dirty) return;
  state.dirty = false;
  await store.put(state.current);
}

// ---------- Actions sur les notes ----------
async function newNote(title = uniqueTitle(state.notes), { open = true } = {}) {
  const note = createNote(title);
  state.notes.push(note);
  await store.put(note);
  refreshSidebar();
  if (open) {
    setMode('edit');
    goTo(note.id);
  }
  return note;
}

async function renameCurrent(rawTitle) {
  const note = state.current;
  const title = cleanTitle(rawTitle);
  if (!title || title === note.title) {
    el.title.value = note.title;
    return;
  }
  const existing = findByTitle(state.notes, title);
  if (existing && existing.id !== note.id) {
    alert(`Une note « ${existing.title} » existe déjà.`);
    el.title.value = note.title;
    return;
  }
  note.title = title;
  el.title.value = title;
  await store.put(note);
  refreshSidebar();
  el.topbarTitle.textContent = title;
}

async function deleteCurrent() {
  const note = state.current;
  if (!note || !confirm(`Supprimer définitivement « ${note.title} » ?`)) return;
  clearTimeout(saveTimer);
  state.dirty = false;
  state.notes = state.notes.filter((n) => n.id !== note.id);
  state.current = null;
  await store.remove(note.id);
  refreshSidebar();
  location.hash = ''; // retourne à l'accueil (dernière note modifiée)
}

// ---------- Affichage ----------
function showView(name) {
  for (const [key, view] of Object.entries(el.views)) view.hidden = key !== name;
}

function refreshSidebar() {
  renderNoteList(el.list, state.notes, state.current?.id);
}

function setMode(mode) {
  state.mode = mode;
  writeSetting('mode', mode);
  el.btnEdit.classList.toggle('active', mode === 'edit');
  el.btnRead.classList.toggle('active', mode === 'read');
  el.editor.hidden = mode !== 'edit';
  el.preview.hidden = mode !== 'read';
  if (mode === 'read') renderPreview();
}

function renderPreview() {
  if (!state.current) return;
  el.preview.innerHTML = renderMarkdown(state.current.content);
  // Les cases à cocher sont désactivées par défaut : on les rend cliquables.
  el.preview.querySelectorAll('input[type="checkbox"]').forEach((box, i) => {
    box.disabled = false;
    box.dataset.index = i;
  });
}

function showNote(note) {
  state.current = note;
  el.title.value = note.title;
  el.editor.value = note.content;
  el.topbarTitle.textContent = note.title;
  showView('note');
  setMode(state.mode);
  refreshSidebar();
}

function showEmpty() {
  state.current = null;
  el.topbarTitle.textContent = 'Notes';
  showView('empty');
  refreshSidebar();
}

// ---------- Navigation ----------
function goTo(id) {
  location.hash = `#/n/${id}`;
}

async function route() {
  await flushSave();
  closeSidebar();
  const hash = location.hash;

  const match = hash.match(/^#\/n\/(.+)$/);
  if (match) {
    const note = state.notes.find((n) => n.id === decodeURIComponent(match[1]));
    if (note) return showNote(note);
  }

  // Par défaut : la dernière note modifiée, ou l'écran vide.
  const recent = [...state.notes].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  if (recent) location.replace(`#/n/${recent.id}`);
  else showEmpty();
}

// ---------- Barre latérale sur téléphone ----------
function openSidebar() {
  el.app.classList.add('sidebar-open');
}
function closeSidebar() {
  el.app.classList.remove('sidebar-open');
}

// ---------- Branchements des boutons ----------
function bindEvents() {
  $('btn-new').addEventListener('click', () => newNote());
  $('btn-new-empty').addEventListener('click', () => newNote());
  $('btn-delete').addEventListener('click', deleteCurrent);
  $('btn-menu').addEventListener('click', openSidebar);
  $('backdrop').addEventListener('click', closeSidebar);
  // Toucher une note dans la liste referme le menu (même si c'est la note déjà ouverte).
  el.list.addEventListener('click', (e) => e.target.closest('a') && closeSidebar());
  el.btnEdit.addEventListener('click', () => setMode('edit'));
  el.btnRead.addEventListener('click', () => setMode('read'));

  el.editor.addEventListener('input', () => {
    state.current.content = el.editor.value;
    scheduleSave();
  });

  el.title.addEventListener('change', () => renameCurrent(el.title.value));
  el.title.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') el.title.blur();
    if (e.key === 'Escape') {
      el.title.value = state.current.title;
      el.title.blur();
    }
  });

  el.preview.addEventListener('click', (e) => {
    const box = e.target.closest('input[type="checkbox"]');
    if (box) {
      state.current.content = toggleTask(state.current.content, Number(box.dataset.index));
      el.editor.value = state.current.content;
      scheduleSave();
      renderPreview();
      return;
    }
    const link = e.target.closest('a[href^="http"]');
    if (link) {
      e.preventDefault();
      window.open(link.href, '_blank', 'noopener');
    }
  });

  window.addEventListener('hashchange', route);
  // Enregistre tout de suite si on quitte l'appli ou change d'onglet.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') flushSave();
  });
  window.addEventListener('pagehide', flushSave);
}

async function init() {
  state.notes = await store.list();
  requestPersistence();
  bindEvents();
  route();
}

init();
