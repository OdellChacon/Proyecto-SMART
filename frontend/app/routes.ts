import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

// Direcciones en español y fijas (ver "Direcciones URL fijas" del documento de construcción):
// el ministerio, Google y otros sitios enlazarán a ellas, así que no se cambian.
export default [
  layout("routes/_sitio.tsx", [
    index("routes/inicio.tsx"),

    route("la-universidad", "routes/universidad/presentacion.tsx"),
    route("la-universidad/historia", "routes/universidad/historia.tsx"),
    route("la-universidad/mision-vision-valores", "routes/universidad/mision.tsx"),
    route("la-universidad/autoridades", "routes/universidad/autoridades.tsx"),
    route("la-universidad/organigrama", "routes/universidad/organigrama.tsx"),
    route("la-universidad/sede", "routes/universidad/sede.tsx"),

    route("carreras", "routes/carreras.tsx"),
    route("carreras/:slug", "routes/carrera.tsx"),

    route("admision", "routes/admision.tsx"),
    route("admision/solicitar-informacion", "routes/solicitar-informacion.tsx"),

    route("noticias", "routes/noticias.tsx"),
    route("noticias/:slug", "routes/noticia.tsx"),
    route("eventos", "routes/eventos.tsx"),
    route("galeria", "routes/galeria.tsx"),
    route("galeria/:id", "routes/album.tsx"),

    route("normativa", "routes/normativa.tsx"),
    route("normativa/:categoria", "routes/normativa-categoria.tsx"),

    route("contacto", "routes/contacto.tsx"),
    route("buscar", "routes/buscar.tsx"),
    route("privacidad", "routes/privacidad.tsx"),

    // Accesos a los sistemas académicos: «Próximamente» en esta fase.
    route("control-de-estudios", "routes/proximamente.tsx", { id: "control-de-estudios" }),
    route("aula-virtual", "routes/proximamente.tsx", { id: "aula-virtual" }),

    route("*", "routes/no-encontrada.tsx"),
  ]),

  // Cuenta (diseño propio, sin el menú del sitio).
  layout("routes/_cuenta.tsx", [
    route("ingresar", "routes/ingresar.tsx"),
    route("registro", "routes/registro.tsx"),
    route("recuperar-contrasena", "routes/recuperar-contrasena.tsx"),
    route("restablecer-contrasena/:uid/:token", "routes/restablecer-contrasena.tsx"),
    route("verificar-correo/:uid/:token", "routes/verificar-correo.tsx"),
  ]),
  route("cuenta", "routes/cuenta.tsx"),

  route("sitemap.xml", "routes/sitemap.ts"),
  route("robots.txt", "routes/robots.ts"),
] satisfies RouteConfig;
