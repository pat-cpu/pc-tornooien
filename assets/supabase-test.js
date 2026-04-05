import { syncNow } from './cloud.js';

async function testSync() {
  try {
    const result = await syncNow();
    console.log('Sync OK:', result);
  } catch (error) {
    console.error('Sync mislukt:', error);
  }
}

testSync();