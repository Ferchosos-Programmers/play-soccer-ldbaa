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
      const local = f.local?.stringValue || '';
      const visitor = f.visitor?.stringValue || '';
      const j = f.jornada?.integerValue || f.jornada?.stringValue || '';
      const tag = f.tag?.stringValue || f.etiqueta?.stringValue || '';
      const time = f.horaRealAsignada?.stringValue || f.time?.stringValue || '';
      const date = f.fechaRealAsignadaText?.stringValue || f.dia?.stringValue || f.date?.stringValue || '';
      
      const hasSpencer = local.toUpperCase().includes('SPENCER') || visitor.toUpperCase().includes('SPENCER');
      const hasEstudiantes = local.toUpperCase().includes('ESTUDIANTES') || visitor.toUpperCase().includes('ESTUDIANTES');
      
      if (hasSpencer || hasEstudiantes) {
        console.log('Idx ' + idx + ': [J' + j + '] ' + local + ' vs ' + visitor + ' | tag: ' + tag + ' | date: ' + date + ' ' + time + ' | score: ' + (f.scoreLocal?.stringValue || f.scoreLocal?.integerValue) + '-' + (f.scoreVisitor?.stringValue || f.scoreVisitor?.integerValue));
      }
    });
  });
}).on('error', err => console.error(err));
