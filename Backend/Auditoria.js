function registrarEventoAuditoria(
  evento,
  correo,
  detalle,
  exitoso
) {
  const hoja = obtenerHoja("Auditoria");

  hoja.appendRow([
    Utilities.getUuid(),
    evento,
    normalizarCorreo(correo),
    detalle,
    new Date(),
    exitoso ? "SI" : "NO"
  ]);
}