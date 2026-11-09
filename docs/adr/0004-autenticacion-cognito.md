# 0004. Cognito y verificación de grupos en el servidor

**Estado:** aceptada

**Decisión.** El navegador habla directamente con Cognito para registro e ingreso. La API verifica
el token de acceso con `aws-jwt-verify` y decide por el claim `cognito:groups`. Un disparador
post-confirmación asigna siempre el grupo `cliente`. No se usa autorizador de API Gateway porque
hay rutas públicas que entregan más datos si llega un token (detalle de ficha).

**Consecuencias.** Bloqueo progresivo y contraseñas quedan a cargo de Cognito. Al cerrar sesión,
`GlobalSignOut` revoca los tokens de actualización; un token de acceso ya emitido sigue siendo
válido hasta vencer, por lo que su vigencia se limita a 15 minutos.
