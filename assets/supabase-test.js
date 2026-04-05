import { getToernooien, setToernooien } from './store.js';

function ensureUpdatedAt() {
  const items = getToernooien();
  const fixed = items.map(item => ({
    ...item,
    updatedAt: item.updatedAt ?? new Date().toISOString()
  }));
  setToernooien(fixed);
  console.log('updatedAt toegevoegd:', fixed);
}

ensureUpdatedAt();