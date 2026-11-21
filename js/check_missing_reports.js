const https = require('https');
const fs = require('fs');
const path = require('path');
const API_KEY = 'AIzaSyAzRTlx96sL8rxcgLauftrTWpr5VlwjV00';

function resolveJsonPath(filename) {
  const candidates = [
    path.join(__dirname, '../json', filename),
    path.join(__dirname, 'json', filename),
    path.join(__dirname, filename),
    path.join(process.cwd(), 'json', filename),
    path.join(process.cwd(), filename)
  ];
  for (const c of candidates) {
    if (fs.existsSync(c)) return c;
  }
  return path.join(__dirname, '../json', filename);
}

function parseFirestore(doc) {
  const vals = doc.fields?.data?.arrayValue?.values || [];
  return vals.map((v, idx) => {
    const f = v.mapValue.fields;
    const obj = { _idx: idx };
    for (const k in f) {
      if (f[k].stringValue !== undefined) obj[k] = f[k].stringValue;
      else if (f[k].integerValue !== undefined) obj[k] = parseInt(f[k].integerValue);
      else if (f[k].booleanValue !== undefined) obj[k] = f[k].booleanValue;
      else if (f[k].mapValue !== undefined) obj[k] = f[k].mapValue;
      else if (f[k].arrayValue !== undefined) obj[k] = f[k].arrayValue;
    }
    return obj;
  });
}

async function getLiveDoc(docId) {
  return new Promise((resolve, reject) => {
    https.get('https://firestore.googleapis.com/v1/projects/ldbaa-calificaciones/databases/(default)/documents/fixtures/' + docId + '?key=' + API_KEY, (res) => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    }).on('error', reject);
  });
}

function parseBackupFile(path) {
  const raw = fs.readFileSync(path, 'utf8');
  const d = JSON.parse(raw);
  return parseFirestore(d);
}

async function compare() {
  const pairs = [
    {
      name: 'PRIMERA',
      id: 'jyic2A9h9G3v3iAwIYR8',
      backups: ['backup_jyic2A9h9G3v3iAwIYR8.json', 'backup_jyic2A9h9G3v3iAwIYR8_before_j7_1794543135756.json']
    },
    {
      name: 'FEMENINO',
      id: 'k5SOL1Q5cPuwHA6MMf22',
      backups: ['backup_k5SOL1Q5cPuwHA6MMf22.json', 'backup_k5SOL1Q5cPuwHA6MMf22_before_j7_1794543138254.json']
    },
    {
      name: 'MÁXIMA',
      id: 'Kjqtm2Ss23JKFicur3uw',
      backups: ['backup_Kjqtm2Ss23JKFicur3uw.json', 'backup_Kjqtm2Ss23JKFicur3uw_before_j7_1794543139574.json', 'backup_maxima_before_spencer_estudiantes_1794767310378.json']
    }
  ];

  for (const cat of pairs) {
    console.log(`\n======================================================`);
    console.log(`Checking category ${cat.name} (${cat.id})`);
    const liveDoc = await getLiveDoc(cat.id);
    const liveMatches = parseFirestore(liveDoc);

    // Collect all unique vocal reports and finalized info across all backups
    const backupDataByMatchKey = {};
    for (const bFile of cat.backups) {
      const bPath = resolveJsonPath(bFile);
      if (!fs.existsSync(bPath)) continue;
      const bMatches = parseBackupFile(bPath);
      bMatches.forEach(bm => {
        const key = `${bm.local}__vs__${bm.visitor}`.toUpperCase();
        if (bm.vocalReport || bm.isFinalized) {
          if (!backupDataByMatchKey[key]) {
            backupDataByMatchKey[key] = { backup: bPath, match: bm };
          }
        }
      });
    }

    let missingCount = 0;
    for (const [key, bObj] of Object.entries(backupDataByMatchKey)) {
      const bm = bObj.match;
      // find in live
      const liveMatch = liveMatches.find(lm => `${lm.local}__vs__${lm.visitor}`.toUpperCase() === key);
      if (!liveMatch) {
        console.log(`  [MISSING MATCH IN LIVE] ${key} from ${bObj.backup}`);
        missingCount++;
      } else {
        const liveHasVR = !!liveMatch.vocalReport;
        const liveIsFin = !!liveMatch.isFinalized;
        const bHasVR = !!bm.vocalReport;
        const bIsFin = !!bm.isFinalized;

        if (bHasVR && !liveHasVR) {
          console.log(`  [LOST VOCAL REPORT] Idx ${liveMatch._idx}: ${key} had VR in ${bObj.backup} but not in live!`);
          missingCount++;
        }
        if (bIsFin && !liveIsFin) {
          console.log(`  [LOST FINALIZED] Idx ${liveMatch._idx}: ${key} was finalized in ${bObj.backup} but not in live!`);
          missingCount++;
        }
      }
    }

    if (missingCount === 0) {
      console.log(`  -> ALL backup vocal reports and finalized statuses are fully intact in live!`);
    } else {
      console.log(`  -> Detected ${missingCount} discrepancies between backup and live!`);
    }
  }
}

compare().catch(console.error);
