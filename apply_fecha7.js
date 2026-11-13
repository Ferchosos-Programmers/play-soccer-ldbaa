const https = require('https');
const fs = require('fs');

const API_KEY = "AIzaSyAzRTlx96sL8rxcgLauftrTWpr5VlwjV00";
const MAXIMA_DOC_ID = "Kjqtm2Ss23JKFicur3uw";
const PRIMERA_DOC_ID = "jyic2A9h9G3v3iAwIYR8";
const FEMENINO_DOC_ID = "k5SOL1Q5cPuwHA6MMf22";

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
  const backupName = `backup_${docId}_before_j7_${Date.now()}.json`;
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
  console.log("🚀 INICIANDO PROGRAMACIÓN OFICIAL FECHA 7 & LIMPIEZA DE FECHA 8");

  // 1. PRIMERA
  await updateCategory(PRIMERA_DOC_ID, "PRIMERA", (values) => {
    // Sábado 14-11-2026
    // Idx 48: DINAMO vs 3 DE JULIO | 11:20 | C2 vs C4 | Vocal: MANCHESTER | Veedor: PALMEIRAS
    const f48 = values[48].mapValue.fields;
    f48.jornada = { integerValue: "7" };
    f48.fechaRealAsignadaText = { stringValue: "Sábado" };
    f48.horaRealAsignada = { stringValue: "11:20" };
    f48.camerinoLocal = { stringValue: "2" };
    f48.camerinoVisitor = { stringValue: "4" };
    f48.vocalAsignado = { stringValue: "MANCHESTER" };
    f48.veedorAsignado = { stringValue: "PALMEIRAS" };
    f48.tag = { stringValue: "1ra Vuelta (Fecha 7)" };
    f48.etiqueta = { stringValue: "1ra Vuelta (Fecha 7)" };
    delete f48.isDiferido;
    delete f48.diferido;
    if (f48.status && f48.status.stringValue === "DIFERIDO") delete f48.status;
    console.log(`  -> Actualizado PRIMERA Idx 48: DINAMO (C2) vs 3 DE JULIO (C4) | Sábado 11:20 | Vocal: MANCHESTER | Veedor: PALMEIRAS`);

    // Idx 47: ALMAGUER vs CD NAPOLES | 13:00 | C1 vs C3 | Vocal: 3 DE JULIO | Veedor: DINAMO
    const f47 = values[47].mapValue.fields;
    f47.jornada = { integerValue: "7" };
    f47.fechaRealAsignadaText = { stringValue: "Sábado" };
    f47.horaRealAsignada = { stringValue: "13:00" };
    f47.camerinoLocal = { stringValue: "1" };
    f47.camerinoVisitor = { stringValue: "3" };
    f47.vocalAsignado = { stringValue: "3 DE JULIO" };
    f47.veedorAsignado = { stringValue: "DINAMO" };
    f47.tag = { stringValue: "1ra Vuelta (Fecha 7)" };
    f47.etiqueta = { stringValue: "1ra Vuelta (Fecha 7)" };
    delete f47.isDiferido;
    delete f47.diferido;
    if (f47.status && f47.status.stringValue === "DIFERIDO") delete f47.status;
    console.log(`  -> Actualizado PRIMERA Idx 47: ALMAGUER (C1) vs CD NAPOLES (C3) | Sábado 13:00 | Vocal: 3 DE JULIO | Veedor: DINAMO`);

    // Idx 45: CHELSEA vs LOS PRIMOS | 18:00 | C4 vs C2 | Vocal: DEP SPENCER | Veedor: CD SPENCER
    const f45 = values[45].mapValue.fields;
    f45.jornada = { integerValue: "7" };
    f45.fechaRealAsignadaText = { stringValue: "Sábado" };
    f45.horaRealAsignada = { stringValue: "18:00" };
    f45.camerinoLocal = { stringValue: "4" };
    f45.camerinoVisitor = { stringValue: "2" };
    f45.vocalAsignado = { stringValue: "DEP SPENCER" };
    f45.veedorAsignado = { stringValue: "CD SPENCER" };
    f45.tag = { stringValue: "1ra Vuelta (Fecha 7)" };
    f45.etiqueta = { stringValue: "1ra Vuelta (Fecha 7)" };
    delete f45.isDiferido;
    delete f45.diferido;
    if (f45.status && f45.status.stringValue === "DIFERIDO") delete f45.status;
    console.log(`  -> Actualizado PRIMERA Idx 45: CHELSEA (C4) vs LOS PRIMOS (C2) | Sábado 18:00 | Vocal: DEP SPENCER | Veedor: CD SPENCER`);

    // Domingo 15-11-2026
    // Idx 43: MARSELLA FC vs SD ARGENTINA | 08:00 | C3 vs C1 | Vocal: AMAZONAS FC | Veedor: RIVER PLATE
    const f43 = values[43].mapValue.fields;
    f43.jornada = { integerValue: "7" };
    f43.fechaRealAsignadaText = { stringValue: "Domingo" };
    f43.horaRealAsignada = { stringValue: "08:00" };
    f43.camerinoLocal = { stringValue: "3" };
    f43.camerinoVisitor = { stringValue: "1" };
    f43.vocalAsignado = { stringValue: "AMAZONAS FC" };
    f43.veedorAsignado = { stringValue: "RIVER PLATE" };
    f43.tag = { stringValue: "1ra Vuelta (Fecha 7)" };
    f43.etiqueta = { stringValue: "1ra Vuelta (Fecha 7)" };
    delete f43.isDiferido;
    delete f43.diferido;
    if (f43.status && f43.status.stringValue === "DIFERIDO") delete f43.status;
    console.log(`  -> Actualizado PRIMERA Idx 43: MARSELLA FC (C3) vs SD ARGENTINA (C1) | Domingo 08:00 | Vocal: AMAZONAS FC | Veedor: RIVER PLATE`);

    // Idx 42: AC LATINOS vs PALMEIRAS | 09:40 | C2 vs C4 | Vocal: MARSELLA FC | Veedor: SD ARGENTINA
    const f42 = values[42].mapValue.fields;
    f42.jornada = { integerValue: "7" };
    f42.fechaRealAsignadaText = { stringValue: "Domingo" };
    f42.horaRealAsignada = { stringValue: "09:40" };
    f42.camerinoLocal = { stringValue: "2" };
    f42.camerinoVisitor = { stringValue: "4" };
    f42.vocalAsignado = { stringValue: "MARSELLA FC" };
    f42.veedorAsignado = { stringValue: "SD ARGENTINA" };
    f42.tag = { stringValue: "1ra Vuelta (Fecha 7)" };
    f42.etiqueta = { stringValue: "1ra Vuelta (Fecha 7)" };
    delete f42.isDiferido;
    delete f42.diferido;
    if (f42.status && f42.status.stringValue === "DIFERIDO") delete f42.status;
    console.log(`  -> Actualizado PRIMERA Idx 42: AC LATINOS (C2) vs PALMEIRAS (C4) | Domingo 09:40 | Vocal: MARSELLA FC | Veedor: SD ARGENTINA`);

    // Idx 46: RIVER PLATE vs AMAZONAS FC | 11:20 | C3 vs C1 | Vocal: PALMEIRAS | Veedor: AC LATINOS
    const f46 = values[46].mapValue.fields;
    f46.jornada = { integerValue: "7" };
    f46.fechaRealAsignadaText = { stringValue: "Domingo" };
    f46.horaRealAsignada = { stringValue: "11:20" };
    f46.camerinoLocal = { stringValue: "3" };
    f46.camerinoVisitor = { stringValue: "1" };
    f46.vocalAsignado = { stringValue: "PALMEIRAS" };
    f46.veedorAsignado = { stringValue: "AC LATINOS" };
    f46.tag = { stringValue: "1ra Vuelta (Fecha 7)" };
    f46.etiqueta = { stringValue: "1ra Vuelta (Fecha 7)" };
    delete f46.isDiferido;
    delete f46.diferido;
    if (f46.status && f46.status.stringValue === "DIFERIDO") delete f46.status;
    console.log(`  -> Actualizado PRIMERA Idx 46: RIVER PLATE (C3) vs AMAZONAS FC (C1) | Domingo 11:20 | Vocal: PALMEIRAS | Veedor: AC LATINOS`);

    // Idx 44: INTER vs LAKERS | 14:40 | C3 vs C1 | Vocal: ESTUDIANTES | Veedor: SPENCER
    const f44 = values[44].mapValue.fields;
    f44.jornada = { integerValue: "7" };
    f44.fechaRealAsignadaText = { stringValue: "Domingo" };
    f44.horaRealAsignada = { stringValue: "14:40" };
    f44.camerinoLocal = { stringValue: "3" };
    f44.camerinoVisitor = { stringValue: "1" };
    f44.vocalAsignado = { stringValue: "ESTUDIANTES" };
    f44.veedorAsignado = { stringValue: "SPENCER" };
    f44.tag = { stringValue: "1ra Vuelta (Fecha 7)" };
    f44.etiqueta = { stringValue: "1ra Vuelta (Fecha 7)" };
    delete f44.isDiferido;
    delete f44.diferido;
    if (f44.status && f44.status.stringValue === "DIFERIDO") delete f44.status;
    console.log(`  -> Actualizado PRIMERA Idx 44: INTER (C3) vs LAKERS (C1) | Domingo 14:40 | Vocal: ESTUDIANTES | Veedor: SPENCER`);

    // Limpieza de cualquier partido en J8 o mayor que tenga hora asignada
    values.forEach((v, idx) => {
      const f = v.mapValue.fields;
      const j = parseInt(f.jornada ? (f.jornada.integerValue || f.jornada.stringValue) : "0", 10);
      if (j >= 8) {
        if (f.horaRealAsignada && f.horaRealAsignada.stringValue) {
          console.log(`  ⚠️ Limpiando programación prematura de PRIMERA Idx ${idx} (J${j}): ${f.local?.stringValue} vs ${f.visitor?.stringValue}`);
          f.horaRealAsignada = { stringValue: "" };
          f.fechaRealAsignadaText = { stringValue: "" };
          f.camerinoLocal = { stringValue: "" };
          f.camerinoVisitor = { stringValue: "" };
          f.vocalAsignado = { stringValue: "" };
          f.veedorAsignado = { stringValue: "" };
        }
      }
    });
  });

  // 2. FEMENINO
  await updateCategory(FEMENINO_DOC_ID, "FEMENINO", (values) => {
    // Sábado 14-11-2026
    // Idx 15: PALMEIRAS vs MANCHESTER | 14:40 | C2 vs C4 | Vocal: CD NAPOLES | Veedor: ALMAGUER
    const f15 = values[15].mapValue.fields;
    f15.jornada = { integerValue: "7" };
    f15.fechaRealAsignadaText = { stringValue: "Sábado" };
    f15.horaRealAsignada = { stringValue: "14:40" };
    f15.camerinoLocal = { stringValue: "2" };
    f15.camerinoVisitor = { stringValue: "4" };
    f15.vocalAsignado = { stringValue: "CD NAPOLES" };
    f15.veedorAsignado = { stringValue: "ALMAGUER" };
    f15.tag = { stringValue: "1ra Vuelta (Fecha 4)" };
    f15.etiqueta = { stringValue: "1ra Vuelta (Fecha 4)" };
    delete f15.isDiferido;
    delete f15.diferido;
    if (f15.status && f15.status.stringValue === "DIFERIDO") delete f15.status;
    console.log(`  -> Actualizado FEMENINO Idx 15: PALMEIRAS (C2) vs MANCHESTER (C4) | Sábado 14:40 | Vocal: CD NAPOLES | Veedor: ALMAGUER`);

    // Idx 18: DEP SPENCER vs CD SPENCER | 16:20 | C1 vs C3 | Vocal: LOS PRIMOS | Veedor: CHELSEA
    const f18 = values[18].mapValue.fields;
    f18.jornada = { integerValue: "7" };
    f18.fechaRealAsignadaText = { stringValue: "Sábado" };
    f18.horaRealAsignada = { stringValue: "16:20" };
    f18.camerinoLocal = { stringValue: "1" };
    f18.camerinoVisitor = { stringValue: "3" };
    f18.vocalAsignado = { stringValue: "LOS PRIMOS" };
    f18.veedorAsignado = { stringValue: "CHELSEA" };
    f18.tag = { stringValue: "1ra Vuelta (Fecha 4)" };
    f18.etiqueta = { stringValue: "1ra Vuelta (Fecha 4)" };
    delete f18.isDiferido;
    delete f18.diferido;
    if (f18.status && f18.status.stringValue === "DIFERIDO") delete f18.status;
    console.log(`  -> Actualizado FEMENINO Idx 18: DEP SPENCER (C1) vs CD SPENCER (C3) | Sábado 16:20 | Vocal: LOS PRIMOS | Veedor: CHELSEA`);

    // Limpiar partidos que no están en la imagen oficial de Fecha 7
    // Idx 17: PORTOVIEJO FC vs CHELSEA
    const f17 = values[17].mapValue.fields;
    f17.horaRealAsignada = { stringValue: "" };
    f17.fechaRealAsignadaText = { stringValue: "" };
    f17.camerinoLocal = { stringValue: "" };
    f17.camerinoVisitor = { stringValue: "" };
    f17.vocalAsignado = { stringValue: "" };
    f17.veedorAsignado = { stringValue: "" };
    console.log(`  -> Limpiado FEMENINO Idx 17: PORTOVIEJO FC vs CHELSEA (no programado en Fecha 7)`);

    // Idx 19: VENTANAS SC vs ALIANZA JUVENIL
    const f19 = values[19].mapValue.fields;
    f19.horaRealAsignada = { stringValue: "" };
    f19.fechaRealAsignadaText = { stringValue: "" };
    f19.camerinoLocal = { stringValue: "" };
    f19.camerinoVisitor = { stringValue: "" };
    f19.vocalAsignado = { stringValue: "" };
    f19.veedorAsignado = { stringValue: "" };
    console.log(`  -> Limpiado FEMENINO Idx 19: VENTANAS SC vs ALIANZA JUVENIL (no programado en Fecha 7)`);

    // Limpieza de cualquier otro partido en J8 o mayor que tenga hora asignada
    values.forEach((v, idx) => {
      const f = v.mapValue.fields;
      const j = parseInt(f.jornada ? (f.jornada.integerValue || f.jornada.stringValue) : "0", 10);
      if (j >= 8) {
        if (f.horaRealAsignada && f.horaRealAsignada.stringValue) {
          console.log(`  ⚠️ Limpiando programación prematura de FEMENINO Idx ${idx} (J${j}): ${f.local?.stringValue} vs ${f.visitor?.stringValue}`);
          f.horaRealAsignada = { stringValue: "" };
          f.fechaRealAsignadaText = { stringValue: "" };
          f.camerinoLocal = { stringValue: "" };
          f.camerinoVisitor = { stringValue: "" };
          f.vocalAsignado = { stringValue: "" };
          f.veedorAsignado = { stringValue: "" };
        }
      }
    });
  });

  // 3. MÁXIMA
  await updateCategory(MAXIMA_DOC_ID, "MÁXIMA", (values) => {
    // 3.1. Idx 8: SPENCER vs ESTUDIANTES (reemplaza ESTUDIANTES vs DESCANSA)
    // Domingo 15-11-2026 | 13:00 | C4 vs C2 | Vocal: LAKERS | Veedor: INTER
    const f8 = values[8].mapValue.fields;
    f8.local = { stringValue: "SPENCER" };
    f8.visitor = { stringValue: "ESTUDIANTES" };
    f8.isRest = { booleanValue: false };
    f8.jornada = { integerValue: "7" };
    f8.fechaRealAsignadaText = { stringValue: "Domingo" };
    f8.horaRealAsignada = { stringValue: "13:00" };
    f8.camerinoLocal = { stringValue: "4" };
    f8.camerinoVisitor = { stringValue: "2" };
    f8.vocalAsignado = { stringValue: "LAKERS" };
    f8.veedorAsignado = { stringValue: "INTER" };
    f8.tag = { stringValue: "1ra Vuelta (Fecha 7)" };
    f8.etiqueta = { stringValue: "1ra Vuelta (Fecha 7)" };
    f8.matchId = { stringValue: `${MAXIMA_DOC_ID}_8_SPENCER_ESTUDIANTES` };
    delete f8.isDiferido;
    delete f8.diferido;
    if (f8.status && f8.status.stringValue === "DIFERIDO") delete f8.status;
    console.log(`  -> Actualizado MÁXIMA Idx 8: SPENCER (C4) vs ESTUDIANTES (C2) | Domingo 13:00 | Vocal: LAKERS | Veedor: INTER`);

    // 3.2. Idx 4: SPENCER vs MANCHESTER (fue jugado en Fecha 5, tenía erróneamente J8)
    const f4 = values[4].mapValue.fields;
    f4.jornada = { integerValue: "5" };
    f4.tag = { stringValue: "1ra Vuelta (Fecha 5)" };
    f4.etiqueta = { stringValue: "1ra Vuelta (Fecha 5)" };
    console.log(`  -> Corregido MÁXIMA Idx 4: SPENCER vs MANCHESTER reubicado de J8 a J5 (Fecha 5 oficial jugada)`);

    // 3.3. Asegurar que NINGÚN partido en MÁXIMA quede con J8 programado
    values.forEach((v, idx) => {
      const f = v.mapValue.fields;
      const j = parseInt(f.jornada ? (f.jornada.integerValue || f.jornada.stringValue) : "0", 10);
      if (j >= 8) {
        if (f.horaRealAsignada && f.horaRealAsignada.stringValue) {
          console.log(`  ⚠️ Limpiando programación prematura de MÁXIMA Idx ${idx} (J${j}): ${f.local?.stringValue} vs ${f.visitor?.stringValue}`);
          f.horaRealAsignada = { stringValue: "" };
          f.fechaRealAsignadaText = { stringValue: "" };
          f.camerinoLocal = { stringValue: "" };
          f.camerinoVisitor = { stringValue: "" };
          f.vocalAsignado = { stringValue: "" };
          f.veedorAsignado = { stringValue: "" };
        }
      }
    });
  });

  console.log("\n🎉 ¡PROGRAMACIÓN OFICIAL FECHA 7 FINALIZADA CON ÉXITO!");
}

run().catch(console.error);

