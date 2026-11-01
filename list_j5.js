const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          reject(e);
        }
      });
    }).on('error', reject);
  });
}

function parseFirestoreValue(val) {
  if (!val) return null;
  if ('stringValue' in val) return val.stringValue;
  if ('integerValue' in val) return parseInt(val.integerValue);
  if ('doubleValue' in val) return parseFloat(val.doubleValue);
  if ('booleanValue' in val) return val.booleanValue;
  if ('timestampValue' in val) return val.timestampValue;
  if ('nullValue' in val) return null;
  if ('mapValue' in val) {
    const fields = val.mapValue.fields || {};
    const obj = {};
    for (let k in fields) {
      obj[k] = parseFirestoreValue(fields[k]);
    }
    return obj;
  }
  if ('arrayValue' in val) {
    const values = val.arrayValue.values || [];
    return values.map(parseFirestoreValue);
  }
  return val;
}

function parseFirestoreDoc(doc) {
  const nameParts = doc.name.split('/');
  const docId = nameParts[nameParts.length - 1];
  const fields = doc.fields || {};
  const res = { id: docId };
  for (let k in fields) {
    res[k] = parseFirestoreValue(fields[k]);
  }
  return res;
}

function isMatchProgrammed(m) {
  if (!m) return false;
  const f = (m.fechaRealAsignadaText || m.fechaReal || m.dia || m.date || '').trim();
  const h = (m.horaRealAsignada || m.hora || '').trim();
  if (
    !f ||
    f === 'Por Definir' ||
    f === '---' ||
    f === 'Pend' ||
    f === 'undefined' ||
    f === 'null' ||
    /^fecha\s*\d+$/i.test(f) ||
    /^jornada\s*\d+$/i.test(f)
  ) return false;
  if (
    !h ||
    h === '--:--' ||
    h === 'Por programar' ||
    h === 'Por Definir' ||
    h === '---' ||
    h === 'Pend' ||
    h === 'undefined' ||
    h === 'null'
  ) return false;
  return true;
}

async function main() {
  const url = 'https://firestore.googleapis.com/v1/projects/ldbaa-calificaciones/databases/(default)/documents/fixtures?pageSize=100';
  const response = await fetchJson(url);
  const rawDocs = response.documents || [];

  const campId = 'p7eMp1ciqd67iQCiA4JV';
  let j5Matches = [];

  for (let rawDoc of rawDocs) {
    const doc = parseFirestoreDoc(rawDoc);
    if (doc.championshipId !== campId) continue;
    const matches = doc.data || [];
    matches.forEach((m, idx) => {
      const matchJornada = parseInt(m.jornada) || 1;
      if (matchJornada === 5 && isMatchProgrammed(m)) {
        j5Matches.push({
          docId: doc.id,
          cat: doc.category,
          idx,
          local: m.local,
          visitor: m.visitor,
          dia: m.fechaRealAsignadaText,
          hora: m.horaRealAsignada,
          isFacturado: !!(m.billingLocal || m.billingVisitor),
          vocal: m.vocalAsignado
        });
      }
    });
  }

  const dayOrder = { Viernes: 1, 'Sábado': 2, Domingo: 3 };
  j5Matches.sort((a, b) => {
    const dayA = a.dia || '';
    const dayB = b.dia || '';
    if (dayOrder[dayA] !== dayOrder[dayB]) return (dayOrder[dayA] || 99) - (dayOrder[dayB] || 99);
    return (a.hora || '99:99').localeCompare(b.hora || '99:99');
  });

  console.log(`Total Jornada 5 programmed matches: ${j5Matches.length}`);
  j5Matches.forEach((m, i) => {
    console.log(`${i+1}. [${m.cat}] ${m.local} vs ${m.visitor} | ${m.dia} ${m.hora} | Facturado: ${m.isFacturado} | Vocal: ${m.vocal} (doc: ${m.docId}, idx: ${m.idx})`);
  });
}

main().catch(console.error);

