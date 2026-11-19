const fs = require('fs');
const https = require('https');
const API_KEY = 'AIzaSyAzRTlx96sL8rxcgLauftrTWpr5VlwjV00';

function extractReports(docJson) {
  const vals = docJson.fields?.data?.arrayValue?.values || [];
  const reports = [];
  vals.forEach((v, idx) => {
    const f = v.mapValue?.fields;
    if (!f) return;
    const local = f.local?.stringValue || '';
    const visitor = f.visitor?.stringValue || '';
    const j = f.jornada?.integerValue || f.jornada?.stringValue || '';
    const hasVR = !!f.vocalReport && !f.vocalReport.nullValue;
    const isFin = f.isFinalized?.booleanValue === true;
    const scoreL = f.golesLocal?.integerValue || f.scoreLocal?.integerValue || f.scoreLocal?.stringValue;
    const scoreV = f.golesVisitor?.integerValue || f.scoreVisitor?.integerValue || f.scoreVisitor?.stringValue;
    if (hasVR || isFin || (scoreL !== undefined && scoreV !== undefined)) {
      reports.push({ idx, local, visitor, j, hasVR, isFin, scoreL, scoreV, raw: v });
    }
  });
  return reports;
}

async function getLive(docId) {
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

  for (const cat of docs) {
    console.log(`\n=================== ${cat.name} ===================`);
    const live = await getLive(cat.id);
    const liveReports = extractReports(live);
    console.log(`Live reports found: ${liveReports.length}`);

    // Check all backup files for this cat id
    const bFiles = fs.readdirSync('.').filter(f => f.startsWith('backup_') && f.includes(cat.id));
    for (const bf of bFiles) {
      const bJson = JSON.parse(fs.readFileSync(bf, 'utf8'));
      const bReports = extractReports(bJson);
      console.log(`Checking ${bf} (found ${bReports.length} reports)...`);
      bReports.forEach(br => {
        const found = liveReports.find(lr => 
          (lr.local.toUpperCase() === br.local.toUpperCase() && lr.visitor.toUpperCase() === br.visitor.toUpperCase()) ||
          (lr.local.toUpperCase() === br.visitor.toUpperCase() && lr.visitor.toUpperCase() === br.local.toUpperCase())
        );
        if (!found) {
          console.log(`  MISSING in Live: J${br.j} ${br.local} vs ${br.visitor} (isFin: ${br.isFin}, hasVR: ${br.hasVR})`);
        } else if (br.hasVR && !found.hasVR) {
          console.log(`  LOST VR in Live: J${br.j} ${br.local} vs ${br.visitor}`);
        } else if (br.isFin && !found.isFin) {
          console.log(`  LOST FIN in Live: J${br.j} ${br.local} vs ${br.visitor}`);
        }
      });
    }
  }
}

run().catch(console.error);
