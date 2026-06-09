// Final mobile shell polish: removes duplicated Compliance top nav and applies the Rota-style black/gold visual system.
(function complianceShellFinalPatch() {
  const GOLD = '#B0914A';

  function stripDuplicateTopNav() {
    document.querySelectorAll('.profileSwitch + .mainNav, nav.mainNav').forEach(nav => nav.remove());
  }

  function polishNavLabels() {
    document.querySelectorAll('.bottomNav .navBtn').forEach(btn => {
      const route = btn.getAttribute('data-route') || '';
      if (!btn.dataset.label) btn.dataset.label = btn.textContent.trim();
      btn.setAttribute('aria-label', btn.dataset.label);
      btn.classList.add('polishedNavBtn');
      btn.dataset.icon = ({
        dashboard: '⌂',
        checks: '✓',
        documents: '□',
        logs: '!',
        staff: '◉',
        rota: '▦',
        inspection: '◇',
        settings: '⚙'
      })[route] || '•';
    });
  }

  function markRoute() {
    const active = document.querySelector('.bottomNav .navBtn.active');
    const route = active?.getAttribute('data-route') || '';
    document.body.classList.toggle('is-rota-route', route === 'rota');
    document.body.dataset.route = route;
    stripDuplicateTopNav();
    polishNavLabels();
  }

  if (typeof shell === 'function' && !shell.__complianceShellPolished) {
    const oldShell = shell;
    shell = function shellWithoutDuplicateNav(content) {
      const html = oldShell(content);
      return html.replace(/<nav class="mainNav">[\s\S]*?<\/nav>/g, '');
    };
    shell.__complianceShellPolished = true;
  }

  if (typeof bind === 'function' && !bind.__complianceShellPolished) {
    const oldBind = bind;
    bind = function bindWithoutDuplicateNav() {
      oldBind();
      markRoute();
    };
    bind.__complianceShellPolished = true;
  }

  const style = document.createElement('style');
  style.id = 'polished-mobile-ui-style';
  style.textContent = `
    :root {
      --rotablack: #050607;
      --rotablack2: #090b0d;
      --rotapanel: #11161b;
      --rotapanel2: #171d23;
      --rotapanel3: #20262d;
      --rotaink: #f7f1e4;
      --rotaink2: #fff8ea;
      --rotamut: #a69e90;
      --rotaline: rgba(176,145,74,.28);
      --rotaline2: rgba(255,255,255,.08);
      --rotagold: ${GOLD};
      --rotagold2: #d0ad58;
      --rotadanger: #ff5d4d;
      --rotawarn: #f2c34f;
      --rotaok: #55d477;
      --rotaradius: 18px;
      --rotaradius2: 24px;
      --rotashadow: 0 18px 42px rgba(0,0,0,.34);
      --rotasoftshadow: 0 10px 28px rgba(0,0,0,.22);
      --rotatap: 48px;
    }

    html, body {
      background: var(--rotablack) !important;
    }

    body {
      color: var(--rotaink) !important;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif !important;
      -webkit-font-smoothing: antialiased;
      text-rendering: optimizeLegibility;
    }

    #appShell {
      min-height: 100svh !important;
      padding-bottom: calc(86px + env(safe-area-inset-bottom)) !important;
      background:
        radial-gradient(circle at 20% 0%, rgba(176,145,74,.16), transparent 34%),
        linear-gradient(180deg, #080a0c 0%, #050607 44%, #030405 100%) !important;
    }

    .topbar {
      position: sticky !important;
      top: 0 !important;
      z-index: 10 !important;
      padding: calc(14px + env(safe-area-inset-top)) 20px 14px !important;
      background: linear-gradient(180deg, rgba(5,6,7,.98), rgba(5,6,7,.90)) !important;
      color: var(--rotaink) !important;
      border-bottom: 1px solid var(--rotaline2) !important;
      box-shadow: 0 12px 30px rgba(0,0,0,.25) !important;
      backdrop-filter: blur(18px) !important;
    }

    .topbar h1 {
      margin: 2px 0 0 !important;
      font-size: clamp(24px, 7vw, 34px) !important;
      line-height: 1.02 !important;
      font-weight: 850 !important;
      letter-spacing: -.04em !important;
      color: var(--rotaink2) !important;
    }

    .eyebrow {
      margin: 0 !important;
      color: var(--rotagold) !important;
      font-size: 12px !important;
      letter-spacing: .22em !important;
      text-transform: uppercase !important;
      font-weight: 800 !important;
    }

    body.is-rota-route .topbar {
      display: none !important;
    }

    body.is-rota-route #app {
      padding: 0 0 calc(78px + env(safe-area-inset-bottom)) !important;
      max-width: none !important;
    }

    #app {
      width: 100% !important;
      max-width: 520px !important;
      margin: 0 auto !important;
      padding: 16px 14px calc(98px + env(safe-area-inset-bottom)) !important;
    }

    .profileSwitch + .mainNav,
    nav.mainNav {
      display: none !important;
    }

    h2, h3, h4 {
      color: var(--rotaink2) !important;
      letter-spacing: -.03em !important;
    }

    h2 { font-size: 26px !important; line-height: 1.06 !important; margin: 0 0 14px !important; }
    h3 { font-size: 18px !important; line-height: 1.15 !important; margin: 0 0 10px !important; }
    p { color: var(--rotamut) !important; line-height: 1.45 !important; }

    .muted,
    .docItem span,
    .plainList small,
    .staffCard span,
    .staffCard small,
    small {
      color: var(--rotamut) !important;
    }

    .grid { gap: 14px !important; }
    .grid.two, .grid.cards { grid-template-columns: 1fr !important; }

    .hero,
    .card,
    .profileSwitch,
    .statusStrip > div,
    .docItem,
    .plainList li,
    .rowButton,
    .staffCard,
    .rotaPeopleShell,
    .profilePage,
    .panel,
    .workCard,
    .matrixWrap,
    .documentHub,
    .docFinderPanel,
    .trainingMatrixPanel,
    .requiredDocCard,
    .listItem,
    .issueCard {
      background: linear-gradient(180deg, rgba(27,33,39,.96), rgba(17,22,27,.96)) !important;
      color: var(--rotaink) !important;
      border: 1px solid var(--rotaline2) !important;
      border-radius: var(--rotaradius2) !important;
      box-shadow: var(--rotasoftshadow) !important;
      padding: 16px !important;
    }

    .hero {
      border-color: rgba(176,145,74,.34) !important;
      background:
        radial-gradient(circle at 88% 22%, rgba(176,145,74,.26), transparent 25%),
        linear-gradient(135deg, #151a1f, #080a0c) !important;
      min-height: 132px !important;
    }

    .cardTop,
    .miniRow,
    .docItem {
      align-items: center !important;
    }

    .sectionTitle {
      margin: 22px 4px 10px !important;
      color: var(--rotaink2) !important;
      font-size: 18px !important;
      font-weight: 850 !important;
    }

    button,
    a.ghost,
    .rowButton {
      min-height: var(--rotatap) !important;
      border-radius: 14px !important;
      transition: transform .12s ease, opacity .12s ease, background .12s ease !important;
      -webkit-tap-highlight-color: transparent !important;
    }

    button:active,
    a.ghost:active,
    .rowButton:active {
      transform: scale(.985) !important;
    }

    button.primary,
    button:not(.navBtn):not(.ghost):not(.close):not(.roundBtn):not(.rotaRoundAdd):not(.secondary),
    .primary {
      background: linear-gradient(135deg, var(--rotagold), var(--rotagold2)) !important;
      color: #0c0d0f !important;
      border: 1px solid rgba(255,255,255,.16) !important;
      box-shadow: 0 10px 22px rgba(176,145,74,.22) !important;
      font-weight: 850 !important;
    }

    button.ghost,
    a.ghost,
    .secondary,
    .roundBtn,
    .rotaRoundAdd,
    .rowButton {
      background: rgba(255,255,255,.045) !important;
      color: var(--rotaink) !important;
      border: 1px solid var(--rotaline2) !important;
      box-shadow: none !important;
      font-weight: 800 !important;
    }

    .roundBtn,
    .rotaRoundAdd,
    .avatarText,
    .docIcon,
    .categoryIcon {
      background: linear-gradient(135deg, var(--rotagold), #8f6f2c) !important;
      color: #090a0b !important;
      border-radius: 50% !important;
      box-shadow: 0 10px 22px rgba(176,145,74,.20) !important;
    }

    input,
    select,
    textarea {
      min-height: var(--rotatap) !important;
      background: rgba(255,255,255,.055) !important;
      color: var(--rotaink) !important;
      border: 1px solid var(--rotaline2) !important;
      border-radius: 14px !important;
      padding: 13px 14px !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.035) !important;
      outline: none !important;
    }

    input::placeholder,
    textarea::placeholder {
      color: rgba(247,241,228,.45) !important;
    }

    input:focus,
    select:focus,
    textarea:focus {
      border-color: rgba(176,145,74,.72) !important;
      box-shadow: 0 0 0 4px rgba(176,145,74,.14) !important;
    }

    .badge {
      background: rgba(176,145,74,.14) !important;
      color: var(--rotagold2) !important;
      border: 1px solid rgba(176,145,74,.22) !important;
      border-radius: 999px !important;
      padding: 6px 9px !important;
      font-size: 12px !important;
      font-weight: 850 !important;
    }

    .badge.ok { color: var(--rotaok) !important; background: rgba(85,212,119,.10) !important; border-color: rgba(85,212,119,.18) !important; }
    .badge.warn { color: var(--rotawarn) !important; background: rgba(242,195,79,.10) !important; border-color: rgba(242,195,79,.18) !important; }
    .badge.danger { color: var(--rotadanger) !important; background: rgba(255,93,77,.10) !important; border-color: rgba(255,93,77,.18) !important; }

    .statusStrip {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }

    .statusStrip > div {
      min-height: 76px !important;
      align-items: center !important;
      gap: 12px !important;
    }

    .plainList,
    .docList,
    .issueList,
    .stack {
      gap: 12px !important;
    }

    .plainList li,
    .staffCard,
    .docItem,
    .rowButton,
    .listItem {
      margin: 0 !important;
      width: 100% !important;
    }

    .docItem,
    .listItem {
      display: grid !important;
      grid-template-columns: 1fr auto !important;
      gap: 12px !important;
    }

    .docItem strong,
    .listItem strong {
      color: var(--rotaink2) !important;
      font-size: 16px !important;
    }

    .tableWrap {
      border: 1px solid var(--rotaline2) !important;
      border-radius: 18px !important;
      overflow: auto !important;
      background: rgba(255,255,255,.035) !important;
    }

    table {
      color: var(--rotaink) !important;
      border-collapse: collapse !important;
    }

    th {
      color: var(--rotagold) !important;
      background: rgba(176,145,74,.08) !important;
      font-size: 11px !important;
      letter-spacing: .06em !important;
    }

    td, th {
      border-bottom: 1px solid var(--rotaline2) !important;
      padding: 11px 10px !important;
    }

    .bottomNav {
      position: fixed !important;
      left: 10px !important;
      right: 10px !important;
      bottom: max(10px, env(safe-area-inset-bottom)) !important;
      z-index: 50 !important;
      height: 72px !important;
      display: flex !important;
      gap: 4px !important;
      overflow-x: auto !important;
      overflow-y: hidden !important;
      padding: 8px !important;
      background: rgba(9,10,11,.94) !important;
      border: 1px solid rgba(176,145,74,.24) !important;
      border-radius: 24px !important;
      box-shadow: 0 18px 38px rgba(0,0,0,.42), inset 0 1px 0 rgba(255,255,255,.04) !important;
      backdrop-filter: blur(18px) saturate(1.2) !important;
      -webkit-overflow-scrolling: touch !important;
      scrollbar-width: none !important;
    }

    .bottomNav::-webkit-scrollbar { display: none !important; }

    .bottomNav .navBtn {
      flex: 0 0 64px !important;
      min-width: 64px !important;
      height: 56px !important;
      display: grid !important;
      place-items: center !important;
      gap: 2px !important;
      padding: 5px 4px !important;
      color: rgba(247,241,228,.78) !important;
      background: transparent !important;
      border: 0 !important;
      border-radius: 18px !important;
      font-size: 10px !important;
      font-weight: 750 !important;
      line-height: 1 !important;
      white-space: nowrap !important;
    }

    .bottomNav .navBtn::before {
      content: attr(data-icon) !important;
      display: block !important;
      font-size: 20px !important;
      line-height: 1 !important;
      color: currentColor !important;
    }

    .bottomNav .navBtn.active {
      background: rgba(176,145,74,.18) !important;
      color: var(--rotagold2) !important;
      box-shadow: inset 0 0 0 1px rgba(176,145,74,.24) !important;
    }

    .centralPersonRow,
    .personRow {
      display: grid !important;
      grid-template-columns: 54px 1fr auto !important;
      align-items: center !important;
      gap: 12px !important;
      width: 100% !important;
      min-height: 76px !important;
      padding: 12px 0 !important;
      color: var(--rotaink) !important;
      background: transparent !important;
      border: 0 !important;
      border-bottom: 1px solid var(--rotaline2) !important;
      border-radius: 0 !important;
      box-shadow: none !important;
      text-align: left !important;
    }

    .centralPersonRow:last-child,
    .personRow:last-child {
      border-bottom: 0 !important;
    }

    .centralPersonRow strong,
    .personRow strong {
      color: var(--rotaink2) !important;
      font-size: 17px !important;
      letter-spacing: -.02em !important;
    }

    .centralPersonRow p,
    .personRow p {
      margin: 4px 0 0 !important;
      color: var(--rotamut) !important;
      font-size: 13px !important;
    }

    .avatarText {
      width: 48px !important;
      height: 48px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      font-size: 17px !important;
      font-weight: 900 !important;
    }

    .avatarText.big {
      width: 88px !important;
      height: 88px !important;
      font-size: 31px !important;
    }

    .chev {
      color: rgba(247,241,228,.55) !important;
      font-size: 24px !important;
    }

    .profileTop,
    .profileHero {
      display: grid !important;
      grid-template-columns: auto 1fr auto !important;
      align-items: center !important;
      gap: 14px !important;
    }

    .profileLinks {
      background: linear-gradient(180deg, rgba(27,33,39,.96), rgba(17,22,27,.96)) !important;
      border: 1px solid var(--rotaline2) !important;
      border-radius: var(--rotaradius2) !important;
      padding: 6px 14px !important;
      box-shadow: var(--rotasoftshadow) !important;
    }

    .profileLinks button {
      width: 100% !important;
      min-height: 58px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      background: transparent !important;
      color: var(--rotaink2) !important;
      border: 0 !important;
      border-bottom: 1px solid var(--rotaline2) !important;
      border-radius: 0 !important;
      padding: 16px 0 !important;
      box-shadow: none !important;
      font-size: 16px !important;
      font-weight: 750 !important;
    }

    .profileLinks button:last-child { border-bottom: 0 !important; }

    .modalBackdrop {
      background: rgba(0,0,0,.72) !important;
      backdrop-filter: blur(10px) !important;
      padding: 12px !important;
    }

    .modalCard {
      background: linear-gradient(180deg, #171d23, #0e1216) !important;
      color: var(--rotaink) !important;
      border: 1px solid var(--rotaline) !important;
      border-radius: 28px 28px 22px 22px !important;
      box-shadow: 0 30px 90px rgba(0,0,0,.58) !important;
    }

    .close {
      background: rgba(255,255,255,.08) !important;
      color: var(--rotaink) !important;
      border: 1px solid var(--rotaline2) !important;
    }

    .inlineForm,
    .issueForm {
      grid-template-columns: 1fr !important;
      gap: 10px !important;
    }

    .rotaEmbedCard {
      padding: 0 !important;
      border: 0 !important;
      background: transparent !important;
      box-shadow: none !important;
      border-radius: 0 !important;
    }

    .rotaFrame {
      height: calc(100svh - 88px - env(safe-area-inset-bottom)) !important;
      min-height: 620px !important;
      border: 0 !important;
      border-radius: 0 !important;
      background: #050607 !important;
    }

    @media (max-width: 760px) {
      #app { padding-left: 12px !important; padding-right: 12px !important; }
      .hero { flex-direction: column !important; align-items: stretch !important; }
      .profileSwitch { flex-direction: column !important; align-items: stretch !important; }
      .docItem { grid-template-columns: 1fr !important; }
      .docItem > div:last-child { justify-items: start !important; }
      .profileHero { grid-template-columns: 96px 1fr !important; }
      .profileTop { grid-template-columns: 1fr auto !important; }
    }
  `;
  const oldStyle = document.getElementById('polished-mobile-ui-style');
  if (oldStyle) oldStyle.remove();
  document.head.appendChild(style);

  window.addEventListener('hashchange', markRoute);
  document.addEventListener('click', () => setTimeout(markRoute, 0), true);
  new MutationObserver(markRoute).observe(document.documentElement, { childList: true, subtree: true, attributes: true, attributeFilter: ['class'] });

  markRoute();
  if (typeof render === 'function') render();
})();