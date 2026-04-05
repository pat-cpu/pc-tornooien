import { pullFromCloud } from './cloud.js';

async function testPull() {
  try {
    const items = await pullFromCloud();
    console.log('Cloud naar localStorage OK:', items);
    console.log('LocalStorage nu:', localStorage.getItem('pc_tornooien_cache_v9'));
  } catch (error) {
    console.error('Cloud ophalen mislukt:', error);
  }
}

testPull();