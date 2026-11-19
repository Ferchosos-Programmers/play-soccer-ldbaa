const https = require('https');
const API_KEY = 'AIzaSyAzRTlx96sL8rxcgLauftrTWpr5VlwjV00';

function isProgrammed(m) {
  if (!m || m.isRest || m.local === 'DESCANSA' || m.visitor === 'DESCANSA' || m.local === 'LIBRE' || m.visitor === 'LIBRE') return false;
  if (!m.local || !m.visitor) return false;
  const f = (m.fechaRealAsignadaText || m.fechaReal || m.dia || m.date || '').trim();
  const h = (m.horaRealAsignada || m.hora || '').trim();
  const isInvalidFecha = !f || f === 'Por Definir' || f === '---' || f === 'Pend' || f === 'undefined' || f === 'null' || /^fecha\s*\d+$/i.test(f) || /^jornada\s*\d+$/i.test(f);
  const isInvalidHora = !h || h === '--:--' || h === 'Por programar' || h === 'Por Definir' || h === '---' || h === 'Pend' || h === 'undefined' || h === 'null';
  return !isInvalidFecha && !isInvalidHora;
}

function parseFirestore(doc) {
  const vals = doc.fields?.data?.arrayValue?.values || [];
  return vals.map(v => {
    const f = v.mapValue.fields;
    const obj = {};
    for (const k in f) {
      if (f[k].stringValue !== undefined) obj[k] = f[k].stringValue;
      else if (f[k].integerValue !== undefined) obj[k] = parseInt(f[k].integerValue);
      else if (f[k].booleanValue !== undefined) obj[k] = f[k].booleanValue;
      else if (f[k].mapValue !== undefined) obj[k] = f[k].mapValue;
    }
    return obj;
  });
}

async function getDoc(docId) {
  return new Promise((resolve, reject) => {
    https.get('https://firestore.googleapis.com/v1/projects/ldbaa-calificaciones/databases/(default)/documents/fixtures/' + docId + '?key=' + API_KEY, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

async function run() {
  const docs = [
    { id: 'jyic2A9h9G3v3iAwIYR8', name: 'PRIMERA' },
    { id: 'k5SOL1Q5cPuwHA6MMf22', name: 'FEMENINO' },
    { id: 'Kjqtm2Ss23JKFicur3uw', name: 'MÁXIMA' }
  ];
  for (const item of docs) {
    const d = await getDoc(item.id);
    const matches = parseFirestore(d);
    console.log(`\nChecking ${item.name} (${item.id}) - total matches: ${matches.length}`);
    matches.forEach((m, idx) => {
      const prog = isProgrammed(m);
      const j = parseInt(m.jornada) || 0;
      if (prog && j > 8) {
        console.log(`  [OVER 8] Idx ${idx}: J${j} - ${m.local} vs ${m.visitor} | Fecha: '${m.fechaRealAsignadaText || m.dia}' Hora: '${m.horaRealAsignada || m.hora}' | tag: '${m.tag}'`);
      }
    });
  }
}

run().catch(console.error);
