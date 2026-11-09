# Plataforma universitaria

Monorepo del sitio web institucional y, más adelante, de control de estudios, aula virtual y app móvil.
Un solo backend (Django + DRF) y una sola base de datos (PostgreSQL) para todo.

> Nombre provisional. Se reemplaza por las siglas de la universidad cuando estén definidas.

## Estado

| Módulo | Estado |
|---|---|
| Sitio público: todas las páginas del mapa del sitio, buscador y formularios | ✅ Listo, con contenido de ejemplo |
| Panel de contenido con roles Editor / Aprobador y flujo de publicación | ✅ Listo |
| Imágenes en tres medidas WebP, calendario de eventos, fechas y costos de admisión | ✅ Listo |
| Producción preparada: Render, R2, analítica, respaldos con prueba de restauración | ✅ Listo para desplegar |
| Cuentas: registro, verificación de correo, ingreso, salida, recuperación de contraseña | ✅ Listo |
| Roles: Estudiante, Docente, Administrativo | ✅ Listo (se asignan desde el panel) |
| Control de estudios, aula virtual, app móvil | Fases posteriores |

## Estructura

```
plataforma-universitaria/
├── backend/                 Django 5.2 LTS + Django REST Framework
│   ├── config/settings/     base · dev · test · prod
│   ├── apps/contenido/      carreras, pensum, noticias, eventos, avisos, documentos, galería…
│   ├── apps/formularios/    contacto y solicitud de información (aviso por correo)
│   ├── apps/usuarios/       usuario, roles, correos, API de cuenta
│   └── tests/
├── frontend/                React Router 7 (render en servidor) + TypeScript + Tailwind 4
│   ├── app/routes/          una pantalla por archivo
│   ├── app/components/ui/   componentes del sistema de diseño
│   ├── app/styles/tokens.css  colores, tipografía y forma (espejo de Figma)
│   └── public/              favicon e íconos (generados con `npm run iconos`)
├── docs/manual-del-panel.md manual visual para el personal (capturas en docs/manual/img)
├── infra/respaldos/         respaldo diario, restauración y prueba de restauración
├── render.yaml              despliegue en Render (web pública + API privada + base + respaldos)
├── docker-compose.yml       PostgreSQL 17 + Mailpit (correo de pruebas)
└── .env.example             todas las variables, sin secretos
```

## Requisitos

- Docker Desktop
- Python 3.12 o superior (probado con 3.14)
- Node.js 20.19 o superior

## Puesta en marcha

```bash
cp .env.example .env
```

Edita `.env` y cambia `POSTGRES_PASSWORD` y `DJANGO_SECRET_KEY`. Para generar una clave:

```bash
python -c "import secrets; print(secrets.token_urlsafe(50))"
```

Levanta la base de datos y el buzón de correo:

```bash
docker compose up -d
```

Backend (en una terminal):

```bash
cd backend
python -m venv .venv
.venv/Scripts/activate        # Windows · en macOS/Linux: source .venv/bin/activate
pip install -r requirements/dev.txt
python manage.py migrate
python manage.py cargar_contenido_ejemplo   # contenido de ejemplo para presentar el sitio
python manage.py crear_usuarios_demo        # admin, aprobador y editor de prueba (clave: DEMO_CLAVE_PANEL)
python manage.py createsuperuser
python manage.py runserver 127.0.0.1:8077
```

Frontend (en otra terminal):

```bash
cd frontend
npm install
npm run dev
```

| Servicio | Dirección |
|---|---|
| Sitio | http://localhost:5180 |
| Panel de administración | http://localhost:5180/admin/ |
| API · documentación (solo en desarrollo) | http://127.0.0.1:8077/api/docs/ |
| Correos enviados (Mailpit) | http://localhost:8026 |
| PostgreSQL | 127.0.0.1:5435 |

Los puertos evitan los que usan los otros proyectos de GrupoZenith en esta máquina. El servidor de
Vite reenvía `/api`, `/admin` y `/static` a Django, así que el navegador ve un solo origen: la cookie
de sesión y la protección CSRF funcionan sin configurar CORS.

> Usa `127.0.0.1` y no `localhost` para la base de datos y el correo: en Windows, `localhost`
> intenta primero IPv6 y, como los contenedores solo escuchan en IPv4, cada conexión se queda
> esperando varios segundos.

## Sitio público

