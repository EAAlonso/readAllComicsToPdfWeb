document.addEventListener("DOMContentLoaded", () => {
  const urlInput = document.getElementById("url");
  const generateBtn = document.getElementById("generate");
  const status = document.getElementById("status");
  const progress = document.getElementById("progress");
  const log = document.getElementById("log");

  function appendLog(msg) {
    const t = new Date().toLocaleTimeString();
    log.textContent = `${t} — ${msg}\n${log.textContent}`;
  }

  function setStatus(s) {
    status.textContent = "Estado: " + s;
  }

  generateBtn.addEventListener("click", async () => {
    const url = urlInput.value.trim();
    if (!url) {
      appendLog("Introduce una URL válida.");
      return;
    }

    generateBtn.disabled = true;
    setStatus("Descargando página...");
    progress.value = 0;
    appendLog("Iniciando generación para: " + url);

    try {
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
// This file is intentionally left blank.
