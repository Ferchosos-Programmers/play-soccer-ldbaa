const https = require('https');
const fs = require('fs');

const API_KEY = "AIzaSyAzRTlx96sL8rxcgLauftrTWpr5VlwjV00";
const DOC_URL = `https://firestore.googleapis.com/v1/projects/ldbaa-calificaciones/databases/(default)/documents/fixtures/Kjqtm2Ss23JKFicur3uw?key=${API_KEY}`;
const PATCH_URL = `https://firestore.googleapis.com/v1/projects/ldbaa-calificaciones/databases/(default)/documents/fixtures/Kjqtm2Ss23JKFicur3uw?updateMask.fieldPaths=data&updateMask.fieldPaths=updatedAt&key=${API_KEY}`;

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
  console.log("1. Obteniendo documento Kjqtm2Ss23JKFicur3uw...");
  const getRes = await request(DOC_URL, { method: 'GET' });
  if (getRes.status !== 200) {
    console.error("Error al obtener doc:", getRes);
    return;
  }

  const doc = getRes.body;
  fs.writeFileSync('backup_Kjqtm2Ss23JKFicur3uw.json', JSON.stringify(doc, null, 2));
  console.log("Backup guardado con éxito.");

  const values = doc.fields.data.arrayValue.values;
  console.log(`Total partidos en data: ${values.length}`);

  // Verificar idx 4 (Facturado - debe quedarse)
  const m4Fields = values[4].mapValue.fields;
  console.log(`Idx 4: ${m4Fields.local.stringValue} vs ${m4Fields.visitor.stringValue} | J${m4Fields.jornada.integerValue} | Facturado: ${!!(m4Fields.billingLocal || m4Fields.billingVisitor)}`);

  // Verificar idx 49 (No facturado - debe salir de J5)
  const m49Fields = values[49].mapValue.fields;
  console.log(`Idx 49 antes: ${m49Fields.local.stringValue} vs ${m49Fields.visitor.stringValue} | J${m49Fields.jornada.integerValue} | hora: ${m49Fields.horaRealAsignada?.stringValue}`);

  // Modificar idx 49 para desprogramarlo de J5 y devolverlo a su jornada original 14 (Etapa 10)
  m49Fields.jornada = { integerValue: "14" };
  m49Fields.fecha = { stringValue: "Etapa 10" };
  m49Fields.tag = { stringValue: "2da Vuelta (Fecha 1)" };
  m49Fields.etiqueta = { stringValue: "2da Vuelta (Fecha 1)" };
  delete m49Fields.fechaRealAsignadaText;
  delete m49Fields.horaRealAsignada;
  delete m49Fields.camerinoLocal;
  delete m49Fields.camerinoVisitor;
  delete m49Fields.vocalAsignado;
  delete m49Fields.veedorAsignado;
  delete m49Fields.liveStatus;

  console.log("Idx 49 modificado correctamente.");

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

  console.log("2. Enviando PATCH a Firestore...");
  const patchRes = await request(PATCH_URL, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    }
  }, patchBody);

  console.log(`Status respuesta PATCH: ${patchRes.status}`);
  if (patchRes.status === 200) {
    console.log("✅ Actualización en Firestore completada exitosamente!");
  } else {
    console.error("❌ Error en actualización:", patchRes.body || patchRes.raw);
  }
}

run().catch(console.error);

