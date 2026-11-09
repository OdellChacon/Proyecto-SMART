import type { Config } from "@react-router/dev/config";

export default {
  // Render en servidor: Google y el ministerio reciben HTML completo.
  // Las pantallas de cuenta piden sus datos desde el navegador (clientLoader),
  // porque la sesión vive en una cookie que solo conoce el navegador.
  ssr: true,
} satisfies Config;
