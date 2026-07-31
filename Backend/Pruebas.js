function probarDoPostTotpIncorrecto() {
  const propiedades =
    PropertiesService.getScriptProperties();

  const eventoSimulado = {
    postData: {
      contents: JSON.stringify({
        accion: "iniciarSesionTotp",
        correo: "TU_CORREO_REAL",
        codigo: "000000",
        bridgeSecret:
          propiedades.getProperty(
            "BRIDGE_SECRET"
          )
      })
    }
  };

  const respuesta = doPost(eventoSimulado);

  Logger.log(
    respuesta.getContent()
  );
}

function probarLoginTotp() {
  const resultado =
    iniciarSesionConTotp(
      "TU_CORREO_REAL",
      "CODIGO_ACTUAL"
    );

  Logger.log(
    "Login TOTP correcto: " +
    resultado.ok
  );

  Logger.log(
    "Tiene token: " +
    Boolean(resultado.token)
  );
}

function probarActualizarContadorTotp() {
  const usuario =
    buscarUsuarioPorId("USR-001");

  actualizarUltimoContadorTotp(
    usuario.id,
    usuario.ultimoCodigoTotp
  );

  Logger.log(
    "Contador conservado correctamente."
  );
}

function probarPrepararTotpSinSesion() {
  const resultado =
    prepararConfiguracionTotp(
      "TOKEN_INCORRECTO"
    );

  Logger.log(
    "Solicitud rechazada: " +
    !resultado.ok
  );
}

function probarVerificarCodigoTotp() {
  const secreto = generarSecretoTotp();

  const codigo = generarCodigoTotp(
    secreto,
    new Date()
  );

  const primeraVerificacion =
    verificarCodigoTotp(
      secreto,
      codigo,
      null
    );

  const segundaVerificacion =
    verificarCodigoTotp(
      secreto,
      codigo,
      primeraVerificacion.contador
    );

  const codigoIncorrecto =
    verificarCodigoTotp(
      secreto,
      "000000",
      null
    );

  Logger.log(
    "Primera válida: " +
    primeraVerificacion.valido
  );

  Logger.log(
    "Reutilización rechazada: " +
    !segundaVerificacion.valido
  );

  Logger.log(
    "Incorrecto rechazado: " +
    !codigoIncorrecto.valido
  );
}

function probarGenerarCodigoTotp() {
  const secretoConocido =
    "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

  const instanteConocido =
    new Date(59000);

  const codigo = generarCodigoTotp(
    secretoConocido,
    instanteConocido
  );

  Logger.log(
    "Código correcto: " +
    (codigo === "287082")
  );
}

function probarDecodificarBase32() {
  const secretoConocido =
    "GEZDGNBVGY3TQOJQGEZDGNBVGY3TQOJQ";

  const bytes =
    decodificarBase32(
      secretoConocido
    );

  const texto = Utilities
    .newBlob(bytes)
    .getDataAsString();

  Logger.log(
    "Decodificación correcta: " +
    (
      texto ===
      "12345678901234567890"
    )
  );
}

function probarPrepararConfiguracionTotp() {
  const usuario =
    buscarUsuarioActivoPorCorreo(
      "TU_CORREO_REAL"
    );

  const sesion = crearSesion(usuario.id);

  const resultado =
    prepararConfiguracionTotp(
      sesion.token
    );

  Logger.log(
    "Preparación correcta: " +
    resultado.ok
  );

  Logger.log(
    "Tiene URI: " +
    Boolean(resultado.uri)
  );

  Logger.log(
    "Tiene secreto: " +
    Boolean(resultado.secreto)
  );
}

function probarCrearUriTotp() {
  const secreto = generarSecretoTotp();

  const uri = crearUriTotp(
    "usuario@correo.com",
    secreto
  );

  Logger.log(
    "Comienza correctamente: " +
    uri.startsWith("otpauth://totp/")
  );

  Logger.log(
    "Tiene seis dígitos: " +
    uri.includes("digits=6")
  );

  Logger.log(
    "Periodo correcto: " +
    uri.includes("period=30")
  );
}

function probarGenerarSecretoTotp() {
  const primero = generarSecretoTotp();
  const segundo = generarSecretoTotp();

  const formatoValido =
    /^[A-Z2-7]{32}$/.test(primero);

  Logger.log(
    "Longitud correcta: " +
    (primero.length === 32)
  );

  Logger.log(
    "Formato correcto: " +
    formatoValido
  );

  Logger.log(
    "Son diferentes: " +
    (primero !== segundo)
  );
}

