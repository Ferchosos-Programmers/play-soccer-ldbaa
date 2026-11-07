const https = require('https');
const fs = require('fs');

const API_KEY = "AIzaSyAzRTlx96sL8rxcgLauftrTWpr5VlwjV00";
const MAXIMA_DOC_ID = "Kjqtm2Ss23JKFicur3uw";
const PRIMERA_DOC_ID = "jyic2A9h9G3v3iAwIYR8";

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

async function updateCategory(docId, categoryName, updaterFn) {
  console.log(`\n======================================================`);
  console.log(`1. Obteniendo documento ${categoryName} (${docId})...`);
  const docUrl = `https://firestore.googleapis.com/v1/projects/ldbaa-calificaciones/databases/(default)/documents/fixtures/${docId}?key=${API_KEY}`;
  const getRes = await request(docUrl, { method: 'GET' });
  if (getRes.status !== 200) {
    throw new Error(`Error al obtener doc ${docId}: status ${getRes.status}`);
  }

  const doc = getRes.body;
  const backupName = `backup_${docId}_before_j6_${Date.now()}.json`;
  fs.writeFileSync(backupName, JSON.stringify(doc, null, 2));
  console.log(`Backup guardado en: ${backupName}`);

  const values = doc.fields.data.arrayValue.values;
  console.log(`Total de partidos en ${categoryName}: ${values.length}`);

  updaterFn(values);

  const patchUrl = `https://firestore.googleapis.com/v1/projects/ldbaa-calificaciones/databases/(default)/documents/fixtures/${docId}?updateMask.fieldPaths=data&updateMask.fieldPaths=updatedAt&key=${API_KEY}`;
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

  console.log(`2. Enviando PATCH a Firestore para ${categoryName}...`);
  const patchRes = await request(patchUrl, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json'
    }
  }, patchBody);

  console.log(`Status respuesta PATCH: ${patchRes.status}`);
  if (patchRes.status === 200) {
    console.log(`✅ ${categoryName} actualizado exitosamente en Firestore!`);
  } else {
    console.error(`❌ Error en actualización de ${categoryName}:`, patchRes.body || patchRes.raw);
    throw new Error(`PATCH failed with status ${patchRes.status}`);
  }
}

