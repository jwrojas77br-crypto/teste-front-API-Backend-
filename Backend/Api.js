function crearRespuestaJson(datos) {
  const contenido = JSON.stringify(datos);

  return ContentService
    .createTextOutput(contenido)
    .setMimeType(ContentService.MimeType.JSON);
}

function doGet() {
  return crearRespuestaJson({
    ok: true,
    servicio: "SSC-Admin-Backend",
    mensaje: "Backend disponible"
  });
}

function leerCuerpoJson(evento) {
  if (
    !evento ||
    !evento.postData ||
    !evento.postData.contents
  ) {
    throw new Error("La solicitud no contiene datos.");
  }

  try {
    return JSON.parse(
      evento.postData.contents
    );
  } catch (error) {
    throw new Error(
      "La solicitud no contiene un JSON válido."
    );
  }
}

function doPost(evento) {
  try {
    const datos = leerCuerpoJson(evento);

    validarSecretoPuente(
      datos.bridgeSecret
    );

    if (datos.accion === "solicitarCodigoCorreo") {
      const resultado =
        solicitarCodigoAccesoPorCorreo(
          datos.correo
        );

      return crearRespuestaJson(resultado);
    }

    if (datos.accion === "verificarCodigoCorreo") {
      const resultado =
        iniciarSesionConCodigo(
          datos.correo,
          datos.codigo
        );

      return crearRespuestaJson(resultado);
    }

    if (
      datos.accion ===
      "iniciarSesionTotp"
    ) {
      const resultado =
        iniciarSesionConTotp(
          datos.correo,
          datos.codigo
        );

      return crearRespuestaJson(resultado);
    }

    if (datos.accion === "validarSesion") {
      const resultado =
        validarSesion(datos.token);

      return crearRespuestaJson({
        ok: resultado.valida,
        mensaje: resultado.valida
          ? "Sesión válida."
          : "Sesión no válida.",
        usuario: resultado.usuario || null,
        venceEn: resultado.venceEn || null
      });
    }

    if (
      datos.accion ===
      "prepararConfiguracionTotp"
    ) {
      const resultado =
        prepararConfiguracionTotp(
          datos.token
        );

      return crearRespuestaJson(resultado);
    }

    if (
      datos.accion ===
      "confirmarConfiguracionTotp"
    ) {
      const resultado =
        confirmarConfiguracionTotp(
          datos.token,
          datos.codigo
        );

      return crearRespuestaJson(resultado);
    }

    return crearRespuestaJson({
      ok: false,
      codigo: "ACCION_NO_DISPONIBLE",
      mensaje: "La acción solicitada no está disponible."
    });

  } catch (error) {
    console.error(error);

    return crearRespuestaJson({
      ok: false,
      codigo: "SOLICITUD_RECHAZADA",
      mensaje: "No fue posible procesar la solicitud."
    });
  }
}