/**
 * Tiny CSV loader/parser (no dependencies).
 * Handles quoted fields, escaped quotes ("") and numeric conversion.
 */
(function (global) {
  function parseCSV(text) {
    const rows = [];
    let row = [], field = '', inQuotes = false;
    text = text.replace(/^﻿/, '');
    for (let i = 0; i < text.length; i++) {
      const c = text[i];
      if (inQuotes) {
        if (c === '"' && text[i + 1] === '"') { field += '"'; i++; }
        else if (c === '"') inQuotes = false;
        else field += c;
      } else if (c === '"') inQuotes = true;
      else if (c === ',') { row.push(field); field = ''; }
      else if (c === '\n' || c === '\r') {
        if (c === '\r' && text[i + 1] === '\n') i++;
        row.push(field); field = '';
        if (row.some(v => v !== '')) rows.push(row);
        row = [];
      } else field += c;
    }
    row.push(field);
    if (row.some(v => v !== '')) rows.push(row);

    const header = rows.shift().map(h => h.trim());
    const records = rows.map(r => {
      const obj = {};
      header.forEach((h, idx) => {
        const raw = (r[idx] ?? '').trim();
        obj[h] = raw !== '' && !isNaN(raw) ? Number(raw) : raw;
      });
      return obj;
    });
    return { header, records };
  }

  async function loadCSV(path) {
    const res = await fetch(path, { cache: 'no-cache' });
    if (!res.ok) throw new Error(`Cannot load ${path} (${res.status})`);
    const text = await res.text();
    return { ...parseCSV(text), raw: text, path };
  }

  global.CSV = { parse: parseCSV, load: loadCSV };
})(window);
