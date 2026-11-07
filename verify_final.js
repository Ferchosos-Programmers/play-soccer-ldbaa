const https = require('https');

function fetchJson(url) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); } catch (e) { reject(e); }
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
    for (let k in fields) obj[k] = parseFirestoreValue(fields[k]);
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
  for (let k in fields) res[k] = parseFirestoreValue(fields[k]);
  return res;
}

async function verify() {
  const fixIds = {
    'MÁXIMA': 'Kjqtm2Ss23JKFicur3uw',
    'PRIMERA': 'jyic2A9h9G3v3iAwIYR8',
    'FEMENINO': 'k5SOL1Q5cPuwHA6MMf22'
  };

  const allJ6 = [];

  for (let cat of Object.keys(fixIds)) {
    const id = fixIds[cat];
    const raw = await fetchJson(`https://firestore.googleapis.com/v1/projects/ldbaa-calificaciones/databases/(default)/documents/fixtures/${id}`);
    const doc = parseFirestoreDoc(raw);
    const matches = doc.data || [];
    matches.forEach((m, idx) => {
      if (parseInt(m.jornada) === 6) {
        allJ6.push({
          cat,
          idx,
          dia: m.fechaRealAsignadaText,
          hora: m.horaRealAsignada,
          local: m.local,
          camL: m.camerinoLocal ? `C${m.camerinoLocal}` : '',
          visitor: m.visitor,
          camV: m.camerinoVisitor ? `C${m.camerinoVisitor}` : '',
          vocal: m.vocalAsignado,
          veedor: m.veedorAsignado
        });
      }
    });
  }

  const dayOrder = { 'Sábado': 1, 'Domingo': 2 };
  allJ6.sort((a, b) => {
    if (dayOrder[a.dia] !== dayOrder[b.dia]) return (dayOrder[a.dia] || 99) - (dayOrder[b.dia] || 99);
    return (a.hora || '99:99').localeCompare(b.hora || '99:99');
  });

  console.log(`\n========================================================================================`);
  console.log(`TOTAL PARTIDOS PROGRAMADOS EN JORNADA 6 EN FIRESTORE: ${allJ6.length}`);
  console.log(`========================================================================================`);
  console.log(`HORA  | CATEGORIA | EQUIPO LOCAL       | CAM | VS | EQUIPO VISITANTE   | CAM | VOCAL          | VEEDOR`);
  console.log(`----------------------------------------------------------------------------------------`);
  let currentDay = '';
  allJ6.forEach(m => {
    if (m.dia !== currentDay) {
      currentDay = m.dia;
      console.log(`\n>>> ${currentDay.toUpperCase()} <<<`);
    }
    const h = (m.hora || '').padEnd(5);
    const c = (m.cat || '').padEnd(9);
    const loc = (m.local || '').padEnd(18);
    const cl = (m.camL || '').padEnd(3);
    const vis = (m.visitor || '').padEnd(18);
    const cv = (m.camV || '').padEnd(3);
    const voc = (m.vocal || '').padEnd(14);
    const vee = (m.veedor || '');
    console.log(`${h} | ${c} | ${loc} | ${cl} | VS | ${vis} | ${cv} | ${voc} | ${vee}`);
  });
}

verify().catch(console.error);

