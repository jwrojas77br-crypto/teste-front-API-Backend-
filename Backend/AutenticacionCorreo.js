function generarCodigoAcceso() {
    const uuid = Utilities.getUuid();
    const textoHexadecimal = uuid
        .replace(/-/g, "")
        .substring(0, 8);

    const numero = parseInt(textoHexadecimal, 16) % 1000000;

    return String(numero).padStart(6, "0");
}

function generarSalCodigo() {
    return Utilities.getUuid();
}

function protegerCodigoAcceso(correo, codigo, sal) {
    const propiedades = PropertiesService.getScriptProperties();
    const pepper = propiedades.getProperty("CODIGO_PEPPER");

    if (!pepper) {
        throw new Error("No está configurada la propiedad CODIGO_PEPPER.");
    }

    const contenido = [
        normalizarCorreo(correo),
        String(codigo),
        sal,
        pepper
    ].join("|");

    return crearHash(contenido);
}

function solicitarCodigoAccesoPorCorreo(correo) {
    const usuario = buscarUsuarioActivoPorCorreo(correo);

    if (!usuario) {
        registrarEventoAuditoria(
            "CODIGO_SOLICITADO_RECHAZADO",
            correo,
            "Usuario inexistente o inactivo",
            false
        );

        return crearRespuestaSolicitudCodigo();
    }

    if (!puedeSolicitarNuevoCodigo(usuario.correo)) {
        registrarEventoAuditoria(
            "CODIGO_SOLICITUD_LIMITADA",
            usuario.correo,
            "Solicitud realizada antes de 60 segundos",
            false
        );

        return crearRespuestaSolicitudCodigo();
    }

    const codigo = generarCodigoAcceso();
    const sal = generarSalCodigo();

    const codigoHash = protegerCodigoAcceso(
        usuario.correo,
        codigo,
        sal
    );

    guardarCodigoAcceso(
        usuario.correo,
        codigoHash,
        sal
    );

    enviarCorreoCodigoAcceso(
        usuario.correo,
        codigo
    );

    registrarEventoAuditoria(
        "CODIGO_CORREO_ENVIADO",
        usuario.correo,
        "Código temporal enviado",
        true
    );

    return crearRespuestaSolicitudCodigo();
}

function crearRespuestaSolicitudCodigo() {
    return {
        ok: true,
        mensaje:
            "Si el correo está autorizado, recibirás un código de acceso."
    };
}

function puedeSolicitarNuevoCodigo(correo) {
    const ultimoCodigo = obtenerUltimoCodigoPorCorreo(correo);

    if (!ultimoCodigo) {
        return true;
    }

    const fechaAnterior = new Date(
        ultimoCodigo.fechaCreacion
    );

    const ahora = new Date();

    const segundosTranscurridos =
        (ahora.getTime() - fechaAnterior.getTime()) / 1000;

    return segundosTranscurridos >= 60;
}

function verificarCodigoAcceso(correo, codigoIngresado) {
    return ejecutarConBloqueo(function () {
        return verificarCodigoAccesoSinBloqueo(
            correo,
            codigoIngresado
        );
    });
}

function verificarCodigoAccesoSinBloqueo(correo, codigoIngresado) {
    const codigoGuardado = obtenerUltimoCodigoPorCorreo(correo);

    if (!codigoGuardado) {
        return false;
    }

    const estadoUsado = String(codigoGuardado.usado)
        .trim()
        .toUpperCase();

    const yaFueUsado =
        codigoGuardado.usado === true ||
        estadoUsado === "SI" ||
        estadoUsado === "SÍ" ||
        estadoUsado === "TRUE";

    if (yaFueUsado) {
        return false;
    }

    const fechaVencimiento = new Date(
        codigoGuardado.venceEn
    );

    if (fechaVencimiento.getTime() <= Date.now()) {
        return false;
    }

    if (Number(codigoGuardado.intentos) >= 5) {
        return false;
    }

    const hashIngresado = protegerCodigoAcceso(
        correo,
        codigoIngresado,
        codigoGuardado.sal
    );

    const codigoCorrecto =
        hashIngresado === codigoGuardado.codigoHash;

    if (!codigoCorrecto) {
        registrarIntentoIncorrecto(
            codigoGuardado.filaHoja,
            codigoGuardado.intentos
        );

        if (!codigoCorrecto) {
            registrarIntentoIncorrecto(
                codigoGuardado.filaHoja,
                codigoGuardado.intentos
            );

            registrarEventoAuditoria(
                "CODIGO_CORREO_INCORRECTO",
                correo,
                "El código introducido no coincide",
                false
            );

            return false;
        }

        return false;
    }

    marcarCodigoComoUsado(
        codigoGuardado.filaHoja
    );

    registrarEventoAuditoria(
        "CODIGO_CORREO_VERIFICADO",
        correo,
        "Código verificado correctamente",
        true
    );

    return true;
}

function iniciarSesionConCodigo(correo, codigoIngresado) {
    const usuario =
        buscarUsuarioActivoPorCorreo(correo);

    if (!usuario) {
        return {
            ok: false,
            mensaje: "Correo o código incorrecto."
        };
    }

    const codigoCorrecto = verificarCodigoAcceso(
        usuario.correo,
        codigoIngresado
    );

    if (!codigoCorrecto) {
        return {
            ok: false,
            mensaje: "Correo o código incorrecto."
        };
    }

    const sesion = crearSesion(usuario.id);

    registrarEventoAuditoria(
        "LOGIN_COMPLETADO",
        usuario.correo,
        "Sesión iniciada mediante código por correo",
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
            authenticatorActivo:
                esValorAfirmativo(
                    usuario.authenticatorActivo
                )
        }
    };
}