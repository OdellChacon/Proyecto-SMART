/**
 * Genera favicon.ico y los PNG de la app a partir de public/favicon.svg.
 * Cuando llegue el logo oficial, reemplaza el SVG y ejecuta: npm run iconos
 */
import { readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

import sharp from "sharp";

const publico = fileURLToPath(new URL("../public/", import.meta.url));
const svg = await readFile(`${publico}favicon.svg`);

const png = (tamano) =>
  sharp(svg, { density: 72 * Math.ceil(tamano / 64) * 4 })
    .resize(tamano, tamano)
    .png({ compressionLevel: 9 })
    .toBuffer();

// ICO con imágenes PNG embebidas (válido en todos los navegadores actuales y Windows).
async function ico(tamanos) {
  const imagenes = await Promise.all(tamanos.map(png));
  const cabecera = Buffer.alloc(6 + 16 * imagenes.length);
  cabecera.writeUInt16LE(0, 0);
  cabecera.writeUInt16LE(1, 2); // tipo: ícono
  cabecera.writeUInt16LE(imagenes.length, 4);
  let desplazamiento = cabecera.length;
  imagenes.forEach((datos, i) => {
    const t = tamanos[i];
    const base = 6 + 16 * i;
    cabecera.writeUInt8(t >= 256 ? 0 : t, base);
    cabecera.writeUInt8(t >= 256 ? 0 : t, base + 1);
    cabecera.writeUInt8(0, base + 2); // sin paleta
    cabecera.writeUInt8(0, base + 3);
    cabecera.writeUInt16LE(1, base + 4); // planos
    cabecera.writeUInt16LE(32, base + 6); // bits por píxel
    cabecera.writeUInt32LE(datos.length, base + 8);
    cabecera.writeUInt32LE(desplazamiento, base + 12);
    desplazamiento += datos.length;
  });
  return Buffer.concat([cabecera, ...imagenes]);
}

await writeFile(`${publico}favicon.ico`, await ico([16, 32, 48]));
await writeFile(`${publico}apple-touch-icon.png`, await png(180));
await writeFile(`${publico}icono-192.png`, await png(192));
await writeFile(`${publico}icono-512.png`, await png(512));
console.log("Íconos generados en frontend/public/");
