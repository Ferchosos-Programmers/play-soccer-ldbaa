const https = require('https');
const fs = require('fs');
const path = require('path');

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

const API_KEY = "AIzaSyAzRTlx96sL8rxcgLauftrTWpr5VlwjV00";
const PRIMERA_ID = "jyic2A9h9G3v3iAwIYR8";
const FEMENINO_ID = "k5SOL1Q5cPuwHA6MMf22";
const MAXIMA_ID = "Kjqtm2Ss23JKFicur3uw";

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

async function getDoc(docId) {
  const url = `https://firestore.googleapis.com/v1/projects/ldbaa-calificaciones/databases/(default)/documents/fixtures/${docId}?key=${API_KEY}`;
  const res = await request(url, { method: 'GET' });
  if (res.status !== 200) {
    throw new Error(`Failed to get doc ${docId}, status: ${res.status}`);
  }
  return res.body;
}

async function patchDoc(docId, values) {
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

  const res = await request(patchUrl, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' }
  }, patchBody);

  if (res.status !== 200) {
    throw new Error(`Failed to patch doc ${docId}, status: ${res.status}, body: ${JSON.stringify(res.body || res.raw)}`);
  }
  return res.body;
}

function clearScheduleFields(f) {
  f.horaRealAsignada = { stringValue: "" };
  f.hora = { stringValue: "" };
  f.time = { stringValue: "" };
  f.fechaRealAsignadaText = { stringValue: "" };
  f.dia = { stringValue: "" };
  f.date = { stringValue: "" };
  f.vocalAsignado = { stringValue: "" };
  f.vocal = { stringValue: "" };
  f.veedorAsignado = { stringValue: "" };
  f.veedor = { stringValue: "" };
  f.camerinoLocal = { stringValue: "" };
  f.camerinoVisitor = { stringValue: "" };
}

