// Safe visual polish. This file must not override render(), shell(), or bind().
(function () {
  function mark() {
    var active = document.querySelector('.bottomNav .navBtn.active');
    var route = active ? active.getAttribute('data-route') : '';
    document.body.classList.toggle('is-rota-route', route === 'rota');
    document.querySelectorAll('.bottomNav .navBtn').forEach(function (btn) {
      var r = btn.getAttribute('data-route') || '';
      btn.dataset.icon = { dashboard:'⌂', checks:'✓', documents:'□', logs:'!', staff:'◉', rota:'▦', inspection:'◇', settings:'⚙' }[r] || '•';
    });
  }

  var style = document.createElement('style');
  style.textContent = `
    :root{--gold:#B0914A;--dark:#050607;--panel:#14191f;--panel2:#1b2229;--ink:#fff8ea;--muted:#aaa194;--line:rgba(255,255,255,.09)}
    html,body{background:var(--dark)!important;color:var(--ink)!important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif!important}
    #appShell{background:linear-gradient(180deg,#080a0c,#050607)!important;padding-bottom:96px!important;min-height:100svh!important}
    #app{max-width:520px!important;margin:0 auto!important;padding:16px 14px 110px!important}
    .topbar{background:#050607!important;color:var(--ink)!important;border-bottom:1px solid var(--line)!important;padding:18px!important;box-shadow:0 12px 28px rgba(0,0,0,.28)!important}
    .topbar h1{color:var(--ink)!important;font-size:30px!important;line-height:1!important;letter-spacing:-.04em!important}
    .eyebrow{color:var(--gold)!important;letter-spacing:.2em!important;font-size:12px!important}
    body.is-rota-route .topbar{display:none!important}
    body.is-rota-route #app{max-width:none!important;padding:0 0 96px!important}
    nav.mainNav,.profileSwitch+.mainNav{display:none!important}
    h2,h3,h4{color:var(--ink)!important;letter-spacing:-.03em!important}p,.muted,small{color:var(--muted)!important}
    .card,.hero,.profileSwitch,.statusStrip>div,.docItem,.plainList li,.rowButton,.staffCard,.rotaPeopleShell,.profilePage,.panel,.workCard,.listItem,.issueCard{background:linear-gradient(180deg,var(--panel2),var(--panel))!important;color:var(--ink)!important;border:1px solid var(--line)!important;border-radius:24px!important;box-shadow:0 10px 28px rgba(0,0,0,.22)!important;padding:16px!important}
    .grid.two,.grid.cards{grid-template-columns:1fr!important}.statusStrip{grid-template-columns:1fr!important}.inlineForm,.issueForm{grid-template-columns:1fr!important}
    button,input,select,textarea{font:inherit!important}input,select,textarea{background:rgba(255,255,255,.06)!important;color:var(--ink)!important;border:1px solid var(--line)!important;border-radius:14px!important;min-height:48px!important;padding:12px!important}
    button.primary,button:not(.navBtn):not(.ghost):not(.close):not(.secondary){background:linear-gradient(135deg,var(--gold),#d0ad58)!important;color:#070707!important;border:0!important;border-radius:14px!important;min-height:48px!important;font-weight:850!important}
    button.ghost,a.ghost,.secondary,.rowButton{background:rgba(255,255,255,.05)!important;color:var(--ink)!important;border:1px solid var(--line)!important;border-radius:14px!important;min-height:48px!important}
    .bottomNav{position:fixed!important;left:10px!important;right:10px!important;bottom:max(10px,env(safe-area-inset-bottom))!important;z-index:50!important;height:72px!important;display:flex!important;gap:4px!important;overflow-x:auto!important;padding:8px!important;background:rgba(8,9,10,.96)!important;border:1px solid rgba(176,145,74,.28)!important;border-radius:24px!important;box-shadow:0 18px 38px rgba(0,0,0,.42)!important;scrollbar-width:none!important}
    .bottomNav::-webkit-scrollbar{display:none!important}.bottomNav .navBtn{flex:0 0 64px!important;min-width:64px!important;height:56px!important;display:grid!important;place-items:center!important;background:transparent!important;color:rgba(255,248,234,.78)!important;border:0!important;border-radius:18px!important;font-size:10px!important;font-weight:750!important;padding:5px 4px!important}.bottomNav .navBtn:before{content:attr(data-icon)!important;font-size:20px!important}.bottomNav .navBtn.active{background:rgba(176,145,74,.18)!important;color:#d0ad58!important;box-shadow:inset 0 0 0 1px rgba(176,145,74,.24)!important}
    .avatarText{background:linear-gradient(135deg,var(--gold),#8f6f2c)!important;color:#090a0b!important;border-radius:50%!important;width:48px!important;height:48px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font-weight:900!important}
    .centralPersonRow,.personRow{display:grid!important;grid-template-columns:54px 1fr auto!important;align-items:center!important;gap:12px!important;background:transparent!important;border:0!important;border-bottom:1px solid var(--line)!important;border-radius:0!important;box-shadow:none!important;padding:12px 0!important;text-align:left!important;color:var(--ink)!important}.centralPersonRow strong,.personRow strong{color:var(--ink)!important;font-size:17px!important}.centralPersonRow p,.personRow p{color:var(--muted)!important;font-size:13px!important;margin:4px 0 0!important}
    .modalCard{background:linear-gradient(180deg,#171d23,#0e1216)!important;color:var(--ink)!important;border:1px solid rgba(176,145,74,.28)!important;border-radius:28px 28px 22px 22px!important}
    .rotaEmbedCard{padding:0!important;border:0!important;background:transparent!important;box-shadow:none!important}.rotaFrame{height:calc(100svh - 88px - env(safe-area-inset-bottom))!important;min-height:620px!important;border:0!important;border-radius:0!important;background:#050607!important}
  `;
  document.head.appendChild(style);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mark); else mark();
  document.addEventListener('click', function(){ setTimeout(mark, 0); }, true);
})();