function probarPropiedadTotp() {
  const usuarioPrueba =
    "USUARIO-PRUEBA-TOTP";

  guardarSecretoTotp(
    usuarioPrueba,
    "SECRETO-TEMPORAL-DE-PRUEBA"
  );

  const secreto =
    obtenerSecretoTotp(usuarioPrueba);

  Logger.log(
    "Secreto encontrado: " +
    Boolean(secreto)
  );

  eliminarSecretoTotp(usuarioPrueba);

  const eliminado =
    !obtenerSecretoTotp(usuarioPrueba);

  Logger.log(
    "Secreto eliminado: " + eliminado
  );
}

function probarNombrePropiedadTotp() {
  const nombre =
    obtenerNombrePropiedadTotp("USR-001");

  Logger.log(nombre);
}

function probarDoPostValidarSesion() {
  const usuario =
    buscarUsuarioActivoPorCorreo(
      "TU_CORREO_REAL"
    );

  const sesion = crearSesion(usuario.id);

  const propiedades =
    PropertiesService.getScriptProperties();

  const eventoSimulado = {
    postData: {
      contents: JSON.stringify({
        accion: "validarSesion",
        token: sesion.token,
        bridgeSecret:
          propiedades.getProperty(
            "BRIDGE_SECRET"
          )
      })
    }
  };

  const respuesta = doPost(eventoSimulado);

  Logger.log(
    respuesta.getContent()
  );
}

function probarDoPostVerificarCodigo() {
  const propiedades =
    PropertiesService.getScriptProperties();

  const secreto =
    propiedades.getProperty("BRIDGE_SECRET");

  const eventoSimulado = {
    postData: {
      contents: JSON.stringify({
        accion: "verificarCodigoCorreo",
        correo: "TU_CORREO_REAL",
        codigo: "CODIGO_RECIBIDO",
        bridgeSecret: secreto
      })
    }
  };

  const respuesta = doPost(eventoSimulado);

  Logger.log(
    respuesta.getContent()
  );
}

function probarDoPostAutorizado() {
  const propiedades =
    PropertiesService.getScriptProperties();

  const secreto =
    propiedades.getProperty("BRIDGE_SECRET");

  const eventoSimulado = {
    postData: {
      contents: JSON.stringify({
        accion: "solicitarCodigoCorreo",
        correo: "TU_CORREO_REAL",
        bridgeSecret: secreto
      })
    }
  };

  const respuesta = doPost(eventoSimulado);

  Logger.log(
    respuesta.getContent()
  );
}

function probarDoPostSinAutorizacion() {
  const eventoSimulado = {
    postData: {
      contents: JSON.stringify({
        accion: "solicitarCodigoCorreo",
        correo: "TU_CORREO_REAL",
        bridgeSecret: "SECRETO_INCORRECTO"
      })
    }
  };

  const respuesta = doPost(eventoSimulado);

  Logger.log(
    respuesta.getContent()
  );
}

function probarLeerCuerpoJson() {
  const eventoSimulado = {
    postData: {
      contents: JSON.stringify({
        accion: "prueba",
        correo: "usuario@correo.com"
      })
    }
  };

  const datos = leerCuerpoJson(eventoSimulado);

  Logger.log("Acción: " + datos.accion);
  Logger.log("Correo: " + datos.correo);
}

function probarSecretoIncorrecto() {
  try {
    validarSecretoPuente("SECRETO_INCORRECTO");

    Logger.log("La validación no funcionó.");
  } catch (error) {
    Logger.log("Solicitud rechazada correctamente.");
  }
}

function probarValidarSesion() {
  const usuario = buscarUsuarioActivoPorCorreo(
    "TU_CORREO_REAL"
  );

  const sesion = crearSesion(usuario.id);
  const resultado = validarSesion(sesion.token);

  Logger.log("Sesión válida: " + resultado.valida);
  Logger.log("Usuario: " + resultado.usuario.nombre);
}

function probarBuscarUsuarioPorId() {
  const usuario = buscarUsuarioPorId("USR-001");

  Logger.log("Usuario encontrado: " + Boolean(usuario));
  Logger.log("Correo: " + usuario.correo);
}

function probarBuscarSesion() {
  const usuario = buscarUsuarioActivoPorCorreo(
    "TU_CORREO_REAL"
  );

  const sesionCreada = crearSesion(usuario.id);

  const sesionEncontrada = buscarSesionPorToken(
    sesionCreada.token
  );

  Logger.log(
    "Sesión encontrada: " +
    Boolean(sesionEncontrada)
  );

  Logger.log(
    "Usuario relacionado: " +
    sesionEncontrada.usuarioId
  );
}

