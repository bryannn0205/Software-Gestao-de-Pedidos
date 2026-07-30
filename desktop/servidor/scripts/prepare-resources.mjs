// Copia os builds de backend e frontend para desktop/servidor/resources,
// prontos para o electron-builder empacotar (ou para "npm start" local).
// Roda antes de "start" e "dist" (prestart/predist no package.json).
import { cpSync, rmSync, existsSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const desktopDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const rootDir = path.resolve(desktopDir, "..", "..");
const resourcesDir = path.join(desktopDir, "resources");

const backendSrc = path.join(rootDir, "backend");
const frontendDistSrc = path.join(rootDir, "frontend", "dist");

if (!existsSync(path.join(backendSrc, "dist"))) {
  throw new Error("backend/dist não existe — rode 'npm run build' no backend antes.");
}
if (!existsSync(frontendDistSrc)) {
  throw new Error("frontend/dist não existe — rode 'npm run build' no frontend antes.");
}

rmSync(resourcesDir, { recursive: true, force: true });
mkdirSync(resourcesDir, { recursive: true });

const backendDest = path.join(resourcesDir, "backend");
mkdirSync(backendDest, { recursive: true });
cpSync(path.join(backendSrc, "dist"), path.join(backendDest, "dist"), { recursive: true });
cpSync(path.join(backendSrc, "node_modules"), path.join(backendDest, "node_modules"), { recursive: true });
cpSync(path.join(backendSrc, "prisma"), path.join(backendDest, "prisma"), { recursive: true });
cpSync(path.join(backendSrc, "package.json"), path.join(backendDest, "package.json"));

cpSync(frontendDistSrc, path.join(resourcesDir, "frontend"), { recursive: true });

console.log("Resources preparados em", resourcesDir);
