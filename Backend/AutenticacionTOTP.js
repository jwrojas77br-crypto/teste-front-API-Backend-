function obtenerNombrePropiedadTotp(usuarioId) {
  const id = String(usuarioId).trim();

  if (!id) {
    throw new Error(
      "El usuario no tiene un ID válido."
    );
  }

  return "TOTP_SECRET_" + id;
}

function guardarSecretoTotp(
  usuarioId,
  secreto
) {
  const nombrePropiedad =
    obtenerNombrePropiedadTotp(usuarioId);

  const valor = String(secreto).trim();

  if (!valor) {
    throw new Error(
      "El secreto TOTP no puede estar vacío."
    );
  }

  PropertiesService
    .getScriptProperties()
    .setProperty(nombrePropiedad, valor);
}

function obtenerSecretoTotp(usuarioId) {
  const nombrePropiedad =
    obtenerNombrePropiedadTotp(usuarioId);

  return PropertiesService
    .getScriptProperties()
    .getProperty(nombrePropiedad);
}

function eliminarSecretoTotp(usuarioId) {
  const nombrePropiedad =
    obtenerNombrePropiedadTotp(usuarioId);

  PropertiesService
    .getScriptProperties()
    .deleteProperty(nombrePropiedad);
}

function codificarBase32(bytes) {
  const alfabeto =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

  const bits = bytes
    .map(function (byte) {
      const valor = byte < 0
        ? byte + 256
        : byte;

      return valor
        .toString(2)
        .padStart(8, "0");
    })
    .join("");

  let resultado = "";

  for (
    let posicion = 0;
    posicion < bits.length;
    posicion += 5
  ) {
    const grupo = bits
      .substring(posicion, posicion + 5)
      .padEnd(5, "0");

    const indice = parseInt(grupo, 2);

    resultado += alfabeto[indice];
  }

  return resultado;
}

function generarSecretoTotp() {
  const materialAleatorio =
    Utilities.getUuid() +
    Utilities.getUuid() +
    new Date().getTime();

  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    materialAleatorio,
    Utilities.Charset.UTF_8
  );

  return codificarBase32(
    bytes.slice(0, 20)
  );
}

function crearUriTotp(correo, secreto) {
  const propiedades =
    PropertiesService.getScriptProperties();

  const issuer =
    propiedades.getProperty("TOTP_ISSUER");

  if (!issuer) {
    throw new Error(
      "No está configurada la propiedad TOTP_ISSUER."
    );
  }

  const cuenta =
    encodeURIComponent(
      normalizarCorreo(correo)
    );

  const nombreAplicacion =
    encodeURIComponent(issuer);

  return (
    "otpauth://totp/" +
    nombreAplicacion +
    ":" +
    cuenta +
    "?secret=" +
    encodeURIComponent(secreto) +
    "&issuer=" +
    nombreAplicacion +
    "&algorithm=SHA1" +
    "&digits=6" +
    "&period=30"
  );
}

function obtenerNombrePropiedadTotpPendiente(
  usuarioId
) {
  const id = String(usuarioId).trim();

  if (!id) {
    throw new Error(
      "El usuario no tiene un ID válido."
    );
  }

  return "TOTP_PENDING_" + id;
}

function guardarSecretoTotpPendiente(
  usuarioId,
  secreto
) {
  const nombrePropiedad =
    obtenerNombrePropiedadTotpPendiente(
      usuarioId
    );

  PropertiesService
    .getScriptProperties()
    .setProperty(
      nombrePropiedad,
      secreto
    );
}

function obtenerSecretoTotpPendiente(
  usuarioId
) {
  const nombrePropiedad =
    obtenerNombrePropiedadTotpPendiente(
      usuarioId
    );

  return PropertiesService
    .getScriptProperties()
    .getProperty(nombrePropiedad);
}

function eliminarSecretoTotpPendiente(
  usuarioId
) {
  const nombrePropiedad =
    obtenerNombrePropiedadTotpPendiente(
      usuarioId
    );

  PropertiesService
    .getScriptProperties()
    .deleteProperty(nombrePropiedad);
}