Las páginas y sus direcciones siguen el mapa del sitio del documento de construcción y **no se
editan desde el panel** (así nadie rompe el diseño por accidente):

| Sección | Direcciones |
|---|---|
| Inicio | `/` |
| La Universidad | `/la-universidad`, `/historia`, `/mision-vision-valores`, `/autoridades`, `/organigrama`, `/sede` (bajo `/la-universidad/`) |
| Carreras | `/carreras`, `/carreras/<slug>` (ficha + pensum por semestre + PDF) |
| Admisión | `/admision`, `/admision/solicitar-informacion` |
| Noticias y eventos | `/noticias`, `/noticias/<slug>`, `/eventos`, `/galeria`, `/galeria/<id>` |
| Normativa | `/normativa`, `/normativa/<categoria>` |
| Contacto y otras | `/contacto`, `/buscar?q=`, `/privacidad`, `/control-de-estudios` y `/aula-virtual` (Próximamente) |
| Para buscadores | `/sitemap.xml`, `/robots.txt`, datos estructurados de organización educativa en la portada |

Todo lo que cambia (noticias, autoridades, carreras, pensum, documentos, fotos, datos de contacto,
misión, requisitos…) se edita en el panel: <http://localhost:5180/admin/>.

### Diseño

| | |
|---|---|
| Colores | Azul marino `#0f2a47` (marca, cabecera y pie) y terracota `#b5462a` (acento: botón principal y detalles), sobre fondo cálido `#f7f5f1`. Están en `frontend/app/styles/tokens.css`: al llegar la identidad oficial se cambian ahí. |
| Letra | Source Serif 4 (títulos) y Source Sans 3 (texto e interfaz), autoalojadas. |
| Formas | Tarjetas con borde y esquinas redondeadas, foto a color en carreras y noticias, portada con foto de la sede bajo un degradado azul. |

El panel también guarda las **cifras** de la institución (*Datos generales › cifras*), las **fotos
de cabecera por sección** (*Fotos de sección*) y el **álbum de cada carrera**. El diseño actual no
los muestra todavía; están listos por si se quieren usar más adelante.

### Interactividad

- **Buscador con sugerencias** en el encabezado (y dentro del menú del teléfono): agrupa páginas,
  carreras, noticias y documentos mientras se escribe; se maneja con flechas, Enter y Escape. Sin
  JavaScript sigue siendo un formulario normal hacia `/buscar`.
- **Menú con desplegables** en escritorio (al pasar el puntero o con el botón de flecha) y menú del
  teléfono con secciones plegables; ambos se cierran con Escape o al tocar fuera.
- **Barra de carga** fina al cambiar de página y **fundido corto** al entrar a cada página (solo al
  navegar, no en la primera carga). Todo se desactiva con «reducir movimiento».
- **Normativa:** filtro instantáneo de documentos por nombre, formato y orden.
- **Carreras:** pensum plegable por semestre con «Abrir todos».
- **Galería:** visor con flechas del teclado, deslizar con el dedo y precarga de las fotos vecinas.
- **Noticias:** botón para compartir (menú del sistema en el teléfono, copiar enlace en la computadora).
- **Formularios:** contador de caracteres en los mensajes largos y caja que crece con el texto.
- **Avisos:** lista sobria bajo la portada (punto, texto y vencimiento, sin cajas). Si vence en una
  semana o menos, el punto y la fecha pasan a terracota («Último día», «Vence mañana», «Quedan N
  días»). Cada aviso se puede ocultar; lo ocultado se recuerda en ese navegador y se puede volver a
  mostrar. La API entrega `dias_restantes` calculado con la fecha del servidor. Los mensajes de los
  formularios (éxito, error, información, advertencia) usan un borde fino y pueden cerrarse.
- **Portada:** las carreras se muestran como un índice numerado (foto, nombre, resumen y ficha
  corta) junto a una presentación que queda fija al bajar; «¿Cómo ingresar?» une los pasos con una
  línea (horizontal en pantallas anchas, vertical en el teléfono) y muestra debajo el calendario de
  admisión con las fechas que aún no terminaron (máximo cuatro, tomadas de *Admisión* en el panel).
  En «Noticias y eventos», la noticia más reciente va grande y las tres siguientes en filas con
  miniatura; debajo, una agenda de los cuatro próximos eventos que marca «Hoy», «Mañana» o
  «En N días» cuando falta menos de una semana y enlaza al evento en el calendario.
