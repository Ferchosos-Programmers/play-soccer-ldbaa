const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = "AIzaSyAzRTlx96sL8rxcgLauftrTWpr5VlwjV00";
const MAXIMA_DOC_ID = "Kjqtm2Ss23JKFicur3uw";

function request(url, options = {}, body = null) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(data);
          resolve({ status: res.statusCode, headers: res.headers, body: parsed });
        } catch (e) {
          resolve({ status: res.statusCode, headers: res.headers, raw: data });
        }
      });
    });
    req.on('error', reject);
    if (body) {
      req.write(typeof body === 'string' ? body : JSON.stringify(body));
    }
    req.end();
  });
}

async function run() {
  console.log("🚀 CARGANDO PARTIDO MÁXIMA: SPENCER VS ESTUDIANTES EN FECHA 7...");

  const docUrl = `https://firestore.googleapis.com/v1/projects/ldbaa-calificaciones/databases/(default)/documents/fixtures/${MAXIMA_DOC_ID}?key=${API_KEY}`;
  const getRes = await request(docUrl, { method: 'GET' });
  if (getRes.status !== 200) {
    throw new Error(`Error al obtener doc ${MAXIMA_DOC_ID}: status ${getRes.status}`);
  }

  const doc = getRes.body;
  const jsonDir = fs.existsSync(path.join(__dirname, '../json')) ? path.join(__dirname, '../json') : (fs.existsSync(path.join(process.cwd(), 'json')) ? path.join(process.cwd(), 'json') : __dirname);
  fs.writeFileSync(path.join(jsonDir, `backup_maxima_before_spencer_estudiantes_${Date.now()}.json`), JSON.stringify(doc, null, 2));

  const values = doc.fields.data.arrayValue.values;
  console.log(`Total de partidos en MÁXIMA: ${values.length}`);

  // Modificar Idx 8 (que era ESTUDIANTES vs DESCANSA)
  const targetMatch = values[8].mapValue.fields;
  console.log("Antes:", targetMatch.local?.stringValue, "vs", targetMatch.visitor?.stringValue, "J:", targetMatch.jornada);

  targetMatch.local = { stringValue: "SPENCER" };
  targetMatch.visitor = { stringValue: "ESTUDIANTES" };
  targetMatch.jornada = { integerValue: "7" };
  targetMatch.fecha = { stringValue: "Etapa 7" };
  targetMatch.fechaRealAsignadaText = { stringValue: "Domingo" };
  targetMatch.dia = { stringValue: "Domingo" };
  targetMatch.date = { stringValue: "2026-11-15" };
  targetMatch.horaRealAsignada = { stringValue: "13:00" };
  targetMatch.hora = { stringValue: "13:00" };
  targetMatch.time = { stringValue: "13:00" };
  targetMatch.camerinoLocal = { stringValue: "4" };
  targetMatch.camerinoVisitor = { stringValue: "2" };
  targetMatch.vocalAsignado = { stringValue: "LAKERS" };
  targetMatch.vocal = { stringValue: "LAKERS" };
  targetMatch.veedorAsignado = { stringValue: "INTER" };
  targetMatch.veedor = { stringValue: "INTER" };
  targetMatch.cancha = { stringValue: "Liga Barrial Argelia Alta" };
  targetMatch.mesa = { stringValue: "Mesa 1" };
  targetMatch.tag = { stringValue: "1ra Vuelta (Fecha 7)" };
  targetMatch.etiqueta = { stringValue: "1ra Vuelta (Fecha 7)" };
  targetMatch.isRest = { booleanValue: false };
  targetMatch.isFinalized = { booleanValue: false };
  targetMatch.matchId = { stringValue: `${MAXIMA_DOC_ID}_8_SPENCER_ESTUDIANTES` };

  delete targetMatch.isDiferido;
  delete targetMatch.diferido;
  if (targetMatch.status && targetMatch.status.stringValue === "DIFERIDO") {
    delete targetMatch.status;
  }

  console.log("Después:", targetMatch.local.stringValue, "vs", targetMatch.visitor.stringValue, "J:", targetMatch.jornada.integerValue, targetMatch.fechaRealAsignadaText.stringValue, targetMatch.horaRealAsignada.stringValue);

  // Enviar PATCH a Firestore
  const patchUrl = `https://firestore.googleapis.com/v1/projects/ldbaa-calificaciones/databases/(default)/documents/fixtures/${MAXIMA_DOC_ID}?updateMask.fieldPaths=data&updateMask.fieldPaths=updatedAt&key=${API_KEY}`;
  const patchBody = {
    fields: {
      data: {
        arrayValue: {
          values: values
        }
      },
      updatedAt: {
        timestampValue: new Date().toISOString()
      }
    }
  };

  const patchRes = await request(patchUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, patchBody);

  console.log("PATCH status:", patchRes.status);
  if (patchRes.status === 200) {
    console.log("✅ ¡PARTIDO MÁXIMA: SPENCER VS ESTUDIANTES GUARDADO EXITOSAMENTE EN FECHA 7!");
  } else {
    console.error("❌ Error en PATCH:", patchRes.body || patchRes.raw);
  }
}

run().catch(console.error);
