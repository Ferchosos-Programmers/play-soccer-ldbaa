/**
 * =========================================================================
 * LDBAA - SISTEMA DE RESPALDO AUTOMÁTICO EN GOOGLE DRIVE
 * Liga Deportiva Barrial Argelia Alta - "Nueva Era 2026"
 * =========================================================================
 * 
 * Este script recibe las fotos oficiales de las actas de vocalía generadas
 * desde la plataforma web (vocalias.html) y las organiza automáticamente en
 * carpetas por JORNADA dentro de tu Google Drive.
 * 
 * -------------------------------------------------------------------------
 * PASOS PARA INSTALAR EN TU GOOGLE DRIVE (Toma solo 2 minutos):
 * -------------------------------------------------------------------------
 * 1. En tu navegador, ingresa a: https://script.google.com/
 * 2. Inicia sesión con tu cuenta de Google (Gmail).
 * 3. Haz clic en el botón "+ Nuevo proyecto" (arriba a la izquierda).
 * 4. Borra todo el código que aparece por defecto y PEGA este archivo completo.
 * 5. Asigna un nombre al proyecto arriba (ej: "LDBAA Respaldo Actas Drive").
 * 6. Haz clic en el botón azul "Implementar" (arriba a la derecha) y elige:
 *    "Nueva implementación".
 * 7. En el engranaje "Seleccionar tipo", elige: "Aplicación web".
 * 8. Configura los campos:
 *    - Descripción: "Respaldo de Actas LDBAA"
 *    - Ejecutar como: "Yo" (tu cuenta de correo)
 *    - Quién tiene acceso: "Cualquier persona" (Anyone)  <--- ¡MUY IMPORTANTE!
 * 9. Haz clic en "Implementar" y autoriza los permisos de acceso a tu Google Drive.
 * 10. Copia la "URL de la aplicación web" que termina en "/exec"
 *     (Ej: https://script.google.com/macros/s/AKfycb.../exec)
 * 11. Pega esa URL en el sistema web (en el botón "Respaldo Google Drive" o en super-admin.html).
 * =========================================================================
 */

function doPost(e) {
  try {
    if (!e || !e.postData || !e.postData.contents) {
      return responseJson({
        status: "error",
        message: "No se recibieron datos en la petición."
      });
    }

    var data = JSON.parse(e.postData.contents);
    var fileName = data.fileName || ("Vocalia_LDBAA_" + new Date().getTime() + ".png");
    var jornada = data.jornada || "General";
    var category = data.category || "MÁXIMA";
    var imageBase64 = data.imageBase64;
    var mainFolderName = data.mainFolderName || "LDBAA - Actas Oficiales 2026";

    if (!imageBase64) {
      return responseJson({
        status: "error",
        message: "No se proporcionó la imagen en formato Base64."
      });
    }

    // 1. Obtener o crear carpeta principal "LDBAA - Actas Oficiales 2026"
    var mainFolder = getOrCreateFolder(DriveApp.getRootFolder(), mainFolderName);

    // 2. Obtener o crear subcarpeta de la Jornada (ej. "Jornada 7")
    var jornadaFolderName = "Jornada " + jornada;
    var jornadaFolder = getOrCreateFolder(mainFolder, jornadaFolderName);

    // 3. Decodificar la imagen Base64 y crear el archivo PNG
    var cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
    var decodedBytes = Utilities.base64Decode(cleanBase64);
    var blob = Utilities.newBlob(decodedBytes, "image/png", fileName);

    // 4. Si ya existía un archivo con el mismo nombre, reemplazarlo
    var existingFiles = jornadaFolder.getFilesByName(fileName);
    while (existingFiles.hasNext()) {
      var oldFile = existingFiles.next();
      oldFile.setTrashed(true);
    }

    // 5. Guardar el nuevo archivo en la carpeta de la jornada
    var file = jornadaFolder.createFile(blob);
    file.setDescription(
      "Acta Oficial LDBAA - Jornada " + jornada + 
      " | Categoría: " + category + 
      " | Fecha de guardado: " + new Date().toLocaleString("es-EC")
    );

    // 6. Permitir que cualquier persona con el enlace pueda ver la imagen
    try {
      file.setSharing(DriveApp.Access.ANYONE_WITH_LINK, DriveApp.Permission.VIEW);
    } catch (shareErr) {
      // Ignorar si la organización restringe compartir
    }

    var fileUrl = file.getUrl();
    var downloadUrl = "https://drive.google.com/uc?export=view&id=" + file.getId();

    return responseJson({
      status: "success",
      message: "Acta guardada correctamente en Google Drive.",
      fileId: file.getId(),
      fileName: file.getName(),
      fileUrl: fileUrl,
      downloadUrl: downloadUrl,
      folderName: jornadaFolderName,
      folderUrl: jornadaFolder.getUrl()
    });

  } catch (err) {
    return responseJson({
      status: "error",
      message: "Error al procesar y guardar en Drive: " + err.toString()
    });
  }
}

function doGet(e) {
  return responseJson({
    status: "ok",
    message: "Servicio Webhook de Google Drive LDBAA activo y funcionando correctamente.",
    timestamp: new Date().toISOString()
  });
}

function getOrCreateFolder(parentFolder, folderName) {
  var folders = parentFolder.getFoldersByName(folderName);
  if (folders.hasNext()) {
    return folders.next();
  }
  return parentFolder.createFolder(folderName);
}

function responseJson(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj))
    .setMimeType(ContentService.MimeType.JSON);
}