- **Pie:** compacto, en una sola franja (marca y dirección, contacto, secciones y accesos) con una
  línea terracota arriba y, al final, derechos y enlaces legales. Las subsecciones no se repiten:
  ya están en el menú y en cada página.
- **Datos estructurados** (`CollegeOrUniversity`): van en la capa del sitio (`routes/_sitio.tsx`), en
  el HTML del servidor, y no en el `<head>` de la portada. Así React nunca inserta ni quita un
  `<script>` al navegar; algunas extensiones del navegador interceptan esa operación y rompían la página.
- **Tarjetas:** un solo estilo para todo el sitio (`components/ui/Tarjeta.tsx`): borde fino, sin
  sombra en reposo; al pasar el puntero, borde algo más oscuro, sombra muy suave, la foto se acerca
  un poco y una línea terracota crece al pie. Con teclado, la tarjeta entera muestra el contorno de foco.
- Los enlaces precargan la página siguiente al pasar el puntero (`prefetch="intent"`), y en páginas
  largas aparece **Volver arriba**.

### Contenido de ejemplo

`cargar_contenido_ejemplo` llena el sitio para poder presentarlo antes de tener el contenido oficial.
**No inventa datos de la universidad:** nombre, dirección, teléfonos, títulos, duración, modalidad,
autoridades y montos quedan como «Por confirmar»; el pensum, las fechas y los documentos están
marcados como ejemplo. Las fotos son **fotos de referencia de dominio público** (CC0/PDM, vía
Openverse, Wikimedia Commons y rawpixel; 30 fotos, ver
`backend/apps/contenido/fotos_ejemplo/CREDITOS.md`) y se describen como tales. Se descartaron las
que mostraban el nombre de otra institución, militares, políticos o graduaciones (la universidad
todavía no tiene egresados). Las
autoridades no llevan foto a propósito: poner la cara de una persona real como si fuera rector
sería engañoso. Mientras esté marcado *Datos generales › mostrar aviso de demostración*, el sitio
muestra una franja que lo dice. Para volver a empezar: `cargar_contenido_ejemplo --reiniciar`
(borra **todo** el contenido del sitio).

### Formularios

Contacto y solicitud de información se guardan en la base de datos (*Panel › Formularios
recibidos*) y avisan por correo a `CORREOS_AVISO_FORMULARIOS`; al responder ese correo se le escribe
directo a la persona. Tienen validación en el navegador y en el servidor, protección CSRF, límite de
10 envíos por hora por IP y antispam con Cloudflare Turnstile cuando se configuran
`TURNSTILE_SECRET_KEY` y `VITE_TURNSTILE_SITE_KEY`.

### Panel y flujo de publicación (sección 11 del documento)

| Rol (grupo de Django) | Puede |
|---|---|
| **Editor de contenido** | Crear y editar contenido; publicar directo solo donde no se exige aprobación; borrar sus borradores |
| **Aprobador de contenido** | Todo lo anterior + aprobar o devolver con comentarios, borrar, editar Datos generales y categorías |
| **Administrador técnico** (superusuario) | Todo + cuentas y roles |

Noticias, eventos, avisos y documentos pasan por *borrador → en revisión → publicado* (o
*devuelto con comentarios*). Qué tipos necesitan aprobación se elige en *Datos generales › Flujo
de publicación*. Al enviar a revisión se avisa por correo a los aprobadores; al aprobar o devolver,
al autor. El inicio del panel muestra lo pendiente. Los grupos se crean solos al migrar.

Manual para el personal, con capturas: [docs/manual-del-panel.md](docs/manual-del-panel.md).
Las capturas se regeneran con `cd frontend && npm run capturas-manual` (necesita las cuentas de
`crear_usuarios_demo`).

### Panel: admin de Django en lugar de Wagtail (por ahora)

El documento propone Wagtail. Para esta etapa se usa el admin de Django, ordenado y en español, que
el propio documento menciona como alternativa. Los modelos son tablas normales de Django, así que
si la universidad necesita vista previa, historial de versiones o flujo de aprobación, Wagtail se
puede sumar después registrándolos como *snippets*, sin rehacer la base de datos ni la API.

## Cuentas y roles

