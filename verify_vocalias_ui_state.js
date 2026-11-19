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
  return new Promise((res, rej) => {
    https.get('https://firestore.googleapis.com/v1/projects/ldbaa-calificaciones/databases/(default)/documents/fixtures/' + docId + '?key=' + API_KEY, (r) => {
      let d = '';
      r.on('data', c => d += c);
      r.on('end', () => res(JSON.parse(d)));
    }).on('error', rej);
  });
}

async function run() {
  const docs = [
    { id: 'jyic2A9h9G3v3iAwIYR8', name: 'PRIMERA' },
    { id: 'k5SOL1Q5cPuwHA6MMf22', name: 'FEMENINO' },
    { id: 'Kjqtm2Ss23JKFicur3uw', name: 'MÁXIMA' }
  ];

  const jornadasProgramadas = new Set();
  const counts = {};
  const matchesByJornada = {};

  for (const item of docs) {
    const d = await getDoc(item.id);
    const matches = parseFirestore(d);
    matches.forEach((m, idx) => {
      if (isProgrammed(m)) {
        const j = parseInt(m.jornada) || 1;
        jornadasProgramadas.add(j);
        counts[j] = (counts[j] || 0) + 1;
        if (!matchesByJornada[j]) matchesByJornada[j] = [];
        matchesByJornada[j].push({ cat: item.name, idx, ...m });
      }
    });
  }

  const sorted = Array.from(jornadasProgramadas).sort((a,b) => a - b);
  console.log("=== JORNADAS QUE SE MOSTRARÁN EN VOCALIAS.HTML ===");
  sorted.forEach(j => {
    console.log(`Jornada ${j}: ${counts[j]} partidos programados`);
  });

  console.log("\n=== DETALLE DE FECHA 8 ===");
  matchesByJornada[8].forEach(m => {
    console.log(`[${m.cat}] ${m.fechaRealAsignadaText} ${m.horaRealAsignada} | ${m.local} (C${m.camerinoLocal}) vs ${m.visitor} (C${m.camerinoVisitor}) | Vocal: ${m.vocalAsignado} | Veedor: ${m.veedorAsignado}`);
  });

  console.log("\n=== DETALLE DE FECHA 7 ===");
  matchesByJornada[7].forEach(m => {
    console.log(`[${m.cat}] ${m.fechaRealAsignadaText} ${m.horaRealAsignada} | ${m.local} (C${m.camerinoLocal}) vs ${m.visitor} (C${m.camerinoVisitor}) | Vocal: ${m.vocalAsignado} | Veedor: ${m.veedorAsignado}`);
  });
}

run().catch(console.error);