async function execute() {
  console.log("=== INICIANDO REPARACIÓN COMPLETA DE VOCALÍAS Y APLICACIÓN DE FECHA 8 ===");
  const timestamp = Date.now();

  // 1. Obtener y respaldar datos en vivo
  console.log("\n1. Descargando fixtures actuales de Firestore...");
  const docPrimera = await getDoc(PRIMERA_ID);
  const docFemenino = await getDoc(FEMENINO_ID);
  const docMaxima = await getDoc(MAXIMA_ID);

  const jsonDir = fs.existsSync(path.join(__dirname, '../json')) ? path.join(__dirname, '../json') : (fs.existsSync(path.join(process.cwd(), 'json')) ? path.join(process.cwd(), 'json') : __dirname);
  fs.writeFileSync(path.join(jsonDir, `backup_pre_fix_${PRIMERA_ID}_${timestamp}.json`), JSON.stringify(docPrimera, null, 2));
  fs.writeFileSync(path.join(jsonDir, `backup_pre_fix_${FEMENINO_ID}_${timestamp}.json`), JSON.stringify(docFemenino, null, 2));
  fs.writeFileSync(path.join(jsonDir, `backup_pre_fix_${MAXIMA_ID}_${timestamp}.json`), JSON.stringify(docMaxima, null, 2));
  console.log("✅ Respaldos de seguridad creados con éxito.");

  // =========================================================================
  // 2. PROCESAR CATEGORÍA FEMENINO
  // =========================================================================
  console.log("\n2. Procesando FEMENINO...");
  const femValues = docFemenino.fields.data.arrayValue.values;

  // 2.1 Restaurar Idx 11 (PORTOVIEJO FC vs MANCHESTER) desde backup_k5SOL1Q5cPuwHA6MMf22.json
  const bFem = JSON.parse(fs.readFileSync(resolveJsonPath('backup_k5SOL1Q5cPuwHA6MMf22.json'), 'utf8'));
  const restoredFem11 = bFem.fields.data.arrayValue.values[11];
  console.log(`  -> Restaurando Idx 11: ${restoredFem11.mapValue.fields.local?.stringValue} vs ${restoredFem11.mapValue.fields.visitor?.stringValue} con vocalía guardada.`);
  femValues[11] = restoredFem11;

  // 2.2 Limpiar programación en Idx 41 (ALIANZA JUVENIL vs DEP SPENCER) y cualquier jornada > 8
  femValues.forEach((v, idx) => {
    const f = v.mapValue.fields;
    const j = parseInt(f.jornada?.integerValue || f.jornada?.stringValue) || 0;
    if (idx === 41 || j > 8) {
      if (f.horaRealAsignada?.stringValue || f.fechaRealAsignadaText?.stringValue) {
        console.log(`  -> Limpiando programación huérfana en FEMENINO Idx ${idx} (J${j}): ${f.local?.stringValue} vs ${f.visitor?.stringValue}`);
        clearScheduleFields(f);
      }
    }
  });

  // Guardar FEMENINO
  await patchDoc(FEMENINO_ID, femValues);
  console.log("✅ FEMENINO actualizado y guardado correctamente en Firestore.");

  // =========================================================================
  // 3. PROCESAR CATEGORÍA MÁXIMA
  // =========================================================================
  console.log("\n3. Procesando MÁXIMA...");
  const maxValues = docMaxima.fields.data.arrayValue.values;

  // 3.1 Restaurar Idx 4 (SPENCER vs MANCHESTER de Fecha 5) desde backup_Kjqtm2Ss23JKFicur3uw.json
  const bMax = JSON.parse(fs.readFileSync(resolveJsonPath('backup_Kjqtm2Ss23JKFicur3uw.json'), 'utf8'));
  const restoredMax4 = bMax.fields.data.arrayValue.values[4];
  console.log(`  -> Restaurando Idx 4 (Fecha 5): ${restoredMax4.mapValue.fields.local?.stringValue} vs ${restoredMax4.mapValue.fields.visitor?.stringValue} con vocalía completa, reporte y marcador ${restoredMax4.mapValue.fields.golesLocal?.integerValue}-${restoredMax4.mapValue.fields.golesVisitor?.integerValue}.`);
  maxValues[4] = restoredMax4;

  // 3.2 Corregir Idx 8 (SPENCER vs ESTUDIANTES de Fecha 7)
  const m8 = maxValues[8].mapValue.fields;
  console.log(`  -> Corrigiendo Idx 8: ${m8.local?.stringValue} vs ${m8.visitor?.stringValue} (estaba en J${m8.jornada?.integerValue || m8.jornada?.stringValue}) -> Asignando a JORNADA 7`);
  m8.jornada = { integerValue: "7" };
  m8.fecha = { stringValue: "Etapa 7" };
  m8.tag = { stringValue: "1ra Vuelta (Fecha 7)" };
  m8.etiqueta = { stringValue: "1ra Vuelta (Fecha 7)" };
  m8.fechaRealAsignadaText = { stringValue: "Domingo" };
  m8.dia = { stringValue: "Domingo" };
  m8.date = { stringValue: "2026-11-15" };
  m8.horaRealAsignada = { stringValue: "13:00" };
  m8.hora = { stringValue: "13:00" };
  m8.time = { stringValue: "13:00" };
  m8.camerinoLocal = { stringValue: "4" };
  m8.camerinoVisitor = { stringValue: "2" };
  m8.vocalAsignado = { stringValue: "LAKERS" };
  m8.vocal = { stringValue: "LAKERS" };
  m8.veedorAsignado = { stringValue: "INTER" };
  m8.veedor = { stringValue: "INTER" };

  // 3.3 Programar los 5 partidos oficiales de FECHA 8 en MÁXIMA
  // 1) Sábado 09:40 | ALIANZA JUVENIL (C3) vs MANCHESTER (C1) | Vocal: MARSELLA FC | Veedor: LOS PRIMOS
  const m21 = maxValues[21].mapValue.fields;
  m21.local = { stringValue: "ALIANZA JUVENIL" };
  m21.visitor = { stringValue: "MANCHESTER" };
  m21.jornada = { integerValue: "8" };
  m21.fecha = { stringValue: "Etapa 8" };
  m21.tag = { stringValue: "1ra Vuelta (Fecha 8)" };
  m21.etiqueta = { stringValue: "1ra Vuelta (Fecha 8)" };
  m21.fechaRealAsignadaText = { stringValue: "Sábado" };
  m21.dia = { stringValue: "Sábado" };
  m21.date = { stringValue: "2026-11-21" };
  m21.horaRealAsignada = { stringValue: "09:40" };
  m21.hora = { stringValue: "09:40" };
  m21.time = { stringValue: "09:40" };
  m21.camerinoLocal = { stringValue: "3" };
  m21.camerinoVisitor = { stringValue: "1" };
  m21.vocalAsignado = { stringValue: "MARSELLA FC" };
  m21.vocal = { stringValue: "MARSELLA FC" };
  m21.veedorAsignado = { stringValue: "LOS PRIMOS" };
  m21.veedor = { stringValue: "LOS PRIMOS" };
  m21.cancha = { stringValue: "Liga Barrial Argelia Alta" };
  m21.mesa = { stringValue: "Mesa 1" };
  m21.isRest = { booleanValue: false };

  // 2) Sábado 14:40 | VENTANAS SC (C2) vs SOLO PANAS (C4) | Vocal: ALMAGUER | Veedor: DINAMO
  const m22 = maxValues[22].mapValue.fields;
  m22.local = { stringValue: "VENTANAS SC" };
  m22.visitor = { stringValue: "SOLO PANAS" };
  m22.jornada = { integerValue: "8" };
  m22.fecha = { stringValue: "Etapa 8" };
  m22.tag = { stringValue: "1ra Vuelta (Fecha 8)" };
  m22.etiqueta = { stringValue: "1ra Vuelta (Fecha 8)" };
  m22.fechaRealAsignadaText = { stringValue: "Sábado" };
  m22.dia = { stringValue: "Sábado" };
  m22.date = { stringValue: "2026-11-21" };
  m22.horaRealAsignada = { stringValue: "14:40" };
  m22.hora = { stringValue: "14:40" };
  m22.time = { stringValue: "14:40" };
  m22.camerinoLocal = { stringValue: "2" };
  m22.camerinoVisitor = { stringValue: "4" };
  m22.vocalAsignado = { stringValue: "ALMAGUER" };
  m22.vocal = { stringValue: "ALMAGUER" };
  m22.veedorAsignado = { stringValue: "DINAMO" };
  m22.veedor = { stringValue: "DINAMO" };
  m22.cancha = { stringValue: "Liga Barrial Argelia Alta" };
  m22.mesa = { stringValue: "Mesa 1" };
  m22.isRest = { booleanValue: false };

  // 3) Sábado 18:00 | PORTOVIEJO FC (C4) vs ESTUDIANTES (C2) | Vocal: AC LATINOS | Veedor: SD ARGENTINA
  const m23 = maxValues[23].mapValue.fields;
  m23.local = { stringValue: "PORTOVIEJO FC" };
  m23.visitor = { stringValue: "ESTUDIANTES" };
  m23.jornada = { integerValue: "8" };
  m23.fecha = { stringValue: "Etapa 8" };
  m23.tag = { stringValue: "1ra Vuelta (Fecha 8)" };
  m23.etiqueta = { stringValue: "1ra Vuelta (Fecha 8)" };
  m23.fechaRealAsignadaText = { stringValue: "Sábado" };
  m23.dia = { stringValue: "Sábado" };
  m23.date = { stringValue: "2026-11-21" };
  m23.horaRealAsignada = { stringValue: "18:00" };
  m23.hora = { stringValue: "18:00" };
  m23.time = { stringValue: "18:00" };
  m23.camerinoLocal = { stringValue: "4" };
  m23.camerinoVisitor = { stringValue: "2" };
  m23.vocalAsignado = { stringValue: "AC LATINOS" };
  m23.vocal = { stringValue: "AC LATINOS" };
  m23.veedorAsignado = { stringValue: "SD ARGENTINA" };
  m23.veedor = { stringValue: "SD ARGENTINA" };
  m23.cancha = { stringValue: "Liga Barrial Argelia Alta" };
  m23.mesa = { stringValue: "Mesa 1" };
  m23.isRest = { booleanValue: false };

  // 4) Domingo 08:00 | GALAXY (C1) vs FLUMINENSE (C3) | Vocal: PALMEIRAS | Veedor: LAKERS
  const m24 = maxValues[24].mapValue.fields;
  m24.local = { stringValue: "GALAXY" };
  m24.visitor = { stringValue: "FLUMINENSE" };
  m24.jornada = { integerValue: "8" };
  m24.fecha = { stringValue: "Etapa 8" };
  m24.tag = { stringValue: "1ra Vuelta (Fecha 8)" };
  m24.etiqueta = { stringValue: "1ra Vuelta (Fecha 8)" };
  m24.fechaRealAsignadaText = { stringValue: "Domingo" };
  m24.dia = { stringValue: "Domingo" };
  m24.date = { stringValue: "2026-11-22" };
  m24.horaRealAsignada = { stringValue: "08:00" };
  m24.hora = { stringValue: "08:00" };
  m24.time = { stringValue: "08:00" };
  m24.camerinoLocal = { stringValue: "1" };
  m24.camerinoVisitor = { stringValue: "3" };
  m24.vocalAsignado = { stringValue: "PALMEIRAS" };
  m24.vocal = { stringValue: "PALMEIRAS" };
  m24.veedorAsignado = { stringValue: "LAKERS" };
  m24.veedor = { stringValue: "LAKERS" };
  m24.cancha = { stringValue: "Liga Barrial Argelia Alta" };
  m24.mesa = { stringValue: "Mesa 1" };
  m24.isRest = { booleanValue: false };

  // 5) Domingo 13:00 | INDEPENDIENTE (C4) vs SPENCER (C2) | Vocal: RIVER PLATE | Veedor: 3 DE JULIO
  const m20 = maxValues[20].mapValue.fields;
  m20.local = { stringValue: "INDEPENDIENTE" };
  m20.visitor = { stringValue: "SPENCER" };
  m20.jornada = { integerValue: "8" };
  m20.fecha = { stringValue: "Etapa 8" };
  m20.tag = { stringValue: "1ra Vuelta (Fecha 8)" };
  m20.etiqueta = { stringValue: "1ra Vuelta (Fecha 8)" };
  m20.fechaRealAsignadaText = { stringValue: "Domingo" };
  m20.dia = { stringValue: "Domingo" };
  m20.date = { stringValue: "2026-11-22" };
  m20.horaRealAsignada = { stringValue: "13:00" };
  m20.hora = { stringValue: "13:00" };
  m20.time = { stringValue: "13:00" };
  m20.camerinoLocal = { stringValue: "4" };
  m20.camerinoVisitor = { stringValue: "2" };
  m20.vocalAsignado = { stringValue: "RIVER PLATE" };
  m20.vocal = { stringValue: "RIVER PLATE" };
  m20.veedorAsignado = { stringValue: "3 DE JULIO" };
  m20.veedor = { stringValue: "3 DE JULIO" };
  m20.cancha = { stringValue: "Liga Barrial Argelia Alta" };
  m20.mesa = { stringValue: "Mesa 1" };
  m20.isRest = { booleanValue: false };
  m20.matchId = { stringValue: `${MAXIMA_ID}_20_INDEPENDIENTE_SPENCER` };
  delete m20.isFinalized;
  delete m20.vocalReport;
  delete m20.refereeReport;
  delete m20.vedorReport;

  // 3.4 Limpiar programación en cualquier partido de MÁXIMA con jornada > 8
  maxValues.forEach((v, idx) => {
    const f = v.mapValue.fields;
    const j = parseInt(f.jornada?.integerValue || f.jornada?.stringValue) || 0;
    if (j > 8) {
      if (f.horaRealAsignada?.stringValue || f.fechaRealAsignadaText?.stringValue) {
        console.log(`  -> Limpiando programación huérfana en MÁXIMA Idx ${idx} (J${j}): ${f.local?.stringValue} vs ${f.visitor?.stringValue}`);
        clearScheduleFields(f);
      }
    }
  });

  // Guardar MÁXIMA
  await patchDoc(MAXIMA_ID, maxValues);
  console.log("✅ MÁXIMA actualizado y guardado correctamente en Firestore.");

  // =========================================================================
  // 4. PROCESAR CATEGORÍA PRIMERA
  // =========================================================================
  console.log("\n4. Procesando PRIMERA...");
  const priValues = docPrimera.fields.data.arrayValue.values;

  // 4.1 Asegurar los 6 partidos de FECHA 8 en PRIMERA
  // 1) Sábado 11:20 | MARSELLA FC (C2) vs LOS PRIMOS (C4) | Vocal: ALIANZA JUVENIL | Veedor: MANCHESTER -> Idx 51
  const p51 = priValues[51].mapValue.fields;
  p51.local = { stringValue: "MARSELLA FC" };
  p51.visitor = { stringValue: "LOS PRIMOS" };
  p51.jornada = { integerValue: "8" };
  p51.fechaRealAsignadaText = { stringValue: "Sábado" };
  p51.dia = { stringValue: "Sábado" };
  p51.date = { stringValue: "2026-11-21" };
  p51.horaRealAsignada = { stringValue: "11:20" };
  p51.hora = { stringValue: "11:20" };
  p51.time = { stringValue: "11:20" };
  p51.camerinoLocal = { stringValue: "2" };
  p51.camerinoVisitor = { stringValue: "4" };
  p51.vocalAsignado = { stringValue: "ALIANZA JUVENIL" };
  p51.vocal = { stringValue: "ALIANZA JUVENIL" };
  p51.veedorAsignado = { stringValue: "MANCHESTER" };
  p51.veedor = { stringValue: "MANCHESTER" };

  // 2) Sábado 13:00 | ALMAGUER (C3) vs DINAMO (C1) | Vocal: VENTANAS SC | Veedor: SOLO PANAS -> Idx 55
  const p55 = priValues[55].mapValue.fields;
  p55.local = { stringValue: "ALMAGUER" };
  p55.visitor = { stringValue: "DINAMO" };
  p55.jornada = { integerValue: "8" };
  p55.fechaRealAsignadaText = { stringValue: "Sábado" };
  p55.dia = { stringValue: "Sábado" };
  p55.date = { stringValue: "2026-11-21" };
  p55.horaRealAsignada = { stringValue: "13:00" };
  p55.hora = { stringValue: "13:00" };
  p55.time = { stringValue: "13:00" };
  p55.camerinoLocal = { stringValue: "3" };
  p55.camerinoVisitor = { stringValue: "1" };
  p55.vocalAsignado = { stringValue: "VENTANAS SC" };
  p55.vocal = { stringValue: "VENTANAS SC" };
  p55.veedorAsignado = { stringValue: "SOLO PANAS" };
  p55.veedor = { stringValue: "SOLO PANAS" };

  // 3) Sábado 16:20 | AC LATINOS (C3) vs SD ARGENTINA (C1) | Vocal: PORTOVIEJO FC | Veedor: ESTUDIANTES -> Idx 49
  const p49 = priValues[49].mapValue.fields;
  p49.local = { stringValue: "AC LATINOS" };
  p49.visitor = { stringValue: "SD ARGENTINA" };
  p49.jornada = { integerValue: "8" };
  p49.fechaRealAsignadaText = { stringValue: "Sábado" };
  p49.dia = { stringValue: "Sábado" };
  p49.date = { stringValue: "2026-11-21" };
  p49.horaRealAsignada = { stringValue: "16:20" };
  p49.hora = { stringValue: "16:20" };
  p49.time = { stringValue: "16:20" };
  p49.camerinoLocal = { stringValue: "3" };
  p49.camerinoVisitor = { stringValue: "1" };
  p49.vocalAsignado = { stringValue: "PORTOVIEJO FC" };
  p49.vocal = { stringValue: "PORTOVIEJO FC" };
  p49.veedorAsignado = { stringValue: "ESTUDIANTES" };
  p49.veedor = { stringValue: "ESTUDIANTES" };

  // 4) Domingo 09:40 | CHELSEA (C2) vs CD NAPOLES (C4) | Vocal: GALAXY | Veedor: FLUMINENSE -> Idx 53
  const p53 = priValues[53].mapValue.fields;
  p53.local = { stringValue: "CHELSEA" };
  p53.visitor = { stringValue: "CD NAPOLES" };
  p53.jornada = { integerValue: "8" };
  p53.fechaRealAsignadaText = { stringValue: "Domingo" };
  p53.dia = { stringValue: "Domingo" };
  p53.date = { stringValue: "2026-11-22" };
  p53.horaRealAsignada = { stringValue: "09:40" };
  p53.hora = { stringValue: "09:40" };
  p53.time = { stringValue: "09:40" };
  p53.camerinoLocal = { stringValue: "2" };
  p53.camerinoVisitor = { stringValue: "4" };
  p53.vocalAsignado = { stringValue: "GALAXY" };
  p53.vocal = { stringValue: "GALAXY" };
  p53.veedorAsignado = { stringValue: "FLUMINENSE" };
  p53.veedor = { stringValue: "FLUMINENSE" };

  // 5) Domingo 11:20 | PALMEIRAS (C1) vs LAKERS (C3) | Vocal: CHELSEA | Veedor: CD NAPOLES -> Idx 50
  const p50 = priValues[50].mapValue.fields;
  p50.local = { stringValue: "PALMEIRAS" };
  p50.visitor = { stringValue: "LAKERS" };
  p50.jornada = { integerValue: "8" };
  p50.fechaRealAsignadaText = { stringValue: "Domingo" };
  p50.dia = { stringValue: "Domingo" };
  p50.date = { stringValue: "2026-11-22" };
  p50.horaRealAsignada = { stringValue: "11:20" };
  p50.hora = { stringValue: "11:20" };
  p50.time = { stringValue: "11:20" };
  p50.camerinoLocal = { stringValue: "1" };
  p50.camerinoVisitor = { stringValue: "3" };
  p50.vocalAsignado = { stringValue: "CHELSEA" };
  p50.vocal = { stringValue: "CHELSEA" };
  p50.veedorAsignado = { stringValue: "CD NAPOLES" };
  p50.veedor = { stringValue: "CD NAPOLES" };

  // 6) Domingo 14:40 | RIVER PLATE (C3) vs 3 DE JULIO (C1) | Vocal: SPENCER | Veedor: INDEPENDIENTE -> Idx 54
  const p54 = priValues[54].mapValue.fields;
  p54.local = { stringValue: "RIVER PLATE" };
  p54.visitor = { stringValue: "3 DE JULIO " };
  p54.jornada = { integerValue: "8" };
  p54.fechaRealAsignadaText = { stringValue: "Domingo" };
  p54.dia = { stringValue: "Domingo" };
  p54.date = { stringValue: "2026-11-22" };
  p54.horaRealAsignada = { stringValue: "14:40" };
  p54.hora = { stringValue: "14:40" };
  p54.time = { stringValue: "14:40" };
  p54.camerinoLocal = { stringValue: "3" };
  p54.camerinoVisitor = { stringValue: "1" };
  p54.vocalAsignado = { stringValue: "SPENCER" };
  p54.vocal = { stringValue: "SPENCER" };
  p54.veedorAsignado = { stringValue: "INDEPENDIENTE" };
  p54.veedor = { stringValue: "INDEPENDIENTE" };

  // Limpiar Idx 52 (INTER vs AMAZONAS FC)
  clearScheduleFields(priValues[52].mapValue.fields);

  // 4.2 Limpiar programación en cualquier partido de PRIMERA con jornada > 8
  priValues.forEach((v, idx) => {
    const f = v.mapValue.fields;
    const j = parseInt(f.jornada?.integerValue || f.jornada?.stringValue) || 0;
    if (j > 8) {
      if (f.horaRealAsignada?.stringValue || f.fechaRealAsignadaText?.stringValue) {
        console.log(`  -> Limpiando programación huérfana en PRIMERA Idx ${idx} (J${j}): ${f.local?.stringValue} vs ${f.visitor?.stringValue}`);
        clearScheduleFields(f);
      }
    }
  });

  // Guardar PRIMERA
  await patchDoc(PRIMERA_ID, priValues);
  console.log("✅ PRIMERA actualizado y guardado correctamente en Firestore.");

  console.log("\n🎉 ¡PROCESO DE REPARACIÓN Y PROGRAMACIÓN FINALIZADO CON ÉXITO TOTAL! 🎉");
}

execute().catch(err => {
  console.error("❌ ERROR DURANTE LA EJECUCIÓN:", err);
  process.exit(1);
});
