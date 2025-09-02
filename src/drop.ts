const readDroppedFileAsText = (event: DragEvent): Promise<string> => {
  return new Promise((resolve, reject) => {
    event.preventDefault();

    const items = event.dataTransfer?.items;
    if (!items || items.length === 0) {
      return reject("Aucun fichier détecté.");
    }

    const file = items[0].getAsFile();
    if (!file) {
      return reject("Impossible de récupérer le fichier.");
    }

    const reader = new FileReader();

    reader.onload = () => {
      resolve(reader.result as string);
    };

    reader.onerror = () => {
      reject(reader.error);
    };

    reader.readAsText(file);
  });
};

export const manageDropZone = () => {
  const dropZone = document.getElementById("app");

  if (dropZone) {
    dropZone.addEventListener("dragover", (event) => {
      event.preventDefault();
    });

    dropZone.addEventListener("drop", async (event) => {
      try {
        const text = await readDroppedFileAsText(event);
        const customEvent = new CustomEvent("gpxDroped", {
          detail: { content: text },
        });
        window.dispatchEvent(customEvent);
      } catch (error) {
        console.error("Erreur :", error);
      }
    });
  }

  window.addEventListener("dragover", (e) => {
    e.preventDefault();
  });
  window.addEventListener("drop", (e) => {
    e.preventDefault();
  });
};
