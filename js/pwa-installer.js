/**
 * PWA Installer & Service Worker Registration
 * Liga Barrial Argelia Alta - LDBAA
 */

(function () {
  'use strict';

  // 1. Registro del Service Worker
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('./sw.js')
        .then((reg) => {
          console.log('[PWA] Service Worker registrado exitosamente:', reg.scope);
        })
        .catch((err) => {
          console.warn('[PWA] Error al registrar Service Worker:', err);
        });
    });
  }

  // 2. Control de Instalación en Dispositivos
  let deferredPrompt = null;
  const isIos = /iphone|ipad|ipod/.test(window.navigator.userAgent.toLowerCase());
  const isInStandaloneMode = () =>
    'standalone' in window.navigator && window.navigator.standalone ||
    window.matchMedia('(display-mode: standalone)').matches;

  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevenir el banner automático básico de Chrome para mostrar uno personalizado premium
    e.preventDefault();
    deferredPrompt = e;
    window.canInstallPWA = true;

    // Mostrar botón/banner flotante de instalación si no estamos en standalone
    if (!isInStandaloneMode()) {
      showPwaInstallButton();
    }
  });

  window.addEventListener('appinstalled', () => {
    deferredPrompt = null;
    window.canInstallPWA = false;
    hidePwaInstallButton();
    console.log('[PWA] Aplicación instalada correctamente.');
  });

  // Función global para disparar la instalación
  window.triggerPwaInstall = async function () {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`[PWA] Respuesta del usuario: ${outcome}`);
      deferredPrompt = null;
      hidePwaInstallButton();
    } else if (isIos && !isInStandaloneMode()) {
      showIosInstallInstructions();
    } else {
      showGeneralInstallTip();
    }
  };

  function showPwaInstallButton() {
    let btn = document.getElementById('pwa-floating-install-btn');
    if (!btn) {
      btn = document.createElement('div');
      btn.id = 'pwa-floating-install-btn';
      btn.innerHTML = `
        <div class="pwa-install-pill animate__animated animate__fadeInDown">
          <div class="pwa-install-icon">
            <img src="img/logo.png" alt="LDBAA" onerror="this.src='../img/logo.png'" />
          </div>
          <div class="pwa-install-info">
            <span class="pwa-title">Instalar App LDBAA</span>
            <span class="pwa-sub">Acceso rápido y pantalla completa</span>
          </div>
          <button type="button" class="pwa-btn-action" onclick="window.triggerPwaInstall()">
            <i class="fas fa-download me-1"></i> Instalar
          </button>
          <button type="button" class="pwa-btn-close" onclick="window.dismissPwaBanner()" aria-label="Cerrar">
            <i class="fas fa-times"></i>
          </button>
        </div>
      `;

      // Inyectar estilos CSS de la barra de instalación
      const style = document.createElement('style');
      style.id = 'pwa-install-styles';
      style.textContent = `
        #pwa-floating-install-btn {
          position: fixed;
          top: 16px;
          bottom: auto;
          left: 50%;
          transform: translateX(-50%);
          z-index: 100000;
          width: 92%;
          max-width: 440px;
          pointer-events: auto;
          font-family: 'Outfit', sans-serif, system-ui;
        }
        .pwa-install-pill {
          display: flex;
          align-items: center;
          gap: 12px;
          background: rgba(15, 23, 42, 0.95);
          backdrop-filter: blur(16px);
          -webkit-backdrop-filter: blur(16px);
          border: 1px solid rgba(46, 204, 113, 0.45);
          padding: 10px 14px;
          border-radius: 50px;
          box-shadow: 0 12px 35px rgba(0, 0, 0, 0.75), 0 0 25px rgba(46, 204, 113, 0.25);
        }
        .pwa-install-icon img {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          object-fit: contain;
          background: rgba(255, 255, 255, 0.08);
          padding: 3px;
        }
        .pwa-install-info {
          display: flex;
          flex-direction: column;
          flex-grow: 1;
          text-align: left;
          min-width: 0;
        }
        .pwa-title {
          color: #ffffff;
          font-weight: 700;
          font-size: 0.85rem;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pwa-sub {
          color: rgba(255, 255, 255, 0.65);
          font-size: 0.7rem;
          line-height: 1.2;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .pwa-btn-action {
          background: linear-gradient(135deg, #2ecc71, #27ae60);
          color: #ffffff;
          border: none;
          padding: 8px 16px;
          border-radius: 30px;
          font-size: 0.8rem;
          font-weight: 700;
          cursor: pointer;
          transition: transform 0.2s, box-shadow 0.2s;
          display: flex;
          align-items: center;
          gap: 5px;
          white-space: nowrap;
          box-shadow: 0 4px 12px rgba(46, 204, 113, 0.35);
        }
        .pwa-btn-action:hover {
          transform: scale(1.04);
          box-shadow: 0 6px 16px rgba(46, 204, 113, 0.5);
        }
        .pwa-btn-close {
          background: transparent;
          border: none;
          color: rgba(255, 255, 255, 0.4);
          font-size: 0.9rem;
          cursor: pointer;
          padding: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: color 0.2s;
        }
        .pwa-btn-close:hover {
          color: #ffffff;
        }
        @media (max-width: 480px) {
          #pwa-floating-install-btn {
            top: 10px;
            bottom: auto;
            width: 94%;
          }
          .pwa-install-pill {
            padding: 8px 12px;
            gap: 10px;
          }
          .pwa-title { font-size: 0.8rem; }
          .pwa-sub { font-size: 0.65rem; }
          .pwa-btn-action { padding: 6px 12px; font-size: 0.75rem; }
        }
      `;

      if (!document.getElementById('pwa-install-styles')) {
        document.head.appendChild(style);
      }
      document.body.appendChild(btn);
    } else {
      btn.style.display = 'block';
    }
  }

  function hidePwaInstallButton() {
    const btn = document.getElementById('pwa-floating-install-btn');
    if (btn) btn.style.display = 'none';
  }

  window.dismissPwaBanner = function () {
    hidePwaInstallButton();
    sessionStorage.setItem('pwa-banner-dismissed', 'true');
  };

  function showIosInstallInstructions() {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: '<span style="color:#2ecc71">Instalar en iPhone / iPad</span>',
        html: `
          <div style="text-align: left; font-size: 0.9rem; color: #ddd; line-height: 1.6;">
            <p>Para tener la app en tu pantalla de inicio:</p>
            <ol style="padding-left: 20px;">
              <li>Toca el botón <strong>Compartir</strong> en la barra inferior de Safari <i class="fas fa-share-square text-info"></i>.</li>
              <li>Desliza hacia abajo y selecciona <strong>"Agregar al inicio"</strong> <i class="fas fa-plus-square text-success"></i>.</li>
              <li>Toca <strong>"Agregar"</strong> en la esquina superior derecha.</li>
            </ol>
          </div>
        `,
        icon: 'info',
        background: '#131722',
        color: '#fff',
        confirmButtonText: 'Entendido',
        confirmButtonColor: '#2ecc71',
      });
    } else {
      alert('Para instalar en iPhone: Toca el botón Compartir de Safari y selecciona "Agregar al inicio".');
    }
  }

  function showGeneralInstallTip() {
    if (typeof Swal !== 'undefined') {
      Swal.fire({
        title: '<span style="color:#2ecc71">Instalar Aplicación</span>',
        text: 'Abre el menú de tu navegador (los 3 puntos en la esquina superior) y selecciona "Instalar aplicación" o "Agregar a la pantalla principal".',
        icon: 'info',
        background: '#131722',
        color: '#fff',
        confirmButtonText: 'Aceptar',
        confirmButtonColor: '#2ecc71',
      });
    } else {
      alert('Abre el menú de opciones de tu navegador y selecciona "Instalar aplicación" o "Agregar a la pantalla principal".');
    }
  }

  // Mostrar para iOS si no está en standalone y no fue descartado en esta sesión
  if (isIos && !isInStandaloneMode() && !sessionStorage.getItem('pwa-banner-dismissed')) {
    window.addEventListener('load', () => {
      setTimeout(() => {
        showPwaInstallButton();
      }, 2000);
    });
  }
})();
