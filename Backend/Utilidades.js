function normalizarCorreo(correo) {
  return String(correo)
    .trim()
    .toLowerCase();
}

function crearHash(texto) {
  const bytes = Utilities.computeDigest(
    Utilities.DigestAlgorithm.SHA_256,
    String(texto),
    Utilities.Charset.UTF_8
  );

  return bytes
    .map(function(byte) {
      const valorPositivo = byte < 0
        ? byte + 256
        : byte;

      return valorPositivo
        .toString(16)
        .padStart(2, "0");
    })
    .join("");
}

function ejecutarConBloqueo(operacion) {
  const bloqueo = LockService.getScriptLock();

  bloqueo.waitLock(10000);

  try {
    return operacion();
  } finally {
    bloqueo.releaseLock();
  }
}

function esValorAfirmativo(valor) {
  if (valor === true) {
    return true;
  }

  const texto = String(valor)
    .trim()
    .toUpperCase();

  return (
    texto === "SI" ||
    texto === "SÍ" ||
    texto === "TRUE"
  );
}