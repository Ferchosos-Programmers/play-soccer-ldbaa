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

async function diagnose() {
  const docs = [
    { id: 'jyic2A9h9G3v3iAwIYR8', name: 'PRIMERA' },
    { id: 'k5SOL1Q5cPuwHA6MMf22', name: 'FEMENINO' },
    { id: 'Kjqtm2Ss23JKFicur3uw', name: 'MÁXIMA' }
  ];

  for (const d of docs) {
    const docData = await getDoc(d.id);
    const values = docData.fields.data.arrayValue.values;
    console.log(`\n======================================================`);
    console.log(`CATEGORÍA: ${d.name} (${d.id}) - Total matches: ${values.length}`);
    
    let finalizedCount = 0;
    let withScoreCount = 0;
    let withVocalReportCount = 0;
    const jDistribution = {};

    values.forEach((v, idx) => {
      const f = v.mapValue.fields;
      const j = f.jornada ? (f.jornada.integerValue || f.jornada.stringValue) : 'none';
      jDistribution[j] = (jDistribution[j] || 0) + 1;

      const isFin = f.isFinalized?.booleanValue === true;
      const hasVR = !!f.vocalReport;
      const hasScore = f.scoreLocal !== undefined || f.golesLocal !== undefined || (f.liveStatus && f.liveStatus.mapValue && f.liveStatus.mapValue.fields.scoreLocal !== undefined);
      const dia = f.fechaRealAsignadaText?.stringValue || f.dia?.stringValue || '';
      const hora = f.horaRealAsignada?.stringValue || f.hora?.stringValue || '';

      if (isFin) finalizedCount++;
      if (hasVR) withVocalReportCount++;
      if (hasScore) withScoreCount++;

      // Check J12 and J13
      if (j == '12' || j == '13') {
        console.log(`  [ALERTA J${j}] Idx ${idx}: ${f.local?.stringValue} vs ${f.visitor?.stringValue} | dia: '${dia}' hora: '${hora}' | vocal: '${f.vocalAsignado?.stringValue}' | tag: '${f.tag?.stringValue || f.etiqueta?.stringValue}' | isFin: ${isFin}`);
      }

      // Check finalized or matches with reports
      if (isFin || hasVR || (hasScore && hora)) {
        console.log(`  [JUGADO/ACTA J${j}] Idx ${idx}: ${f.local?.stringValue} vs ${f.visitor?.stringValue} | Score: ${f.scoreLocal?.stringValue || f.scoreLocal?.integerValue || f.golesLocal?.integerValue || '?'}-${f.scoreVisitor?.stringValue || f.scoreVisitor?.integerValue || f.golesVisitor?.integerValue || '?'} | isFin: ${isFin} | hasVR: ${hasVR} | dia: '${dia}' hora: '${hora}'`);
      }
    });

    console.log(`Resumen ${d.name}: Finalizados: ${finalizedCount}, Con Reporte Vocal: ${withVocalReportCount}, Con Marcador: ${withScoreCount}`);
    console.log(`Distribución por Jornada:`, JSON.stringify(jDistribution));
  }
}

diagnose().catch(console.error);
