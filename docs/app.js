function flagMissingPrints() {
  const frames = document.querySelectorAll(".media-frame");

  frames.forEach((frame) => {
    const image = frame.querySelector("img");
    const placeholder = frame.querySelector(".media-placeholder");
    if (!image || !placeholder) return;

    image.addEventListener("error", () => {
      frame.classList.add("is-missing");
      const fallback = placeholder.dataset.fallback || "assets/prints/";
      placeholder.textContent = `Adicione o print em ${fallback}`;
    });

    image.addEventListener("load", () => {
      frame.classList.remove("is-missing");
    });
  });
}

function initImageLightbox() {
  const lightbox = document.getElementById("imageLightbox");
  const lightboxImage = document.getElementById("lightboxImage");
  const lightboxCaption = document.getElementById("lightboxCaption");
  const closeButton = document.getElementById("lightboxClose");

  if (!lightbox || !lightboxImage || !lightboxCaption || !closeButton) return;

  const openLightbox = (img, caption) => {
    lightboxImage.src = img.src;
    lightboxImage.alt = img.alt || caption;
    lightboxCaption.textContent = caption;
    lightbox.classList.add("is-open");
    lightbox.setAttribute("aria-hidden", "false");
    document.body.classList.add("no-scroll");
  };

  const closeLightbox = () => {
    lightbox.classList.remove("is-open");
    lightbox.setAttribute("aria-hidden", "true");
    lightboxImage.src = "";
    document.body.classList.remove("no-scroll");
  };

  document.querySelectorAll(".print-card .media-frame").forEach((frame) => {
    frame.addEventListener("click", () => {
      if (frame.classList.contains("is-missing")) return;

      const img = frame.querySelector("img");
      const card = frame.closest(".print-card");
      const title = card?.querySelector(".print-content h4")?.textContent || "Print UniGestor";
      const text = card?.querySelector(".print-content p")?.textContent || "";
      const caption = text ? `${title} - ${text}` : title;

      if (!img || !img.src) return;
      openLightbox(img, caption);
    });
  });

  closeButton.addEventListener("click", closeLightbox);

  lightbox.addEventListener("click", (event) => {
    if (event.target === lightbox) closeLightbox();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && lightbox.classList.contains("is-open")) {
      closeLightbox();
    }
  });
}

function initPortfolioPage() {
  flagMissingPrints();
  initImageLightbox();
}

initPortfolioPage();
