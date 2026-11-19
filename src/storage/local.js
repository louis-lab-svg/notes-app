// Stockage local : les notes sont rangées dans IndexedDB, la petite base de
// données intégrée au navigateur. Chaque appareil a la sienne.
import { createStore, get, set, del, values } from 'idb-keyval';

const db = createStore('notes-app', 'notes');

export const list = () => values(db);
export const getOne = (id) => get(id, db);
export const put = (note) => set(note.id, note, db);
export const remove = (id) => del(id, db);