function prepararConfiguracionTotp(token) {
  const resultadoSesion =
    validarSesion(token);

  if (!resultadoSesion.valida) {
    return {
      ok: false,
      mensaje: "La sesión no es válida."
    };
  }

  const usuario = resultadoSesion.usuario;

  if (
    esValorAfirmativo(
      usuario.authenticatorActivo
    )
  ) {
    return {
      ok: false,
      mensaje:
        "Google Authenticator ya está configurado."
    };
  }

  const secreto = generarSecretoTotp();

  guardarSecretoTotpPendiente(
    usuario.id,
    secreto
  );

  const uri = crearUriTotp(
    usuario.correo,
    secreto
  );

  registrarEventoAuditoria(
    "TOTP_CONFIGURACION_INICIADA",
    usuario.correo,
    "Se generó una configuración pendiente",
    true
  );

  return {
    ok: true,
    mensaje:
      "Configuración de Authenticator preparada.",
    uri: uri,
    secreto: secreto
  };
}

function decodificarBase32(secreto) {
  const alfabeto =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";

  const contenido = String(secreto)
    .trim()
    .toUpperCase()
    .replace(/=+$/g, "");

  if (!/^[A-Z2-7]+$/.test(contenido)) {
    throw new Error(
      "El secreto TOTP no tiene un formato válido."
    );
  }

  let bits = "";

  for (
    let posicion = 0;
    posicion < contenido.length;
    posicion++
  ) {
    const indice = alfabeto.indexOf(
      contenido[posicion]
    );

    bits += indice
      .toString(2)
      .padStart(5, "0");
  }

  const bytes = [];

  for (
    let posicion = 0;
    posicion + 8 <= bits.length;
    posicion += 8
  ) {
    const valor = parseInt(
      bits.substring(posicion, posicion + 8),
      2
    );

    bytes.push(
      valor > 127
        ? valor - 256
        : valor
    );
  }

  return bytes;
}

function crearBytesContadorTotp(contador) {
  const bytes = new Array(8).fill(0);
  let valorRestante = contador;

  for (
    let posicion = 7;
    posicion >= 0;
    posicion--
  ) {
    const valorByte =
      valorRestante % 256;

    bytes[posicion] =
      valorByte > 127
        ? valorByte - 256
        : valorByte;

    valorRestante = Math.floor(
      valorRestante / 256
    );
  }

  return bytes;
}

function generarCodigoTotp(
  secreto,
  instante
) {
  const fecha = instante || new Date();

  const contador = Math.floor(
    fecha.getTime() / 1000 / 30
  );

  const clave =
    decodificarBase32(secreto);

  const contadorBytes =
    crearBytesContadorTotp(contador);

  const firma =
    Utilities.computeHmacSignature(
      Utilities.MacAlgorithm.HMAC_SHA_1,
      contadorBytes,
      clave
    );

  const hash = firma.map(function(byte) {
    return byte < 0
      ? byte + 256
      : byte;
  });

  const desplazamiento =
    hash[hash.length - 1] & 15;

  const numero =
    ((hash[desplazamiento] & 127) << 24) |
    ((hash[desplazamiento + 1] & 255) << 16) |
    ((hash[desplazamiento + 2] & 255) << 8) |
    (hash[desplazamiento + 3] & 255);

  return String(
    numero % 1000000
  ).padStart(6, "0");
}

function verificarCodigoTotp(
  secreto,
  codigoIngresado,
  ultimoContadorUsado
) {
  const codigo = String(
    codigoIngresado
  ).trim();

  if (!/^\d{6}$/.test(codigo)) {
    return {
      valido: false,
      contador: null
    };
  }

  const contadorActual = Math.floor(
    Date.now() / 1000 / 30
  );

  const ultimoContador = Number(
    ultimoContadorUsado || -1
  );

  for (
    let diferencia = -1;
    diferencia <= 1;
    diferencia++
  ) {
    const contadorEvaluado =
      contadorActual + diferencia;

    if (
      contadorEvaluado <= ultimoContador
    ) {
      continue;
    }

    const instante = new Date(
      contadorEvaluado * 30 * 1000
    );

    const codigoEsperado =
      generarCodigoTotp(
        secreto,
        instante
      );

    if (codigoEsperado === codigo) {
      return {
        valido: true,
        contador: contadorEvaluado
      };
    }
  }

  return {
    valido: false,
    contador: null
  };
}

