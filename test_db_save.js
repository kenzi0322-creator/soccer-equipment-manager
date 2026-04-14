
const fs = require('fs').promises;
const path = require('path');

async function testSave() {
  const filePath = path.join(process.cwd(), 'event_required_items.json');
  console.log('Testing write to:', filePath);
  try {
    const data = await fs.readFile(filePath, 'utf-8');
    const items = JSON.parse(data);
    console.log('Read success, items count:', items.length);
    
    // Test write (no changes, just write back)
    await fs.writeFile(filePath, JSON.stringify(items, null, 2), 'utf-8');
    console.log('Write success!');
  } catch (e) {
    console.error('Persistence Test Failed:', e);
  }
}

testSave();
