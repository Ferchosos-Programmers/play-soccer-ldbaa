const https = require('https');
const API_KEY = 'AIzaSyAzRTlx96sL8rxcgLauftrTWpr5VlwjV00';
const url = 'https://firestore.googleapis.com/v1/projects/ldbaa-calificaciones/databases/(default)/documents/fixtures/Kjqtm2Ss23JKFicur3uw?key=' + API_KEY;

https.get(url, (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    const doc = JSON.parse(data);
    const values = doc.fields.data.arrayValue.values;
    console.log('Total matches in MAXIMA:', values.length);
    values.forEach((v, idx) => {
      const f = v.mapValue.fields;
      const j = f.jornada?.integerValue || f.jornada?.stringValue || '';
      const tag = f.tag?.stringValue || f.etiqueta?.stringValue || '';
      const local = f.local?.stringValue || '';
      const visitor = f.visitor?.stringValue || '';
      const time = f.horaRealAsignada?.stringValue || '';
      const date = f.fechaRealAsignadaText?.stringValue || '';
      const vocal = f.vocalAsignado?.stringValue || '';
      const veedor = f.veedorAsignado?.stringValue || '';
      const score = (f.scoreLocal?.stringValue || f.scoreLocal?.integerValue || '') + '-' + (f.scoreVisitor?.stringValue || f.scoreVisitor?.integerValue || '');
      
      if (j == '3' || tag.includes('Fecha 3') || tag.includes('Jornada 3')) {
        console.log(`Idx ${idx}: [J${j}] ${local} vs ${visitor} | tag: '${tag}' | ${date} ${time} | Vocal: ${vocal} | Veedor: ${veedor} | score: ${score}`);
      }
    });
  });
}).on('error', err => console.error(err));
