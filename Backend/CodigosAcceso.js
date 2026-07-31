function guardarCodigoAcceso(correo, codigoHash, sal) {
  const hoja = obtenerHoja("CodigosAcceso");

  const id = Utilities.getUuid();
  const fechaCreacion = new Date();
  const venceEn = new Date(
    fechaCreacion.getTime() + 10 * 60 * 1000
  );

  hoja.appendRow([
    id,
    normalizarCorreo(correo),
    codigoHash,
    sal,
    venceEn,
    0,
    "NO",
    fechaCreacion
  ]);

  return {
    id: id,
    venceEn: venceEn
  };
}

function obtenerUltimoCodigoPorCorreo(correo) {
  const hoja = obtenerHoja("CodigosAcceso");
  const ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    return null;
  }

  const filas = hoja
    .getRange(2, 1, ultimaFila - 1, 8)
    .getValues();

  const correoBuscado = normalizarCorreo(correo);

  for (let posicion = filas.length - 1; posicion >= 0; posicion--) {
    const fila = filas[posicion];
    const correoGuardado = normalizarCorreo(fila[1]);

    if (correoGuardado === correoBuscado) {
      return {
        filaHoja: posicion + 2,
        id: fila[0],
        correo: fila[1],
        codigoHash: fila[2],
        sal: fila[3],
        venceEn: fila[4],
        intentos: fila[5],
        usado: fila[6],
        fechaCreacion: fila[7]
      };
    }
  }

  return null;
}

function registrarIntentoIncorrecto(
  filaHoja,
  intentosActuales
) {
  const hoja = obtenerHoja("CodigosAcceso");
  const nuevosIntentos = Number(intentosActuales) + 1;

  hoja
    .getRange(filaHoja, 6)
    .setValue(nuevosIntentos);
}

function marcarCodigoComoUsado(filaHoja) {
  const hoja = obtenerHoja("CodigosAcceso");

  hoja
    .getRange(filaHoja, 7)
    .setValue("SI");
}