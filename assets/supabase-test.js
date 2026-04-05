import { pullFromCloud } from './cloud.js';

async function testPull() {
  try {
    const items = await pullFromCloud();
    console.log('Cloud naar localStorage OK:', items);
  } catch (error) {
    console.error('Cloud ophalen mislukt:', error);
  }
}

testPull();