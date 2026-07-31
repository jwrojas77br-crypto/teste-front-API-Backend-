function validarSecretoPuente(secretoRecibido) {
  const propiedades =
    PropertiesService.getScriptProperties();

  const secretoConfigurado =
    propiedades.getProperty("BRIDGE_SECRET");

  if (!secretoConfigurado) {
    throw new Error(
      "No está configurada la propiedad BRIDGE_SECRET."
    );
  }

  if (secretoRecibido !== secretoConfigurado) {
    throw new Error("Solicitud no autorizada.");
  }

  return true;
}