async function run() {
  console.log("🚀 INICIANDO CARGA OFICIAL FECHA 6 LDBAA 'NUEVA ERA 2026'");

  // 1. Actualizar MÁXIMA
  await updateCategory(MAXIMA_DOC_ID, "MÁXIMA", (values) => {
    // Idx 18: GALAXY vs SOLO PANAS
    // Sábado 07-11-2026, 09:40, C1 vs C3, Vocal: ALMAGUER, Veedor: LOS PRIMOS
    const f18 = values[18].mapValue.fields;
    f18.jornada = { integerValue: "6" };
    f18.fechaRealAsignadaText = { stringValue: "Sábado" };
    f18.horaRealAsignada = { stringValue: "09:40" };
    f18.camerinoLocal = { stringValue: "1" };
    f18.camerinoVisitor = { stringValue: "3" };
    f18.vocalAsignado = { stringValue: "ALMAGUER" };
    f18.veedorAsignado = { stringValue: "LOS PRIMOS" };
    console.log(`  -> Actualizado MÁXIMA Idx 18: GALAXY (C1) vs SOLO PANAS (C3) | Sábado 09:40 | Vocal: ALMAGUER | Veedor: LOS PRIMOS`);

    // Idx 19: FLUMINENSE vs ESTUDIANTES
    // Sábado 07-11-2026, 16:20, C3 vs C1, Vocal: CHELSEA, Veedor: SD ARGENTINA
    const f19 = values[19].mapValue.fields;
    f19.jornada = { integerValue: "6" };
    f19.fechaRealAsignadaText = { stringValue: "Sábado" };
    f19.horaRealAsignada = { stringValue: "16:20" };
    f19.camerinoLocal = { stringValue: "3" };
    f19.camerinoVisitor = { stringValue: "1" };
    f19.vocalAsignado = { stringValue: "CHELSEA" };
    f19.veedorAsignado = { stringValue: "SD ARGENTINA" };
    console.log(`  -> Actualizado MÁXIMA Idx 19: FLUMINENSE (C3) vs ESTUDIANTES (C1) | Sábado 16:20 | Vocal: CHELSEA | Veedor: SD ARGENTINA`);

    // Idx 17: PORTOVIEJO FC vs MANCHESTER
    // Domingo 08-11-2026, 11:20, C1 vs C3, Vocal: CD NAPOLES, Veedor: 3 DE JULIO
    const f17 = values[17].mapValue.fields;
    f17.jornada = { integerValue: "6" };
    f17.fechaRealAsignadaText = { stringValue: "Domingo" };
    f17.horaRealAsignada = { stringValue: "11:20" };
    f17.camerinoLocal = { stringValue: "1" };
    f17.camerinoVisitor = { stringValue: "3" };
    f17.vocalAsignado = { stringValue: "CD NAPOLES" };
    f17.veedorAsignado = { stringValue: "3 DE JULIO" };
    console.log(`  -> Actualizado MÁXIMA Idx 17: PORTOVIEJO FC (C1) vs MANCHESTER (C3) | Domingo 11:20 | Vocal: CD NAPOLES | Veedor: 3 DE JULIO`);

    // Idx 15: INDEPENDIENTE vs ALIANZA JUVENIL
    // Domingo 08-11-2026, 14:40, C1 vs C3, Vocal: SPENCER, Veedor: VENTANAS SC
    const f15 = values[15].mapValue.fields;
    f15.jornada = { integerValue: "6" };
    f15.fechaRealAsignadaText = { stringValue: "Domingo" };
    f15.horaRealAsignada = { stringValue: "14:40" };
    f15.camerinoLocal = { stringValue: "1" };
    f15.camerinoVisitor = { stringValue: "3" };
    f15.vocalAsignado = { stringValue: "SPENCER" };
    f15.veedorAsignado = { stringValue: "VENTANAS SC" };
    console.log(`  -> Actualizado MÁXIMA Idx 15: INDEPENDIENTE (C1) vs ALIANZA JUVENIL (C3) | Domingo 14:40 | Vocal: SPENCER | Veedor: VENTANAS SC`);

    // Idx 16: VENTANAS SC vs DESCANSA -> SPENCER
    // Domingo 08-11-2026, 16:20, C2 vs C4, Vocal: INDEPENDIENTE, Veedor: ALIANZA JUVENIL
    const f16 = values[16].mapValue.fields;
    f16.local = { stringValue: "VENTANAS SC" };
    f16.visitor = { stringValue: "SPENCER" };
    f16.tag = { stringValue: "1ra Vuelta (Fecha 4)" };
    f16.etiqueta = { stringValue: "1ra Vuelta (Fecha 4)" };
    f16.isRest = { booleanValue: false };
    f16.jornada = { integerValue: "6" };
    f16.fechaRealAsignadaText = { stringValue: "Domingo" };
    f16.horaRealAsignada = { stringValue: "16:20" };
    f16.camerinoLocal = { stringValue: "2" };
    f16.camerinoVisitor = { stringValue: "4" };
    f16.vocalAsignado = { stringValue: "INDEPENDIENTE" };
    f16.veedorAsignado = { stringValue: "ALIANZA JUVENIL" };
    console.log(`  -> Actualizado MÁXIMA Idx 16: VENTANAS SC (C2) vs SPENCER (C4) | Domingo 16:20 | Vocal: INDEPENDIENTE | Veedor: ALIANZA JUVENIL`);
  });

  // 2. Actualizar PRIMERA
  await updateCategory(PRIMERA_DOC_ID, "PRIMERA", (values) => {
    // Idx 39: ALMAGUER vs LOS PRIMOS
    // Sábado 07-11-2026, 11:20, C2 vs C4, Vocal: GALAXY, Veedor: SOLO PANAS
    const f39 = values[39].mapValue.fields;
    f39.jornada = { integerValue: "6" };
    f39.fechaRealAsignadaText = { stringValue: "Sábado" };
    f39.horaRealAsignada = { stringValue: "11:20" };
    f39.camerinoLocal = { stringValue: "2" };
    f39.camerinoVisitor = { stringValue: "4" };
    f39.vocalAsignado = { stringValue: "GALAXY" };
    f39.veedorAsignado = { stringValue: "SOLO PANAS" };
    console.log(`  -> Actualizado PRIMERA Idx 39: ALMAGUER (C2) vs LOS PRIMOS (C4) | Sábado 11:20 | Vocal: GALAXY | Veedor: SOLO PANAS`);

    // Idx 40: DINAMO vs AMAZONAS FC
    // Sábado 07-11-2026, 13:00, C3 vs C1, Vocal: RIVER PLATE, Veedor: LAKERS
    const f40 = values[40].mapValue.fields;
    f40.jornada = { integerValue: "6" };
    f40.fechaRealAsignadaText = { stringValue: "Sábado" };
    f40.horaRealAsignada = { stringValue: "13:00" };
    f40.camerinoLocal = { stringValue: "3" };
    f40.camerinoVisitor = { stringValue: "1" };
    f40.vocalAsignado = { stringValue: "RIVER PLATE" };
    f40.veedorAsignado = { stringValue: "LAKERS" };
    console.log(`  -> Actualizado PRIMERA Idx 40: DINAMO (C3) vs AMAZONAS FC (C1) | Sábado 13:00 | Vocal: RIVER PLATE | Veedor: LAKERS`);

    // Idx 38: RIVER PLATE vs LAKERS
    // Sábado 07-11-2026, 14:40, C4 vs C2, Vocal: DINAMO, Veedor: AMAZONAS FC
    const f38 = values[38].mapValue.fields;
    f38.jornada = { integerValue: "6" };
    f38.fechaRealAsignadaText = { stringValue: "Sábado" };
    f38.horaRealAsignada = { stringValue: "14:40" };
    f38.camerinoLocal = { stringValue: "4" };
    f38.camerinoVisitor = { stringValue: "2" };
    f38.vocalAsignado = { stringValue: "DINAMO" };
    f38.veedorAsignado = { stringValue: "AMAZONAS FC" };
    console.log(`  -> Actualizado PRIMERA Idx 38: RIVER PLATE (C4) vs LAKERS (C2) | Sábado 14:40 | Vocal: DINAMO | Veedor: AMAZONAS FC`);

    // Idx 37: CHELSEA vs SD ARGENTINA
    // Sábado 07-11-2026, 18:00, C2 vs C4, Vocal: FLUMINENSE, Veedor: ESTUDIANTES
    const f37 = values[37].mapValue.fields;
    f37.jornada = { integerValue: "6" };
    f37.fechaRealAsignadaText = { stringValue: "Sábado" };
    f37.horaRealAsignada = { stringValue: "18:00" };
    f37.camerinoLocal = { stringValue: "2" };
    f37.camerinoVisitor = { stringValue: "4" };
    f37.vocalAsignado = { stringValue: "FLUMINENSE" };
    f37.veedorAsignado = { stringValue: "ESTUDIANTES" };
    console.log(`  -> Actualizado PRIMERA Idx 37: CHELSEA (C2) vs SD ARGENTINA (C4) | Sábado 18:00 | Vocal: FLUMINENSE | Veedor: ESTUDIANTES`);

    // Idx 35: AC LATINOS vs MARSELLA FC
    // Domingo 08-11-2026, 08:00, C1 vs C3, Vocal: INTER, Veedor: PALMEIRAS
    const f35 = values[35].mapValue.fields;
    f35.jornada = { integerValue: "6" };
    f35.fechaRealAsignadaText = { stringValue: "Domingo" };
    f35.horaRealAsignada = { stringValue: "08:00" };
    f35.camerinoLocal = { stringValue: "1" };
    f35.camerinoVisitor = { stringValue: "3" };
    f35.vocalAsignado = { stringValue: "INTER" };
    f35.veedorAsignado = { stringValue: "PALMEIRAS" };
    console.log(`  -> Actualizado PRIMERA Idx 35: AC LATINOS (C1) vs MARSELLA FC (C3) | Domingo 08:00 | Vocal: INTER | Veedor: PALMEIRAS`);

    // Idx 36: INTER vs PALMEIRAS
    // Domingo 08-11-2026, 09:40, C2 vs C4, Vocal: AC LATINOS, Veedor: MARSELLA FC
    const f36 = values[36].mapValue.fields;
    f36.jornada = { integerValue: "6" };
    f36.fechaRealAsignadaText = { stringValue: "Domingo" };
    f36.horaRealAsignada = { stringValue: "09:40" };
    f36.camerinoLocal = { stringValue: "2" };
    f36.camerinoVisitor = { stringValue: "4" };
    f36.vocalAsignado = { stringValue: "AC LATINOS" };
    f36.veedorAsignado = { stringValue: "MARSELLA FC" };
    console.log(`  -> Actualizado PRIMERA Idx 36: INTER (C2) vs PALMEIRAS (C4) | Domingo 09:40 | Vocal: AC LATINOS | Veedor: MARSELLA FC`);

    // Idx 41: 3 DE JULIO vs CD NAPOLES
    // Domingo 08-11-2026, 13:00, C2 vs C4, Vocal: PORTOVIEJO FC, Veedor: MANCHESTER
    const f41 = values[41].mapValue.fields;
    f41.jornada = { integerValue: "6" };
    f41.fechaRealAsignadaText = { stringValue: "Domingo" };
    f41.horaRealAsignada = { stringValue: "13:00" };
    f41.camerinoLocal = { stringValue: "2" };
    f41.camerinoVisitor = { stringValue: "4" };
    f41.vocalAsignado = { stringValue: "PORTOVIEJO FC" };
    f41.veedorAsignado = { stringValue: "MANCHESTER" };
    console.log(`  -> Actualizado PRIMERA Idx 41: 3 DE JULIO (C2) vs CD NAPOLES (C4) | Domingo 13:00 | Vocal: PORTOVIEJO FC | Veedor: MANCHESTER`);
  });

  console.log("\n🎉 ¡TODOS LOS PARTIDOS DE LA FECHA 6 HAN SIDO CARGADOS EXITOSAMENTE!");
}

run().catch(console.error);

