# TallerPro v5.0 — PWA para Vercel

Sistema de gestión para talleres de reparación de celulares.  
**100% local, offline-first, sin backend, sin servidor.**

## Despliegue en Vercel

### Opción A — Vercel CLI (más rápido)
```bash
npm i -g vercel
cd taller-pwa
vercel --prod
```

### Opción B — GitHub + Vercel Dashboard
1. Sube este repositorio a GitHub.
2. Ve a [vercel.com](https://vercel.com) → New Project → Import.
3. Configuración de Build:
   - **Framework Preset**: Vite
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`
4. Deploy.

## Desarrollo local
```bash
npm install
npm run dev
```

## Acceso demo
- **Email**: `admin@taller.co`
- **Contraseña**: `admin123`

## Módulos
| Módulo | Roles |
|--------|-------|
| Dashboard | ADM, CON, TEC, REC, AUD |
| Clientes | Todos |
| Órdenes | Todos |
| Inventario | Todos |
| Caja | ADM, CON |
| Reportes | Todos |
| Configuración | Solo ADM |

## Datos
Todos los datos se persisten en `localStorage` del navegador.  
Usa **Configuración → Backup y Datos** para exportar/importar.

## Stack
- React 18 + Vite 5
- TailwindCSS 3
- Lucide React (iconos)
- localStorage (DB local)
- Service Worker (offline-first)
