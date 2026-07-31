function buscarUsuarioPorCorreo(correo) {
  const hoja = obtenerHoja("Usuarios");
  const ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    return null;
  }

  const filas = hoja
    .getRange(2, 1, ultimaFila - 1, 10)
    .getValues();

  const correoBuscado = normalizarCorreo(correo);

  const filaUsuario = filas.find(function (fila) {
    const correoGuardado = normalizarCorreo(fila[1]);

    return correoGuardado === correoBuscado;
  });

  if (!filaUsuario) {
    return null;
  }

  return {
    id: filaUsuario[0],
    correo: filaUsuario[1],
    nombre: filaUsuario[2],
    rol: filaUsuario[3],
    activo: filaUsuario[4],
    fechaCreacion: filaUsuario[5],

    authenticatorActivo:
      filaUsuario[6],

    authenticatorUbicacionSecreto:
      filaUsuario[7],

    authenticatorConfiguradoEn:
      filaUsuario[8],

    ultimoCodigoTotp:
      filaUsuario[9]
  };
}

function buscarUsuarioActivoPorCorreo(correo) {
  const usuario = buscarUsuarioPorCorreo(correo);

  if (!esUsuarioActivo(usuario)) {
    return null;
  }

  return usuario;
}

function buscarUsuarioPorId(usuarioId) {
  const hoja = obtenerHoja("Usuarios");
  const ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    return null;
  }

  const filas = hoja
    .getRange(2, 1, ultimaFila - 1, 10)
    .getValues();

  const posicion = filas.findIndex(
    function (fila) {
      return (
        String(fila[0]) ===
        String(usuarioId)
      );
    }
  );

  if (posicion === -1) {
    return null;
  }

  const filaUsuario = filas[posicion];

  return {
    filaHoja: posicion + 2,
    id: filaUsuario[0],
    correo: filaUsuario[1],
    nombre: filaUsuario[2],
    rol: filaUsuario[3],
    activo: filaUsuario[4],
    fechaCreacion: filaUsuario[5],

    authenticatorActivo:
      filaUsuario[6],

    authenticatorUbicacionSecreto:
      filaUsuario[7],

    authenticatorConfiguradoEn:
      filaUsuario[8],

    ultimoCodigoTotp:
      filaUsuario[9]
  };
}

function esUsuarioActivo(usuario) {
  if (!usuario) {
    return false;
  }

  return esValorAfirmativo(
    usuario.activo
  );
}

function activarAuthenticatorUsuario(
  usuarioId,
  ultimoContadorTotp
) {
  const hoja = obtenerHoja("Usuarios");
  const ultimaFila = hoja.getLastRow();

  if (ultimaFila < 2) {
    throw new Error(
      "No existen usuarios registrados."
    );
  }

  const ids = hoja
    .getRange(
      2,
      1,
      ultimaFila - 1,
      1
    )
    .getValues();

  const posicion = ids.findIndex(
    function (fila) {
      return (
        String(fila[0]) ===
        String(usuarioId)
      );
    }
  );

  if (posicion === -1) {
    throw new Error(
      "No se encontró el usuario."
    );
  }

  const filaHoja = posicion + 2;

  hoja
    .getRange(filaHoja, 7, 1, 4)
    .setValues([[
      "SI",
      "SCRIPT_PROPERTIES",
      new Date(),
      ultimoContadorTotp
    ]]);
}

function actualizarUltimoContadorTotp(
  usuarioId,
  contador
) {
  const usuario =
    buscarUsuarioPorId(usuarioId);

  if (!usuario) {
    throw new Error(
      "No se encontró el usuario."
    );
  }

  const hoja = obtenerHoja("Usuarios");

  hoja
    .getRange(
      usuario.filaHoja,
      10
    )
    .setValue(contador);
}