// Toast utilitário global
window.showToast = function(msg, sucesso = true) {
  let toast = document.getElementById('toast-msg');
  if (!toast) {
    toast = document.createElement('div');
    toast.id = 'toast-msg';
    document.body.appendChild(toast);
  }
  toast.textContent = msg;
  toast.style.position = 'fixed';
  toast.style.bottom = '32px';
  toast.style.left = '50%';
  toast.style.transform = 'translateX(-50%)';
  toast.style.background = sucesso ? '#2a3f57;' : '#b30000';
  toast.style.color = '#fff';
  toast.style.padding = '14px 32px';
  toast.style.borderRadius = '8px';
  toast.style.fontSize = '1.1em';
  toast.style.boxShadow = '0 2px 12px rgba(0,0,0,0.18)';
  toast.style.zIndex = 9999;
  toast.style.opacity = '1';
  toast.style.transition = 'opacity 0.3s';
  toast.style.pointerEvents = 'none';
  clearTimeout(window._toastTimeout);
  window._toastTimeout = setTimeout(() => {
    toast.style.opacity = '0';
  }, 2200);
};