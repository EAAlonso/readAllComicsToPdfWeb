# Generador de PDF para ReadAllComics (Web Client)

Aplicación web estática que convierte páginas de cómics (readallcomics.com) a PDF descargable directamente desde el navegador.

## 🚀 Características

- ✨ **Cliente puro** (HTML/CSS/JavaScript) — no requiere servidor backend
- 📱 **Interfaz simple** con barra de progreso en tiempo real
- 🌙 **Modo oscuro** por defecto
- 📦 Usa [pdf-lib](https://pdf-lib.js.org/) para generar PDFs en el navegador
- 🔧 **Soporte de proxy opcional** para evitar bloqueos CORS

## 🛠️ Instalación y Uso Local

### Opción 1: Con Node.js (recomendado)

```powershell
# Instalar dependencias
cd readAllComicsToPdfWeb
npm install

# Levantar servidor de desarrollo
npm start
```

El navegador se abrirá automáticamente en `http://127.0.0.1:8080`.

### Opción 2: Con Python (sin npm)

```powershell
cd readAllComicsToPdfWeb
python -m http.server 8080
```

Luego abre `http://localhost:8080` en tu navegador.

---

## ⚠️ Problema de CORS y Solución

### El Problema

Cuando intentas generar un PDF desde el navegador, verás este error en la consola:

```
Access to fetch at 'https://readallcomics.com/...' from origin '...'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header
is present on the requested resource.
```

**Causa**: Los navegadores bloquean peticiones cross-origin (CORS) a sitios que no permiten acceso externo. ReadAllComics.com no devuelve headers CORS, por lo que el fetch() falla.

### La Solución: Proxy Serverless

Necesitas un **proxy serverless** que haga la petición desde el servidor (donde no aplica CORS) y devuelva el resultado con headers CORS habilitados.

---

## 🔧 Configurar el Proxy (Cloudflare Workers)

### Paso 1: Crear una cuenta en Cloudflare Workers

1. Ve a [https://workers.cloudflare.com/](https://workers.cloudflare.com/)
2. Crea una cuenta gratuita (incluye 100,000 peticiones/día gratis)
3. Accede al Dashboard de Workers

### Paso 2: Crear un nuevo Worker

1. En el Dashboard, haz clic en **"Create a Service"** (o "Create a Worker")
2. Dale un nombre, por ejemplo: `readallcomics-proxy`
3. Haz clic en **"Create service"**

### Paso 3: Pegar el código del proxy

1. En el editor del Worker, **borra todo el código** que viene por defecto
2. Copia el contenido del archivo `workers/cloudflare_proxy.js` de este repo
3. Pégalo en el editor
4. Haz clic en **"Save and Deploy"**

El código del proxy está en: [`workers/cloudflare_proxy.js`](./workers/cloudflare_proxy.js)

### Paso 4: Copiar la URL del Worker

Una vez desplegado, Cloudflare te mostrará una URL como:

```
https://readallcomics-proxy.tu-usuario.workers.dev
```

**Copia esa URL** — la necesitarás en el siguiente paso.

### Paso 5: Usar el proxy en la aplicación

1. Abre la aplicación web (local o en GitHub Pages)
2. En el campo **"Proxy opcional (serverless) para evitar CORS"** pega la URL del Worker:
   ```
   https://readallcomics-proxy.tu-usuario.workers.dev
   ```
3. Pega la URL del cómic en el campo principal
4. Haz clic en **"Generar PDF"**

**¡Listo!** Ahora las peticiones pasarán por tu Worker y no serán bloqueadas por CORS.

---

## 📦 Publicar en GitHub Pages

### Opción A: Desde Settings (manual)

1. Empuja tu código a GitHub:

   ```powershell
   git add .
   git commit -m "Ready for GitHub Pages"
   git push origin develop
   ```

2. Ve a **Settings** → **Pages** en tu repositorio de GitHub

3. En **"Source"**, selecciona:

   - Branch: `develop` (o `main`)
   - Folder: `/ (root)`

4. Haz clic en **Save**

5. GitHub publicará tu sitio en:
   ```
   https://<tu-usuario>.github.io/readAllComicsToPdfWeb/
   ```

### Opción B: Con GitHub Actions (automático)

Crea el archivo `.github/workflows/pages.yml` con este contenido:

```yaml
name: Deploy to GitHub Pages

on:
  push:
    branches: [develop]

permissions:
  contents: read
  pages: write
  id-token: write

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Pages
        uses: actions/configure-pages@v3
      - name: Upload artifact
        uses: actions/upload-pages-artifact@v2
        with:
          path: "."
      - name: Deploy to GitHub Pages
        id: deployment
        uses: actions/deploy-pages@v2
```

Luego, en **Settings** → **Pages**, cambia **Source** a:

- **GitHub Actions**

Cada push a `develop` desplegará automáticamente.

---

## 🎨 Estructura del Proyecto

```
readAllComicsToPdfWeb/
├── index.html              # UI principal
├── css/
│   └── styles.css          # Estilos (modo oscuro)
├── js/
│   ├── main.js             # Lógica de UI y eventos
│   └── pdf_generator.js    # Generador de PDF (fetch, parseo, pdf-lib)
├── workers/
│   └── cloudflare_proxy.js # Código del proxy para Cloudflare Workers
├── package.json            # Dependencias dev (live-server)
└── README.md               # Este archivo
```

---

## 📝 Uso

1. **Abre la aplicación** (local o GitHub Pages)
2. **Configura el proxy** (si es la primera vez):
   - Pega la URL de tu Cloudflare Worker en el campo "Proxy opcional"
3. **Pega la URL del cómic**:
   - Ejemplo: `https://readallcomics.com/texarcanum-04-of-04-2025/`
4. **Haz clic en "Generar PDF"**
5. **Observa el progreso** en la barra y los mensajes
6. **Descarga automática** del PDF al terminar

---

## 🐛 Solución de Problemas

### Error: "window.createPdfFromUrl is not a function"

- **Causa**: Los scripts no se cargaron correctamente
- **Solución**: Recarga la página (Ctrl+F5) y verifica la consola

### Error: "Failed to fetch ... CORS"

- **Causa**: No configuraste el proxy o la URL del proxy es incorrecta
- **Solución**: Sigue los pasos de "Configurar el Proxy" arriba

### Error: "No se encontraron imágenes"

- **Causa**: La página no tiene imágenes o están cargadas por JavaScript
- **Solución**: Verifica la URL; algunas páginas usan lazy-loading

### El PDF está vacío o tiene pocas páginas

- **Causa**: Imágenes bloqueadas por CORS o formatos no soportados
- **Solución**: Revisa la consola para ver qué imágenes fallaron

---

## 🔒 Seguridad y Privacidad

- **Cliente puro**: Toda la generación ocurre en tu navegador
- **Proxy**: Solo se usa para evitar CORS; no almacena datos
- **Recomendación**: Usa tu propio Worker para controlar qué datos pasan por él

---

## 📄 Licencia

MIT License — ver archivo [LICENSE](./LICENSE)

---

## 🙋 Preguntas Frecuentes

**¿Necesito instalar algo?**

- No (si usas GitHub Pages o Python local)
- Sí Node.js (si quieres usar `npm start`)

**¿Funciona sin proxy?**

- No, porque readallcomics.com bloquea CORS

**¿Cuánto cuesta el proxy?**

- Cloudflare Workers: 100,000 peticiones/día GRATIS

**¿Puedo usar otro proxy?**

- Sí: Netlify Functions, Vercel Edge, o cualquier servidor que acepte `?url=...`

---

## 🚀 Próximos Pasos

- [ ] Añadir soporte para más sitios (no solo readallcomics)
- [ ] Implementar cache en el Worker para optimizar
- [ ] Añadir redimensionado de imágenes para PDFs más ligeros
- [ ] Soporte para lazy-loaded images (headless browser)

---

**Hecho con ❤️ usando HTML, CSS, JavaScript y pdf-lib**
