// Removes the duplicated Compliance top navigation row and restyles non-Rota pages toward the Rota App scheme.
(function complianceShellFinalPatch() {
  function stripDuplicateTopNav() {
    document.querySelectorAll('.profileSwitch + .mainNav').forEach(nav => nav.remove());
  }

  const oldShell = shell;
  shell = function shellWithoutDuplicateNav(content) {
    const html = oldShell(content);
    return html.replace(/<nav class="mainNav">[\s\S]*?<\/nav>\s*(?=<section class="statusStrip">)/, '');
  };

  const oldBind = bind;
  bind = function bindWithoutDuplicateNav() {
    oldBind();
    stripDuplicateTopNav();
  };

  const style = document.createElement('style');
  style.textContent = `
    body:not(.is-rota-route) {
      background: #eef3ee !important;
      color: #17241f;
    }
    body:not(.is-rota-route) .topbar {
      background: #eef3ee !important;
      border-bottom: 1px solid rgba(23,36,31,.12);
      box-shadow: 0 2px 0 rgba(23,36,31,.06);
    }
    body:not(.is-rota-route) .topbar h1 {
      color: #17241f;
      font-weight: 900;
      letter-spacing: -.04em;
    }
    body:not(.is-rota-route) .eyebrow {
      color: #6b7a72;
      letter-spacing: .2em;
      font-weight: 900;
    }
    body:not(.is-rota-route) .profileSwitch,
    body:not(.is-rota-route) .statusStrip > div,
    body:not(.is-rota-route) .card,
    body:not(.is-rota-route) .docItem,
    body:not(.is-rota-route) .plainList li,
    body:not(.is-rota-route) .rowButton,
    body:not(.is-rota-route) .staffCard,
    body:not(.is-rota-route) .rotaPeopleShell,
    body:not(.is-rota-route) .profilePage,
    body:not(.is-rota-route) .panel,
    body:not(.is-rota-route) .listItem {
      background: #fffdf6 !important;
      border: 1px solid rgba(23,36,31,.14) !important;
      border-radius: 24px !important;
      box-shadow: 0 8px 24px rgba(23,36,31,.08) !important;
    }
    body:not(.is-rota-route) .hero {
      background: #fffdf6 !important;
      color: #17241f !important;
      border: 1px solid rgba(23,36,31,.14) !important;
      border-radius: 28px !important;
      box-shadow: 0 8px 24px rgba(23,36,31,.08) !important;
    }
    body:not(.is-rota-route) button.primary,
    body:not(.is-rota-route) button:not(.navBtn):not(.ghost):not(.close):not(.roundBtn):not(.rotaRoundAdd),
    body:not(.is-rota-route) .bottomNav .navBtn.active {
      background: #173c31 !important;
      color: #fff !important;
      border-radius: 999px !important;
      font-weight: 900 !important;
    }
    body:not(.is-rota-route) button.ghost,
    body:not(.is-rota-route) a.ghost,
    body:not(.is-rota-route) .secondary,
    body:not(.is-rota-route) .roundBtn,
    body:not(.is-rota-route) .rotaRoundAdd {
      background: #e7eee8 !important;
      color: #173c31 !important;
      border: 1px solid rgba(23,36,31,.14) !important;
      border-radius: 999px !important;
      font-weight: 900 !important;
    }
    body:not(.is-rota-route) input,
    body:not(.is-rota-route) select,
    body:not(.is-rota-route) textarea {
      background: #fff !important;
      border: 1px solid rgba(23,36,31,.16) !important;
      border-radius: 18px !important;
    }
    body:not(.is-rota-route) .bottomNav {
      background: rgba(255,253,246,.96) !important;
      border-top: 1px solid rgba(23,36,31,.14) !important;
      box-shadow: 0 -10px 24px rgba(23,36,31,.08) !important;
      overflow-x: auto !important;
      display: flex !important;
    }
    body:not(.is-rota-route) .bottomNav .navBtn {
      min-width: 78px;
      color: #65746d;
      font-size: .78rem;
      padding: 10px 12px;
      border-radius: 999px;
    }
    body:not(.is-rota-route) .profileSwitch + .mainNav {
      display: none !important;
    }
  `;
  document.head.appendChild(style);

  render();
})();
