// Automated test for Task 26: Trip Chat feature
import assert from 'assert';
import fetch from 'node-fetch';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3000';
const TEST_TRIP_ID = process.env.TEST_TRIP_ID || 'test-trip-1';
const API_URL = `${BASE_URL}/api/trips/${TEST_TRIP_ID}/chat`;

async function run() {
  // 1. Send a message
  const sendRes = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content: 'Hello from test', message_type: 'text' })
  });
  assert.strictEqual(sendRes.status, 200, 'POST /chat should succeed');
  const sendData = await sendRes.json();
  assert(sendData.message, 'Response should include message');
  const messageId = sendData.message.id;

  // 2. Get messages
  const getRes = await fetch(API_URL);
  assert.strictEqual(getRes.status, 200, 'GET /chat should succeed');
  const getData = await getRes.json();
  assert(Array.isArray(getData.messages), 'messages should be an array');
  assert(getData.messages.some(m => m.id === messageId), 'Sent message should be in list');

  // 3. Edit message
  const editRes = await fetch(API_URL, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: messageId, content: 'Edited by test', edited: true })
  });
  assert.strictEqual(editRes.status, 200, 'PUT /chat should succeed');
  const editData = await editRes.json();
  assert(editData.message.content === 'Edited by test', 'Message should be edited');

  // 4. Delete message
  const delRes = await fetch(`${API_URL}?id=${messageId}`, { method: 'DELETE' });
  assert.strictEqual(delRes.status, 200, 'DELETE /chat should succeed');
  const delData = await delRes.json();
  assert(delData.success, 'Delete should return success');

  // 5. Confirm deletion
  const getRes2 = await fetch(API_URL);
  const getData2 = await getRes2.json();
  assert(!getData2.messages.some(m => m.id === messageId), 'Message should be deleted');

  console.log('Task 26 Trip Chat API test passed.');
}

run().catch(e => {
  console.error('Task 26 Trip Chat API test failed:', e);
  process.exit(1);
});
