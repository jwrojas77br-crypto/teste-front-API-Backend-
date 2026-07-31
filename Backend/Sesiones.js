function generarTokenSesion() {
  const primeraParte = Utilities
    .getUuid()
    .replace(/-/g, "");

  const segundaParte = Utilities
    .getUuid()
    .replace(/-/g, "");

  return primeraParte + segundaParte;
}

function protegerTokenSesion(token) {
  const propiedades =
    PropertiesService.getScriptProperties();

  const pepper =
    propiedades.getProperty("TOKEN_PEPPER");

  if (!pepper) {
    throw new Error(
      "No está configurada la propiedad TOKEN_PEPPER."
    );
  }

  return crearHash(
    String(token) + "|" + pepper
  );
}

function crearSesion(usuarioId) {
  const hoja = obtenerHoja("Sesiones");

  const token = generarTokenSesion();
  const tokenHash = protegerTokenSesion(token);

  const fechaCreacion = new Date();

  const venceEn = new Date(
    fechaCreacion.getTime() + 12 * 60 * 60 * 1000
  );

  hoja.appendRow([
    Utilities.getUuid(),
    usuarioId,
    tokenHash,
    venceEn,
    "NO",
    fechaCreacion,
    fechaCreacion
  ]);

  return {
    token: token,
    venceEn: venceEn
  };
}

function buscarSesionPorToken(token) {
  const hoja = obtenerHoja("Sesiones");
  const ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    return null;
  }

  const tokenHash = protegerTokenSesion(token);

  const filas = hoja
    .getRange(2, 1, ultimaFila - 1, 7)
    .getValues();

  for (let posicion = filas.length - 1; posicion >= 0; posicion--) {
    const fila = filas[posicion];

    if (fila[2] === tokenHash) {
      return {
        filaHoja: posicion + 2,
        id: fila[0],
        usuarioId: fila[1],
        tokenHash: fila[2],
        venceEn: fila[3],
        revocada: fila[4],
        fechaCreacion: fila[5],
        ultimoUso: fila[6]
      };
    }
  }

  return null;
}

function validarSesion(token) {
  if (!token) {
    return {
      valida: false
    };
  }

  const sesion = buscarSesionPorToken(token);

  if (!sesion) {
    return {
      valida: false
    };
  }

  const estadoRevocada = String(sesion.revocada)
    .trim()
    .toUpperCase();

  const estaRevocada =
    sesion.revocada === true ||
    estadoRevocada === "SI" ||
    estadoRevocada === "SÍ" ||
    estadoRevocada === "TRUE";

  if (estaRevocada) {
    return {
      valida: false
    };
  }

  const fechaVencimiento = new Date(sesion.venceEn);

  if (fechaVencimiento.getTime() <= Date.now()) {
    return {
      valida: false
    };
  }

  const usuario = buscarUsuarioPorId(
    sesion.usuarioId
  );

  if (!esUsuarioActivo(usuario)) {
    return {
      valida: false
    };
  }

  const hoja = obtenerHoja("Sesiones");

  hoja
    .getRange(sesion.filaHoja, 7)
    .setValue(new Date());

  return {
    valida: true,
    usuario: {
      id: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
      rol: usuario.rol,
      authenticatorActivo:
        esValorAfirmativo(
          usuario.authenticatorActivo
        )
    },
    venceEn: sesion.venceEn
  };
}