const https = require('https');
const API_KEY = 'AIzaSyAzRTlx96sL8rxcgLauftrTWpr5VlwjV00';

async function getDoc(docId) {
  return new Promise((resolve, reject) => {
    const url = 'https://firestore.googleapis.com/v1/projects/ldbaa-calificaciones/databases/(default)/documents/fixtures/' + docId + '?key=' + API_KEY;
    https.get(url, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => resolve(JSON.parse(data)));
    }).on('error', reject);
  });
}

async function checkAllJornada7() {
  const docs = [
    { id: 'jyic2A9h9G3v3iAwIYR8', name: 'PRIMERA' },
    { id: 'k5SOL1Q5cPuwHA6MMf22', name: 'FEMENINO' },
    { id: 'Kjqtm2Ss23JKFicur3uw', name: 'MÁXIMA' }
  ];

  for (const d of docs) {
    const docData = await getDoc(d.id);
    const values = docData.fields.data.arrayValue.values;
    console.log(`\n=== CATEGORÍA ${d.name} (${d.id}) Total: ${values.length} matches ===`);
    values.forEach((v, idx) => {
      const f = v.mapValue.fields;
      const j = f.jornada ? (f.jornada.integerValue || f.jornada.stringValue) : '';
      const local = f.local?.stringValue || '';
      const visitor = f.visitor?.stringValue || '';
      const hora = f.horaRealAsignada?.stringValue || f.hora?.stringValue || '';
      const dia = f.fechaRealAsignadaText?.stringValue || f.dia?.stringValue || '';
      const vocal = f.vocalAsignado?.stringValue || '';
      const veedor = f.veedorAsignado?.stringValue || '';
      const tag = f.tag?.stringValue || f.etiqueta?.stringValue || '';

      if (j == '7' || tag.includes('Fecha 7') || hora) {
        console.log(`  Idx ${idx}: [J${j}] ${local} vs ${visitor} | ${dia} ${hora} | Vocal: ${vocal} | Veedor: ${veedor} | tag: '${tag}'`);
      }
    });
  }
}

checkAllJornada7().catch(console.error);
