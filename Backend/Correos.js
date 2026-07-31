function enviarCorreoCodigoAcceso(correo, codigo) {
  const asunto = "Código de acceso a SSC-Admin";

  const mensaje =
    "Tu código de acceso es: " + codigo + "\n\n" +
    "El código vence en 10 minutos.\n\n" +
    "Si no solicitaste este acceso, puedes ignorar el mensaje.";

  MailApp.sendEmail({
    to: normalizarCorreo(correo),
    subject: asunto,
    body: mensaje,
    name: "SSC-Admin"
  });
}