- **Registro público.** Quien se registra confirma su correo y entra con el rol **Estudiante**.
- **Docente y Administrativo** los asigna un administrador en *Panel › Usuarios*. Una persona puede
  tener varios roles a la vez (se implementan como grupos de Django, con sus permisos).
- **Administrador técnico** = superusuario (`createsuperuser`).

### Endpoints del sitio (`/api/v1/`, públicos y de solo lectura salvo los formularios)

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `sitio/` | Datos generales: contacto, redes, horario, misión, visión, historia… |
| GET | `carreras/`, `carreras/<slug>/` | Tarjetas de carreras / ficha con pensum agrupado por semestre |
| GET | `noticias/?page=`, `noticias/<slug>/` | Noticias publicadas (las programadas aparecen solas en su fecha) |
| GET | `eventos/?desde=AAAA-MM-DD&hasta=AAAA-MM-DD` | Eventos de un rango (por defecto, desde hoy), incluidos los en curso |
| GET | `avisos/?portada=true` | Avisos vigentes |
| GET | `autoridades/` | Autoridades en su orden |
| GET | `documentos/?categoria=`, `documentos/categorias/` | Documentos descargables y sus categorías |
| GET | `galeria/`, `galeria/<id>/` | Álbumes y sus fotos |
| GET | `admision/` | Requisitos, pasos, preguntas frecuentes, fechas vigentes y costos (si se publican) |
| GET | `buscar/?q=` | Carreras, noticias, documentos y páginas, sin distinguir acentos |
| POST | `solicitudes-informacion/`, `contacto/` | Guarda el formulario y avisa por correo |

Las imágenes llegan como `{url, miniatura, mediana, grande, ancho, alto}`: tres medidas WebP
(480, 960 y 1600 px) que el backend genera la primera vez y guarda. El sitio las usa con `srcset`,
así un teléfono descarga la pequeña.

### Endpoints de cuenta (`/api/v1/auth/`)

| Método | Ruta | Qué hace |
|---|---|---|
| GET | `sesion/` | Estado de la sesión y entrega la cookie CSRF |
| POST | `registro/` | Crea la cuenta y envía el correo de confirmación |
| POST | `verificar-correo/` | Confirma el correo con `uid` y `token` |
| POST | `reenviar-verificacion/` | Reenvía el enlace de confirmación |
| POST | `ingreso/` | Abre la sesión (`recordar` = 14 días; si no, hasta cerrar el navegador) |
| POST | `salida/` | Cierra la sesión |
| POST | `recuperar-contrasena/` | Envía el enlace para crear una contraseña nueva |
| POST | `restablecer-contrasena/validar/` | Comprueba si el enlace sigue vigente |
| POST | `restablecer-contrasena/` | Guarda la contraseña nueva |

Todos los errores tienen la misma forma: `{"detail": "...", "codigo": "...", "errores": {"campo": ["..."]}}`.

### Decisiones de seguridad

- **Sesión por cookie httpOnly**, no tokens en el navegador. Las escrituras exigen el token CSRF,
  también en el ingreso y el registro.
- **Sin enumeración de cuentas:** registro, recuperación y reenvío responden igual exista o no el
  correo. Si alguien intenta registrar un correo que ya existe, se avisa por correo al dueño.
- **Bloqueo tras 5 intentos fallidos** durante 15 minutos (django-axes), por correo + IP.
- **Límites por IP:** ingreso 10/min, registro 5/hora, correos 5/hora. Detrás de Cloudflare y Render,
  ajusta `DJANGO_NUM_PROXIES` para que se use la IP real.
- **Contraseñas:** mínimo 10 caracteres, sin contraseñas comunes, sin solo números y sin parecido
  con el nombre o el correo (validadores de Django).
- **Enlaces firmados de un solo uso** que vencen en 24 horas. No se guardan en la base de datos.
- **Producción** (`config.settings.prod`): HTTPS obligatorio, HSTS y cookies `Secure`.

## Pruebas

```bash
cd backend && pytest          # 58 pruebas (cuenta, contenido, panel y flujo, formularios), contra PostgreSQL
cd backend && ruff check .
cd frontend && npm run typecheck
```

GitHub Actions corre lo mismo en cada pull request (`.github/workflows/ci.yml`).

### Calidad medida (Lighthouse 12, perfil de teléfono con 4G lento)

Medido contra el servidor de producción local (`npm run build && npm start`):