function probarLoginCompleto() {
  const resultado = iniciarSesionConCodigo(
    "TU_CORREO_REAL",
    "CODIGO_RECIBIDO"
  );

  Logger.log("Login correcto: " + resultado.ok);
  Logger.log("Tiene token: " + Boolean(resultado.token));
  Logger.log("Usuario: " + resultado.usuario.nombre);
}

function probarCrearSesion() {
  const usuario = buscarUsuarioActivoPorCorreo(
    "TU_CORREO_REAL"
  );

  if (!usuario) {
    throw new Error("Usuario no autorizado.");
  }

  const sesion = crearSesion(usuario.id);

  Logger.log(
    "Token recibido: " + Boolean(sesion.token)
  );

  Logger.log(
    "Vence en: " + sesion.venceEn
  );
}

function probarTokenSesion() {
  const token = generarTokenSesion();
  const tokenHash = protegerTokenSesion(token);

  Logger.log("Longitud token: " + token.length);
  Logger.log("Longitud hash: " + tokenHash.length);
  Logger.log("Son diferentes: " + (token !== tokenHash));
}

function probarAuditoria() {
  registrarEventoAuditoria(
    "PRUEBA_SISTEMA",
    "TU_CORREO_REAL",
    "Prueba manual de auditoría",
    true
  );
}

function probarVerificarCodigo() {
  const resultado = verificarCodigoAcceso(
    "TU_CORREO_REAL",
    "CODIGO_RECIBIDO"
  );

  Logger.log("Código correcto: " + resultado);
}

function probarObtenerUltimoCodigo() {
  const resultado = obtenerUltimoCodigoPorCorreo(
    "TU_CORREO_REAL"
  );

  Logger.log(resultado);
}

function probarSolicitudCompleta() {
  const resultado = solicitarCodigoAccesoPorCorreo(
    "TU_CORREO_REAL"
  );

  Logger.log(resultado);
}

function probarEnviarCorreo() {
  const correo = "TU_CORREO_REAL";
  const codigo = generarCodigoAcceso();

  enviarCorreoCodigoAcceso(correo, codigo);

  Logger.log("Correo de prueba enviado.");
}

function probarGuardarCodigo() {
  const correo = "TU_CORREO_REAL";
  const codigo = generarCodigoAcceso();
  const sal = generarSalCodigo();
  const codigoHash = protegerCodigoAcceso(
    correo,
    codigo,
    sal
  );

  const resultado = guardarCodigoAcceso(
    correo,
    codigoHash,
    sal
  );

  Logger.log("Código de prueba: " + codigo);
  Logger.log(resultado);
}

function probarProtegerCodigo() {
  const correo = "TU_CORREO_REAL";
  const codigo = generarCodigoAcceso();
  const sal = generarSalCodigo();
  const codigoHash = protegerCodigoAcceso(
    correo,
    codigo,
    sal
  );

  Logger.log("Código generado: " + codigo);
  Logger.log("Sal: " + sal);
  Logger.log("Hash: " + codigoHash);
  Logger.log("Longitud del hash: " + codigoHash.length);
}

function probarCrearHash() {
  const primerHash = crearHash("Texto de prueba");
  const segundoHash = crearHash("Texto de prueba");

  Logger.log(primerHash);
  Logger.log("Longitud: " + primerHash.length);
  Logger.log("Son iguales: " + (primerHash === segundoHash));
}

function probarGenerarCodigo() {
  const codigo = generarCodigoAcceso();

  Logger.log("Código: " + codigo);
  Logger.log("Longitud: " + codigo.length);
}

function probarUsuarioActivo() {
  const usuario = buscarUsuarioActivoPorCorreo("TU_CORREO_REAL");

  if (usuario) {
    Logger.log("Usuario autorizado: " + usuario.nombre);
  } else {
    Logger.log("Usuario inexistente o inactivo");
  }
}

function probarBuscarUsuario() {
  const usuario = buscarUsuarioPorCorreo("jwrojas77br@gmail.com");

  Logger.log(usuario);
}

function probarNormalizarCorreo() {
  const correo = normalizarCorreo("  Usuario@Correo.com  ");

  Logger.log(correo);
}

function probarConexionUsuarios() {
  const hojaUsuarios = obtenerHoja("Usuarios");

  Logger.log("Hoja conectada: " + hojaUsuarios.getName());
}

function probarConexionBaseDatos() {
  const baseDatos = obtenerBaseDatos();
  const nombre = baseDatos.getName();

  Logger.log("Base conectada: " + nombre);
}









