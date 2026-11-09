/**
 * Capturas del manual del panel (docs/manual-del-panel.md).
 *
 *   npm run capturas-manual
 *
 * Requisitos: API y web de desarrollo corriendo, contenido de ejemplo cargado y las
 * cuentas de demostración creadas (python manage.py crear_usuarios_demo).
 * Usa el Chrome instalado (CHROME_PATH para otra ruta) y la clave DEMO_CLAVE_PANEL del .env.
 */
import { mkdir, readFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import puppeteer from "puppeteer-core";

const RAIZ = new URL("../../", import.meta.url);
const DESTINO = fileURLToPath(new URL("docs/manual/img/", RAIZ));
const SITIO = process.env.SITIO_LOCAL || "http://localhost:5180";
const CHROME =
  process.env.CHROME_PATH || "C:/Program Files/Google/Chrome/Application/chrome.exe";

async function leerClave() {
  const env = await readFile(new URL(".env", RAIZ), "utf8");
  const clave = /^DEMO_CLAVE_PANEL=(.+)$/m.exec(env)?.[1]?.trim();
  if (!clave) throw new Error("Falta DEMO_CLAVE_PANEL en .env");
  return clave;
}

async function capturar(pagina, nombre, { alto = 1100, selector } = {}) {
  if (selector) {
    const el = await pagina.$(selector);
    await el.screenshot({ path: `${DESTINO}${nombre}.png` });
  } else {
    const total = await pagina.evaluate(() => document.documentElement.scrollHeight);
    await pagina.screenshot({
      path: `${DESTINO}${nombre}.png`,
      clip: { x: 0, y: 0, width: 1280, height: Math.min(total, alto) },
      captureBeyondViewport: true,
    });
  }
  console.log(`  ${nombre}.png`);
}

async function ir(pagina, ruta) {
  await pagina.goto(`${SITIO}${ruta}`, { waitUntil: "networkidle0" });
}

async function ingresar(navegador, email, clave) {
  const contexto = await navegador.createBrowserContext();
  const pagina = await contexto.newPage();
  await pagina.setViewport({ width: 1280, height: 800, deviceScaleFactor: 1 });
  await pagina.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await ir(pagina, "/admin/login/");
  await pagina.type("#id_username", email);
  await pagina.type("#id_password", clave);
  await Promise.all([pagina.waitForNavigation(), pagina.click("input[type=submit]")]);
  return { pagina, contexto };
}

async function idDe(pagina, ruta, texto) {
  await ir(pagina, ruta);
  return pagina.evaluate((t) => {
    const enlace = [...document.querySelectorAll("#result_list th a")].find((a) =>
      a.textContent.includes(t),
    );
    return enlace?.getAttribute("href");
  }, texto);
}

const clave = await leerClave();
await mkdir(DESTINO, { recursive: true });
const navegador = await puppeteer.launch({ executablePath: CHROME, headless: true });

try {
  // Pantalla de ingreso
  const anonimo = await navegador.newPage();
  await anonimo.setViewport({ width: 1280, height: 800 });
  await anonimo.emulateMediaFeatures([{ name: "prefers-color-scheme", value: "light" }]);
  await ir(anonimo, "/admin/login/");
  await capturar(anonimo, "01-ingreso", { alto: 600 });

  // Editor
  const editor = await ingresar(navegador, "editor@ejemplo.test", clave);
  await capturar(editor.pagina, "02-inicio-editor");
  await ir(editor.pagina, "/admin/contenido/noticia/add/");
  await capturar(editor.pagina, "03-noticia-nueva", { alto: 1500 });
  await ir(editor.pagina, "/admin/contenido/noticia/");
  await capturar(editor.pagina, "04-lista-noticias", { alto: 800 });
  await ir(editor.pagina, "/admin/contenido/evento/add/");
  await capturar(editor.pagina, "05-evento-nuevo", { alto: 1100 });
  await editor.contexto.close();

  // Aprobador
  const aprobador = await ingresar(navegador, "aprobador@ejemplo.test", clave);
  await capturar(aprobador.pagina, "06-inicio-aprobador");
  const enRevision = await idDe(aprobador.pagina, "/admin/contenido/noticia/?estado__exact=revision", "Convenio");
  if (enRevision) {
    await ir(aprobador.pagina, enRevision);
    await aprobador.pagina.evaluate(() =>
      document.querySelector("fieldset:last-of-type")?.scrollIntoView(),
    );
    await capturar(aprobador.pagina, "07-revisar-noticia", { selector: "fieldset:last-of-type" });
  }
  await ir(aprobador.pagina, "/admin/contenido/datosgenerales/");
  await capturar(aprobador.pagina, "08-datos-generales", { alto: 1300 });
  const carrera = await idDe(aprobador.pagina, "/admin/contenido/carrera/", "Enfermería");
  if (carrera) {
    await ir(aprobador.pagina, carrera);
    await aprobador.pagina.evaluate(() => document.querySelector(".inline-group")?.scrollIntoView());
    await capturar(aprobador.pagina, "09-carrera-pensum", { selector: ".inline-group" });
  }
  await ir(aprobador.pagina, "/admin/contenido/documento/add/");
  await capturar(aprobador.pagina, "10-documento-nuevo", { alto: 1000 });
  const album = await idDe(aprobador.pagina, "/admin/contenido/album/", "sede");
  if (album) {
    await ir(aprobador.pagina, album);
    await capturar(aprobador.pagina, "11-galeria", { alto: 1100 });
  }
  await ir(aprobador.pagina, "/admin/formularios/solicitudinformacion/");
  await capturar(aprobador.pagina, "12-solicitudes", { alto: 700 });
  await aprobador.contexto.close();

  // Administrador técnico: asignar roles
  const admin = await ingresar(navegador, "admin@ejemplo.test", clave);
  const usuario = await idDe(admin.pagina, "/admin/usuarios/usuario/", "editor@ejemplo.test");
  if (usuario) {
    await ir(admin.pagina, usuario);
    await admin.pagina.evaluate(() =>
      document.querySelector("#id_groups")?.closest("fieldset")?.scrollIntoView(),
    );
    await capturar(admin.pagina, "13-usuario-roles", {
      selector: "fieldset:has(#id_groups), fieldset:has(#id_groups_from)",
    });
  }
  await admin.contexto.close();
} finally {
  await navegador.close();
}
