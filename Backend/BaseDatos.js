function obtenerHoja(nombreHoja) {
  const baseDatos = obtenerBaseDatos();
  const hoja = baseDatos.getSheetByName(nombreHoja);

  if (!hoja) {
    throw new Error("No se encontró la hoja: " + nombreHoja);
  }

  return hoja;
}