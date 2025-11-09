document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("url");
  const generateBtn = document.getElementById("generate");
  const status = document.getElementById("status");
  const progress = document.getElementById("progress");
  const log = document.getElementById("log");
  const darkToggle = document.getElementById("darkToggle");

  function appendLog(msg) {
    const t = new Date().toLocaleTimeString();
    log.textContent = `${t} — ${msg}\n${log.textContent}`;
  }

  function setStatus(s) {
    status.textContent = "Estado: " + s;
  }

  // Dark mode toggle
  if (darkToggle) {
    darkToggle.addEventListener("click", () => {
      document.body.classList.toggle("dark");
      darkToggle.textContent = document.body.classList.contains("dark")
        ? "☀️"
        : "🌙";
    });
  }

  // Early check: ensure the pdf generator function exists
  if (typeof window.createPdfFromUrl !== "function") {
    appendLog(
      "Error: la función createPdfFromUrl no está disponible. Revisa que js/pdf_generator.js y pdf-lib se carguen correctamente."
    );
    console.error("window.createPdfFromUrl is not a function");
    setStatus("Error — revisa los mensajes");
    // keep the generate button available but warn on click
  }

  generateBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    // read proxy input if provided
    const proxyInput = document.getElementById("proxy");
    if (proxyInput && proxyInput.value.trim()) {
      window.PROXY_URL = proxyInput.value.trim();
      appendLog("Usando proxy: " + window.PROXY_URL);
    } else {
      window.PROXY_URL = undefined;
    }
    if (!url) {
      appendLog("Introduce una URL válida.");
      return;
    }

    generateBtn.disabled = true;
    setStatus("Descargando página...");
    progress.value = 0;
    appendLog("Iniciando generación para: " + url);

    try {
      if (typeof window.createPdfFromUrl !== "function") {
        throw new Error(
          "La función createPdfFromUrl no está disponible. Comprueba la consola para más detalles."
        );
      }
      const onProgress = (current, total) => {
        const percent = Math.round((current / total) * 100);
        progress.value = percent;
        setStatus(`Procesadas ${current}/${total} imágenes (${percent}%)`);
      };

      const result = await window.createPdfFromUrl(url, onProgress);
      setStatus("Generación completa — preparando descarga");

      // Crear enlace de descarga
      const filenameBase = (result.title || "comic")
        .replace(/[\\/:*?"<>|]+/g, "")
        .split("|")[0]
        .trim();
      const filename = filenameBase ? `${filenameBase}.pdf` : "comic.pdf";

      const blobUrl = URL.createObjectURL(result.blob);
      const a = document.createElement("a");
      a.href = blobUrl;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(blobUrl);

      appendLog("Descarga iniciada: " + filename);
      setStatus("Listo");
    } catch (err) {
      console.error(err);
      appendLog("Error: " + err.message);
      setStatus("Error — revisa los mensajes");
    } finally {
      generateBtn.disabled = false;
      progress.value = 0;
    }
  });
});
