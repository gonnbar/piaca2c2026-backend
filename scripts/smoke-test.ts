const BASE = process.env.BASE_URL ?? "http://localhost:3000/api";

let passed = 0;
let failed = 0;

async function call(method: string, path: string, token?: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: body === undefined ? undefined : JSON.stringify(body),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const json = (await res.json().catch(() => ({}))) as any;
  return { status: res.status, body: json };
}

function check(name: string, ok: boolean, detail?: unknown) {
  if (ok) {
    passed++;
    console.log(`  ✓ ${name}`);
  } else {
    failed++;
    console.log(`  ✗ ${name}`, detail !== undefined ? JSON.stringify(detail) : "");
  }
}

function section(title: string) {
  console.log(`\n${title}`);
}

async function main() {
  const suffix = Date.now();
  const dni = String(10000000 + Math.floor(Math.random() * 89999999));
  const password = "123456";

  // ---------- Preparación ----------
  section("Preparación");
  const nutri1Email = `nutri1.${suffix}@test.com`;
  const nutri2Email = `nutri2.${suffix}@test.com`;
  const patientEmail = `paciente.${suffix}@test.com`;

  let r = await call("POST", "/auth/register", undefined, { name: "Nutri Uno", email: nutri1Email, password, role: "nutritionist" });
  check("registrar nutricionista 1", r.status === 201, r);
  r = await call("POST", "/auth/register", undefined, { name: "Nutri Dos", email: nutri2Email, password, role: "nutritionist" });
  check("registrar nutricionista 2", r.status === 201, r);

  r = await call("POST", "/auth/login", undefined, { email: nutri1Email, password });
  check("login nutricionista 1", r.status === 200 && !!r.body.token, r);
  const tN1: string = r.body.token;
  r = await call("POST", "/auth/login", undefined, { email: nutri2Email, password });
  check("login nutricionista 2", r.status === 200 && !!r.body.token, r);
  const tN2: string = r.body.token;

  r = await call("POST", "/patients", tN1, {
    fullName: "Paciente Prueba",
    email: patientEmail,
    password,
    dni,
    conditions: ["diabetes"],
  });
  check("nutricionista 1 crea paciente", r.status === 201, r);
  const patientId: string = r.body.data?._id;

  r = await call("POST", "/auth/login", undefined, { email: patientEmail, password });
  check("login paciente", r.status === 200 && !!r.body.token, r);
  let tP: string = r.body.token;

  // ---------- Pacientes ----------
  section("Pacientes");
  r = await call("GET", `/patients?q=${dni}`, tN1);
  check("búsqueda por DNI encuentra al paciente", r.status === 200 && r.body.data?.length === 1, r);
  r = await call("GET", "/patients?q=Prueba", tN1);
  check("búsqueda por nombre encuentra al paciente", r.status === 200 && r.body.data?.length >= 1, r);
  r = await call("GET", "/patients", tP);
  check("paciente no puede listar pacientes (403)", r.status === 403, r);
  r = await call("GET", `/patients/${patientId}`, tN2);
  check("otro nutricionista no ve al paciente (404)", r.status === 404, r);
  r = await call("GET", "/patients/me", tP);
  check("paciente obtiene su registro en /patients/me", r.status === 200 && r.body.data?._id === patientId, r);
  r = await call("PATCH", `/patients/${patientId}`, tP, { phone: "1155551111", fullName: "Hackeado" });
  check("paciente edita su teléfono y se ignora fullName", r.status === 200 && r.body.data?.phone === "1155551111" && r.body.data?.fullName === "Paciente Prueba", r);
  r = await call("DELETE", `/patients/${patientId}`, tP);
  check("paciente no puede darse de baja (403)", r.status === 403, r);

  // ---------- Consultas: crear ----------
  section("1. Crear consulta");
  r = await call("POST", "/consultations", tN1, {
    patientId,
    observations: "Primera consulta",
    privateNotes: "Nota privada",
    measurement: { weight: 80.1, height: 175 },
  });
  check("201 al crear", r.status === 201, r);
  check("el nutricionista ve privateNotes", r.body.data?.privateNotes === "Nota privada", r.body);
  check("IMC calculado = 26.16", r.body.data?.measurement?.imc === 26.16, r.body.data?.measurement);
  const consultationId: string = r.body.data?._id;

  // ---------- Listar y ver ----------
  section("2. Listar y ver como nutricionista");
  r = await call("GET", `/consultations?patient=${patientId}`, tN1);
  check("lista con 1 consulta y privateNotes", r.status === 200 && r.body.data?.length === 1 && r.body.data[0].privateNotes === "Nota privada", r);
  r = await call("GET", `/consultations/${consultationId}`, tN1);
  check("detalle con privateNotes y medición", r.status === 200 && r.body.data?.privateNotes === "Nota privada" && !!r.body.data?.measurement, r);
  r = await call("GET", "/consultations", tN1);
  check("lista sin ?patient= devuelve 400", r.status === 400, r);

  // ---------- Privacidad ----------
  section("3. Privacidad de las notas (regla 19)");
  r = await call("GET", "/consultations", tP);
  check(
    "el paciente lista sus consultas SIN privateNotes",
    r.status === 200 && r.body.data?.length === 1 && !("privateNotes" in r.body.data[0]),
    r.body,
  );
  r = await call("GET", `/consultations/${consultationId}`, tP);
  check("el paciente ve el detalle SIN privateNotes", r.status === 200 && !("privateNotes" in (r.body.data ?? {})), r.body);

  // ---------- Paciente no escribe ----------
  section("4. El paciente no puede escribir (regla 3)");
  r = await call("POST", "/consultations", tP, { patientId, observations: "x" });
  check("POST como paciente → 403", r.status === 403, r);
  r = await call("PATCH", `/consultations/${consultationId}`, tP, { observations: "x" });
  check("PATCH como paciente → 403", r.status === 403, r);
  r = await call("DELETE", `/consultations/${consultationId}`, tP);
  check("DELETE como paciente → 403", r.status === 403, r);

  // ---------- Aislamiento ----------
  section("5. Aislamiento entre nutricionistas");
  r = await call("GET", `/consultations/${consultationId}`, tN2);
  check("GET de otra consulta → 404", r.status === 404, r);
  r = await call("GET", `/consultations?patient=${patientId}`, tN2);
  check("listar consultas de paciente ajeno → 404", r.status === 404, r);
  r = await call("PATCH", `/consultations/${consultationId}`, tN2, { observations: "x" });
  check("PATCH ajeno → 404", r.status === 404, r);
  r = await call("DELETE", `/consultations/${consultationId}`, tN2);
  check("DELETE ajeno → 404", r.status === 404, r);
  r = await call("POST", "/consultations", tN2, { patientId, observations: "x" });
  check("crear consulta para paciente ajeno → 404", r.status === 404, r);

  // ---------- Editar ----------
  section("6. Editar medición y recalcular IMC");
  r = await call("PATCH", `/consultations/${consultationId}`, tN1, { measurement: { weight: 79 } });
  check(
    "peso 79, altura 175 y IMC 25.8",
    r.status === 200 && r.body.data?.measurement?.weight === 79 && r.body.data?.measurement?.height === 175 && r.body.data?.measurement?.imc === 25.8,
    r.body.data?.measurement,
  );
  r = await call("PATCH", `/consultations/${consultationId}`, tN1, { observations: "Texto corregido" });
  check("editar observaciones no toca la medición", r.status === 200 && r.body.data?.observations === "Texto corregido" && r.body.data?.measurement?.weight === 79, r.body.data);

  // ---------- Validaciones ----------
  section("7. Validaciones (400)");
  r = await call("POST", "/consultations", tN1, { patientId });
  check("sin observaciones", r.status === 400, r);
  r = await call("POST", "/consultations", tN1, { patientId: "abc", observations: "x" });
  check("patientId inválido", r.status === 400, r);
  r = await call("POST", "/consultations", tN1, { patientId, observations: "x", measurement: { weight: 0 } });
  check("peso 0", r.status === 400, r);
  r = await call("POST", "/consultations", tN1, { patientId, observations: "x", measurement: { height: 10 } });
  check("altura 10", r.status === 400, r);

  // ---------- Cambio de contraseña ----------
  section("9. Cambio de contraseña");
  r = await call("PATCH", "/auth/password", tP, { currentPassword: "incorrecta", newPassword: "nueva123" });
  check("clave actual incorrecta → 400", r.status === 400, r);
  r = await call("PATCH", "/auth/password", tP, { currentPassword: password, newPassword: password });
  check("nueva igual a la actual → 400", r.status === 400, r);
  r = await call("PATCH", "/auth/password", tP, { currentPassword: password, newPassword: "abc" });
  check("nueva de menos de 6 caracteres → 400", r.status === 400, r);
  r = await call("PATCH", "/auth/password", tP, { currentPassword: password, newPassword: "nueva123" });
  check("cambio correcto → 200", r.status === 200, r);
  r = await call("POST", "/auth/login", undefined, { email: patientEmail, password });
  check("la clave vieja ya no sirve (401)", r.status === 401, r);
  r = await call("POST", "/auth/login", undefined, { email: patientEmail, password: "nueva123" });
  check("login con la clave nueva", r.status === 200 && !!r.body.token, r);
  tP = r.body.token ?? tP;

    // ---------- Resumen del dashboard ----------
  section("Resumen del dashboard");
  r = await call("GET", "/consultations/summary", tN1);
  check(
    "resumen del nutricionista con pacientes, consultas y recientes",
    r.status === 200 && r.body.data?.patients >= 1 && r.body.data?.consultations >= 1 && r.body.data?.recent?.length >= 1,
    r,
  );
  r = await call("GET", "/consultations/summary", tP);
  check(
    "resumen del paciente con su última medición",
    r.status === 200 && r.body.data?.consultations === 1 && r.body.data?.last?.weight === 79,
    r,
  );

  // ---------- Eliminar consulta ----------
  section("8. Eliminar consulta");
  r = await call("DELETE", `/consultations/${consultationId}`, tN1);
  check("DELETE como nutricionista → 200", r.status === 200, r);
  r = await call("GET", `/consultations/${consultationId}`, tN1);
  check("la consulta ya no existe (404)", r.status === 404, r);

  // ---------- Baja del paciente ----------
  section("Baja del paciente");
  r = await call("DELETE", `/patients/${patientId}`, tN1);
  check("nutricionista da de baja al paciente → 200", r.status === 200, r);
  r = await call("GET", "/patients/me", tP);
  check("el token del paciente dado de baja deja de funcionar (401)", r.status === 401, r);
  r = await call("POST", "/auth/login", undefined, { email: patientEmail, password: "nueva123" });
  check("el paciente dado de baja no puede loguearse (401)", r.status === 401, r);
  r = await call("GET", `/patients?q=${dni}`, tN1);
  check("no aparece más en el listado", r.status === 200 && r.body.data?.length === 0, r);

  console.log(`\nResultado: ${passed} OK, ${failed} fallaron`);
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("El script falló antes de terminar. ¿Está el backend levantado?", err);
  process.exit(1);
});