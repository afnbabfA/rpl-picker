const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('fs');
const path = require('path');
const Papa = require('papaparse');

test('parses CSV with multiline Opakowanie column', () => {
  const csvPath = path.join(__dirname, 'fixtures', 'opakowanie.csv');
  const csv = fs.readFileSync(csvPath, 'utf8');
  const result = Papa.parse(csv, {
    header: true,
    skipEmptyLines: true
  });
  assert.equal(result.data.length, 2);
  assert.deepEqual(result.data[0], {
    'Nazwa produktu': 'Produkt A',
    'Opakowanie': 'butelka 100 ml\nkarton'
  });
  assert.deepEqual(result.data[1], {
    'Nazwa produktu': 'Produkt B',
    'Opakowanie': 'słoik 50 g\n+ łyżeczka'
  });
});
