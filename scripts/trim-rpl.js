const fs = require('fs');
const Papa = require('papaparse');

const input = process.argv[2];
const output = process.argv[3];
if (!input || !output) {
  console.error('Usage: node trim-rpl.js <input.csv> <output.csv>');
  process.exit(1);
}

const wanted = [
  'Nazwa Produktu Leczniczego',
  'Nazwa powszechnie stosowana',
  'Rodzaj preparatu',
  'Zakaz stosowania u zwierząt',
  'Nazwa poprzednia produktu',
  'Droga podania - Gatunek - Tkanka - Okres karencji',
  'Moc',
  'Postać farmaceutyczna',
  'Opakowanie'
];

const csv = fs.readFileSync(input, 'utf8');
const parsed = Papa.parse(csv, {
  header: true,
  delimiter: ';',
  newline: '\r\n',
  skipEmptyLines: 'greedy'
});

const trimmed = parsed.data.map(row => {
  const out = {};
  for (const col of wanted) {
    out[col] = row[col] || '';
  }
  return out;
});

const outCsv = Papa.unparse(trimmed, {
  columns: wanted,
  delimiter: ';',
  newline: '\r\n'
});
fs.writeFileSync(output, outCsv);