| Página | Rendimiento | Accesibilidad | Buenas prácticas | SEO | LCP |
|---|---|---|---|---|---|
| Inicio | 91 | 100 | 100 | 100 | 3,2 s |
| Carreras | 93 | 100 | 100 | 100 | 3,0 s |
| Enfermería | 93 | 100 | 100 | 100 | 2,9 s |
| Admisión | 93 | 100 | 100 | 100 | 2,9 s |
| Noticias | 92 | 100 | 100 | 100 | 3,0 s |
| Eventos | 93 | 100 | 100 | 100 | 3,0 s |
| Contacto | 91 | 100 | 100 | 100 | 3,1 s |

Cumple los mínimos del documento (rendimiento ≥ 90, accesibilidad ≥ 95, SEO ≥ 95). La portada
queda en 3,2 s frente a la meta de «menos de 3 s» (medido tras el rediseño): en local las fotos
las sirve Django sin caché; en producción salen de R2 detrás de la CDN de Cloudflare. Hay que
volver a medir ya desplegado.

## Producción

Todo está preparado en [`render.yaml`](render.yaml) (Render › New › Blueprint):

- **plataforma-web** (público): `frontend/server.mjs` sirve el sitio y reenvía `/api`, `/admin`,
  `/static` y `/media` a Django. Un solo dominio: cookies y CSRF sin CORS.
- **plataforma-api** (privado): gunicorn + `config.settings.prod` (HTTPS, HSTS, cookies seguras,
  WhiteNoise para los estáticos del panel). `manage.py check --deploy` sin advertencias salvo
  HSTS *preload*, que se activa a propósito solo con el dominio definitivo.
- **plataforma-db**: PostgreSQL 17 administrado (con copias diarias de Render).
- **plataforma-respaldos**: tarea diaria (`infra/respaldos`) que copia la base y los archivos a un
  bucket de R2 aparte y conserva 30 días.

| Servicio | Qué configurar |
|---|---|
| Dominio y CDN | Cloudflare (DNS con proxy) apuntando a plataforma-web |
| Archivos | Bucket de Cloudflare R2: `R2_BUCKET`, `R2_ENDPOINT`, claves y `R2_DOMINIO_PUBLICO` |
| Correo | SMTP de Brevo, Resend u otro: `EMAIL_HOST`, `EMAIL_HOST_USER`, `EMAIL_HOST_PASSWORD`, `DEFAULT_FROM_EMAIL` |
| Antispam | Cloudflare Turnstile: `TURNSTILE_SECRET_KEY` (API) y `VITE_TURNSTILE_SITE_KEY` (web) |
| Analítica | Cloudflare Web Analytics, sin cookies (no necesita banner): `VITE_CF_ANALYTICS_TOKEN` |
| Monitoreo | UptimeRobot o Better Stack contra `https://<dominio>/api/v1/salud/` con aviso por correo |

**Respaldos.** Prueba de restauración en local (respalda, restaura en una base nueva y compara las
filas de cada tabla):

```bash
sh infra/respaldos/probar-restauracion.sh
```

Para restaurar una copia: `DATABASE_URL=... sh infra/respaldos/restaurar.sh base-AAAAMMDD-HHMM.dump`.

## Ícono

`frontend/public/favicon.svg` es la fuente: un birrete con los colores del sistema de diseño
(azul institucional y acento terracota). Cuando llegue el logo oficial, reemplaza el SVG y regenera
`favicon.ico` y los PNG:

```bash
cd frontend && npm run iconos
```

## Pendiente

Lo que depende de la universidad o de cuentas a su nombre:

- **Contenido oficial** (sección 6 del documento): nombre, logo, colores, textos, autoridades,
  pensum aprobado, reglamentos, fotos reales, dirección, mapa, fechas y costos. Al cargarlo,
  desmarcar el aviso de demostración.
- Texto definitivo del aviso de privacidad (hoy es de ejemplo).
- **Cuentas y despliegue**: dominio, Cloudflare, Render, R2, correo transaccional, Turnstile,
  analítica y monitoreo (todo está configurado por variables; falta crear las cuentas y cargar
  las claves).
- Volver a medir con Lighthouse ya desplegado y probar en teléfonos reales.
- Capacitación al personal (el manual está listo).

Técnico:

- Cloudflare Turnstile también en el registro de cuentas.
