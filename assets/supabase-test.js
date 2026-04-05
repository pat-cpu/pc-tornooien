import { pushAllToCloud } from './cloud.js';

async function testPush() {
  try {
    const result = await pushAllToCloud();
    console.log('Push naar Supabase OK:', result);
  } catch (error) {
    console.error('Push naar Supabase mislukt:', error);
  }
}

testPush();