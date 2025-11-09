// Cliente: extrae imágenes desde una URL y construye un PDF usando pdf-lib
// Exporta createPdfFromUrl(url, onProgress) -> Promise<{blob, title}>

async function fetchText(url) {
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} al obtener ${url}`);
  return await r.text();
}

function log(msg) {
  // simple hook si se quiere conectar con UI
  console.log("[pdf_generator] ", msg);
}

function extractNumberFromFilename(name) {
  const m = name.match(/(\d+)/);
  return m ? parseInt(m[1], 10) : 0;
}

async function createPdfFromUrl(url, onProgress) {
  // onProgress(current, total)
  log("Starting createPdfFromUrl for " + url);

  let html;
  try {
    html = await fetchText(url);
  } catch (e) {
    throw new Error(
      "No se pudo descargar la página: " +
        e.message +
        "\n(Si ves un error de CORS, la página no permite peticiones desde el navegador.)"
    );
  }

  const parser = new DOMParser();
  const doc = parser.parseFromString(html, "text/html");
  const pageTitle =
    (doc.querySelector("title") && doc.querySelector("title").textContent) ||
    url;

  // Buscar imágenes
  const imgTags = Array.from(doc.querySelectorAll("img"));
  let imgUrls = imgTags.map((img) => img.getAttribute("src")).filter(Boolean);

  // Filtrar y normalizar URLs
  imgUrls = imgUrls
    .filter((u) => !/logo/i.test(u))
    .map((u) => {
      try {
        return new URL(u, url).toString();
      } catch (e) {
        return null;
      }
    })
    .filter(Boolean);

  // Orden por número en el filename (heurística del script Python)
  imgUrls = imgUrls.sort(
    (a, b) => extractNumberFromFilename(a) - extractNumberFromFilename(b)
  );

  if (imgUrls.length === 0)
    throw new Error("No se encontraron imágenes en la página.");

  // Igual que en Python: eliminar últimas 2 si hay >2
  if (imgUrls.length > 2) imgUrls = imgUrls.slice(0, imgUrls.length - 2);

  const total = imgUrls.length;

  // Crear PDF con pdf-lib
  const pdfDoc = await PDFLib.PDFDocument.create();

  let processed = 0;
  for (let i = 0; i < imgUrls.length; i++) {
    const imgUrl = imgUrls[i];
    try {
      const imgResp = await fetch(imgUrl);
      if (!imgResp.ok) {
        console.warn("Imagen no encontrada", imgUrl, imgResp.status);
        continue;
      }
      const arrayBuffer = await imgResp.arrayBuffer();
      const u8 = new Uint8Array(arrayBuffer);

      // Intentar PNG primero, si falla intentar JPG
      let embeddedImage;
      try {
        embeddedImage = await pdfDoc.embedPng(u8);
      } catch (e) {
        try {
          embeddedImage = await pdfDoc.embedJpg(u8);
        } catch (e2) {
          throw new Error("Formato de imagen no soportado para: " + imgUrl);
        }
      }

      const dims = embeddedImage.scale(1);
      const page = pdfDoc.addPage([dims.width, dims.height]);
      page.drawImage(embeddedImage, {
        x: 0,
        y: 0,
        width: dims.width,
        height: dims.height,
      });

      processed += 1;
      if (onProgress) onProgress(processed, total);
    } catch (err) {
      console.warn("Error procesando imagen", imgUrl, err);
      // continuar con siguiente
    }
  }

  if (processed === 0)
    throw new Error("No se pudieron procesar imágenes para generar el PDF.");

  const pdfBytes = await pdfDoc.save();
  const blob = new Blob([pdfBytes], { type: "application/pdf" });
  return { blob, title: pageTitle };
}

// Make available globally for the simple script usage
window.createPdfFromUrl = createPdfFromUrl;
