document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.getElementById('menuBtn');
  const mobileMenu = document.getElementById('mobileMenu');
  const lightbox = document.getElementById('lightbox');
  const lightboxContent = document.getElementById('lightboxContent');
  const lightboxTitle = document.getElementById('lightboxTitle');
  const closeLightboxBtn = document.getElementById('closeLightboxBtn');

  // Cria os ícones do Lucide, se a biblioteca carregar corretamente
  if (window.lucide) {
    lucide.createIcons();
  }

  // Menu mobile
  if (menuBtn && mobileMenu) {
    menuBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });

    document.querySelectorAll('#mobileMenu a').forEach((link) => {
      link.addEventListener('click', () => {
        mobileMenu.classList.add('hidden');
      });
    });
  }

  // Animações ao rolar a página
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1 });

  document.querySelectorAll('.fade-up').forEach((element) => {
    observer.observe(element);
  });

  // Lightbox da galeria
  document.querySelectorAll('.gallery-item').forEach((item) => {
    item.addEventListener('click', () => {
      const title = item.querySelector('span')?.textContent || 'Tela do sistema';
      const imageSrc = item.getAttribute('data-image');

      if (imageSrc) {
        lightboxContent.innerHTML = `
          <img src="${imageSrc}" alt="${title}" class="max-h-[70vh] w-full object-contain rounded-xl" />
        `;
      } else {
        const icon = item.querySelector('[data-lucide]')?.outerHTML || '';
        lightboxContent.innerHTML = `
          <div class="text-center">
            <div class="inline-block mb-2">${icon}</div>
            <p class="font-semibold">${title}</p>
            <p class="text-xs text-gray-400 mt-2">Substitua por print real</p>
          </div>
        `;
      }

      lightboxTitle.textContent = title;
      lightbox.classList.add('active');

      if (window.lucide) {
        lucide.createIcons();
      }
    });
  });

  function closeLightbox() {
    lightbox.classList.remove('active');
  }

  if (lightbox) {
    lightbox.addEventListener('click', closeLightbox);
  }

  const lightboxBox = document.querySelector('.lightbox-box');
  if (lightboxBox) {
    lightboxBox.addEventListener('click', (event) => {
      event.stopPropagation();
    });
  }

  if (closeLightboxBtn) {
    closeLightboxBtn.addEventListener('click', closeLightbox);
  }
});