function confirmarConfiguracionTotp(
  token,
  codigoIngresado
) {
  return ejecutarConBloqueo(function() {
    return confirmarConfiguracionTotpSinBloqueo(
      token,
      codigoIngresado
    );
  });
}

function confirmarConfiguracionTotpSinBloqueo(
  token,
  codigoIngresado
) {
  const resultadoSesion =
    validarSesion(token);

  if (!resultadoSesion.valida) {
    return {
      ok: false,
      mensaje: "La sesión no es válida."
    };
  }

  const usuario = resultadoSesion.usuario;

  const secretoPendiente =
    obtenerSecretoTotpPendiente(
      usuario.id
    );

  if (!secretoPendiente) {
    return {
      ok: false,
      mensaje:
        "No existe una configuración pendiente."
    };
  }

  const verificacion =
    verificarCodigoTotp(
      secretoPendiente,
      codigoIngresado,
      null
    );

  if (!verificacion.valido) {
    registrarEventoAuditoria(
      "TOTP_CONFIGURACION_FALLIDA",
      usuario.correo,
      "Código de confirmación incorrecto",
      false
    );

    return {
      ok: false,
      mensaje:
        "El código de Authenticator no es válido."
    };
  }

  guardarSecretoTotp(
    usuario.id,
    secretoPendiente
  );

  activarAuthenticatorUsuario(
    usuario.id,
    verificacion.contador
  );

  eliminarSecretoTotpPendiente(
    usuario.id
  );

  registrarEventoAuditoria(
    "TOTP_CONFIGURADO",
    usuario.correo,
    "Google Authenticator activado",
    true
  );

  return {
    ok: true,
    mensaje:
      "Google Authenticator fue configurado correctamente."
  };
}

function iniciarSesionConTotp(
  correo,
  codigoIngresado
) {
  return ejecutarConBloqueo(function() {
    return iniciarSesionConTotpSinBloqueo(
      correo,
      codigoIngresado
    );
  });
}

function iniciarSesionConTotpSinBloqueo(
  correo,
  codigoIngresado
) {
  const usuario =
    buscarUsuarioActivoPorCorreo(correo);

  if (
    !usuario ||
    !esValorAfirmativo(
      usuario.authenticatorActivo
    )
  ) {
    return crearRespuestaTotpIncorrecto();
  }

  const secreto =
    obtenerSecretoTotp(usuario.id);

  if (!secreto) {
    return crearRespuestaTotpIncorrecto();
  }

  const verificacion =
    verificarCodigoTotp(
      secreto,
      codigoIngresado,
      usuario.ultimoCodigoTotp
    );

  if (!verificacion.valido) {
    registrarEventoAuditoria(
      "LOGIN_TOTP_FALLIDO",
      usuario.correo,
      "Código TOTP incorrecto o reutilizado",
      false
    );

    return crearRespuestaTotpIncorrecto();
  }

  actualizarUltimoContadorTotp(
    usuario.id,
    verificacion.contador
  );

  const sesion =
    crearSesion(usuario.id);

  registrarEventoAuditoria(
    "LOGIN_TOTP_COMPLETADO",
    usuario.correo,
    "Sesión iniciada con Authenticator",
    true
  );

  return {
    ok: true,
    mensaje: "Inicio de sesión correcto.",
    token: sesion.token,
    venceEn: sesion.venceEn,
    usuario: {
      id: usuario.id,
      correo: usuario.correo,
      nombre: usuario.nombre,
      rol: usuario.rol,
      authenticatorActivo: true
    }
  };
}

function crearRespuestaTotpIncorrecto() {
  return {
    ok: false,
    mensaje: "Correo o código incorrecto."
  };
}