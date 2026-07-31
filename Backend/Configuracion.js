function obtenerBaseDatos() {
  const propiedades = PropertiesService.getScriptProperties();
  const entorno = propiedades.getProperty("ENTORNO");

  if (entorno !== "DEV" && entorno !== "PROD") {
    throw new Error("El entorno debe ser DEV o PROD.");
  }

  const nombrePropiedad = "SHEET_ID_" + entorno;
  const sheetId = propiedades.getProperty(nombrePropiedad);

  if (!sheetId) {
    throw new Error("No se encontró la propiedad " + nombrePropiedad);
  }

  return SpreadsheetApp.openById(sheetId);
}