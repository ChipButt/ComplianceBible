// Removes the duplicated Compliance top navigation row and applies the Rota App black/gold visual scheme to non-Rota pages.
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
      --bg: #f4f1e8;
      --panel: #fffdf8;
      --ink: #111;
      --muted: #6f6757;
      --line: #ded2b7;
      --accent: #B0914A;
      --accent2: #c6a85a;
      --danger: #9f2f24;
      --success: #2e7d51;
      --warn: #d6a93a;
      background: var(--bg) !important;
      color: var(--ink) !important;
      font-family: Arial, Helvetica, sans-serif !important;
    }
    body:not(.is-rota-route) #app {
      max-width: none;
      padding: 14px 14px 104px;
    }
    body:not(.is-rota-route) .topbar {
      background: #111 !important;
      color: var(--accent) !important;
      border-bottom: 1px solid #2b2b2b !important;
      box-shadow: 0 2px 18px rgba(0,0,0,.12) !important;
      padding: 18px !important;
    }
    body:not(.is-rota-route) .topbar h1 {
      color: var(--accent) !important;
      font-size: 24px !important;
      font-weight: 900 !important;
      letter-spacing: 0 !important;
    }
    body:not(.is-rota-route) .eyebrow,
    body:not(.is-rota-route) .muted,
    body:not(.is-rota-route) .docItem span,
    body:not(.is-rota-route) .plainList small {
      color: var(--muted) !important;
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
    body:not(.is-rota-route) .workCard {
      background: var(--panel) !important;
      border: 1px solid var(--line) !important;
      border-radius: 22px !important;
      box-shadow: 0 4px 16px rgba(0,0,0,.06) !important;
    }
    body:not(.is-rota-route) .hero {
      background: var(--panel) !important;
      color: var(--ink) !important;
      border: 1px solid var(--line) !important;
      border-radius: 22px !important;
      box-shadow: 0 4px 16px rgba(0,0,0,.06) !important;
    }
    body:not(.is-rota-route) button.primary,
    body:not(.is-rota-route) button:not(.navBtn):not(.ghost):not(.close):not(.roundBtn):not(.rotaRoundAdd):not(.secondary),
    body:not(.is-rota-route) .bottomNav .navBtn.active {
      background: #111 !important;
      color: var(--accent) !important;
      border-radius: 14px !important;
      font-weight: 800 !important;
    }
    body:not(.is-rota-route) button.ghost,
    body:not(.is-rota-route) a.ghost,
    body:not(.is-rota-route) .secondary,
    body:not(.is-rota-route) .roundBtn,
    body:not(.is-rota-route) .rotaRoundAdd {
      background: #f8f2df !important;
      color: #111 !important;
      border: 1px solid var(--line) !important;
      border-radius: 14px !important;
      font-weight: 800 !important;
    }
    body:not(.is-rota-route) .roundBtn,
    body:not(.is-rota-route) .avatarText,
    body:not(.is-rota-route) .rotaRoundAdd {
      background: #111 !important;
      color: var(--accent) !important;
      border-radius: 50% !important;
    }
    body:not(.is-rota-route) input,
    body:not(.is-rota-route) select,
    body:not(.is-rota-route) textarea {
      background: #fff !important;
      color: #111 !important;
      border: 1px solid var(--line) !important;
      border-radius: 14px !important;
      padding: 12px !important;
    }
    body:not(.is-rota-route) .bottomNav {
      background: #111 !important;
      border-top: 1px solid #2b2b2b !important;
      box-shadow: 0 -8px 28px rgba(0,0,0,.12) !important;
      overflow-x: auto !important;
      display: flex !important;
      gap: 6px !important;
      padding: 8px 8px calc(8px + env(safe-area-inset-bottom)) !important;
    }
    body:not(.is-rota-route) .bottomNav .navBtn {
      min-width: 78px !important;
      color: #f7edd3 !important;
      background: transparent !important;
      font-size: .78rem !important;
      padding: 10px 12px !important;
      border-radius: 999px !important;
      white-space: nowrap !important;
    }
    body:not(.is-rota-route) .bottomNav .navBtn.active {
      background: var(--accent) !important;
      color: #111 !important;
    }
    body:not(.is-rota-route) .profileSwitch + .mainNav {
      display: none !important;
    }
    body:not(.is-rota-route) .rotaPeopleShell {
      padding: 18px !important;
    }
    body:not(.is-rota-route) .sectionHeader {
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      gap: 10px !important;
    }
    body:not(.is-rota-route) .centralPersonRow,
    body:not(.is-rota-route) .personRow {
      display: grid !important;
      grid-template-columns: 64px 1fr 24px !important;
      gap: 14px !important;
      align-items: center !important;
      width: 100% !important;
      padding: 16px 0 !important;
      border: 0 !important;
      border-bottom: 1px solid var(--line) !important;
      border-radius: 0 !important;
      background: transparent !important;
      color: #111 !important;
      text-align: left !important;
      box-shadow: none !important;
    }
    body:not(.is-rota-route) .personRow strong,
    body:not(.is-rota-route) .centralPersonRow strong {
      font-size: 22px !important;
      color: #111 !important;
    }
    body:not(.is-rota-route) .personRow p,
    body:not(.is-rota-route) .centralPersonRow p {
      font-size: 18px !important;
      color: var(--muted) !important;
      margin: 6px 0 0 !important;
    }
    body:not(.is-rota-route) .avatarText {
      width: 56px !important;
      height: 56px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 24px !important;
      font-weight: 900 !important;
    }
    body:not(.is-rota-route) .avatarText.big {
      width: 92px !important;
      height: 92px !important;
      font-size: 34px !important;
    }
    body:not(.is-rota-route) .chev {
      font-size: 34px !important;
      color: #9d8c61 !important;
    }
    body:not(.is-rota-route) .profileTop {
      display: grid !important;
      grid-template-columns: 72px 1fr auto !important;
      gap: 10px !important;
      align-items: center !important;
      margin-bottom: 20px !important;
    }
    body:not(.is-rota-route) .profileHero {
      display: grid !important;
      grid-template-columns: 108px 1fr !important;
      gap: 18px !important;
      align-items: center !important;
      margin: 18px 0 !important;
    }
    body:not(.is-rota-route) .profileLinks {
      background: var(--panel) !important;
      border: 1px solid var(--line) !important;
      border-radius: 22px !important;
      padding: 6px 14px !important;
    }
    body:not(.is-rota-route) .profileLinks button {
      width: 100% !important;
      display: flex !important;
      justify-content: space-between !important;
      align-items: center !important;
      background: var(--panel) !important;
      color: #111 !important;
      border: 0 !important;
      border-bottom: 1px solid var(--line) !important;
      border-radius: 0 !important;
      padding: 20px 0 !important;
      font-size: 22px !important;
      font-weight: 500 !important;
    }
    body:not(.is-rota-route) .profileLinks button:last-child { border-bottom: 0 !important; }
    body:not(.is-rota-route) .listItem {
      position: relative !important;
      border: 0 !important;
      border-bottom: 1px solid var(--line) !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      padding: 16px 0 !important;
      background: transparent !important;
    }
    body:not(.is-rota-route) .listItem strong { font-size: 22px !important; }
    body:not(.is-rota-route) .listItem p { font-size: 20px !important; }
  `;
  document.head.appendChild(style);

  render();
})();
