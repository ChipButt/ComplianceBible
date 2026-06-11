// Minimal neutral shell polish. Does not style document buttons.
(function () {
  function mark() {
    var active = document.querySelector('.bottomNav .navBtn.active');
    var route = active ? active.getAttribute('data-route') : '';
    document.body.classList.toggle('is-rota-route', route === 'rota');
  }

  var style = document.createElement('style');
  style.textContent = `
    :root{--accent:#d7d0c4;--dark:#050607;--panel:#14191f;--panel2:#1b2229;--ink:#fff8ea;--muted:#aaa194;--line:rgba(255,255,255,.09)}
    html,body{background:var(--dark)!important;color:var(--ink)!important;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif!important}
    #appShell{background:#050607!important;padding-bottom:96px!important;min-height:100svh!important}
    #app{max-width:520px!important;margin:0 auto!important;padding:16px 14px 110px!important}
    .topbar{background:#050607!important;color:var(--ink)!important;border-bottom:1px solid var(--line)!important;padding:18px!important}
    .topbar h1{color:var(--ink)!important;font-size:30px!important;line-height:1!important;letter-spacing:-.04em!important}
    .eyebrow{color:var(--accent)!important;letter-spacing:.2em!important;font-size:12px!important}
    body.is-rota-route .topbar{display:none!important}
    body.is-rota-route #app{max-width:none!important;padding:0 0 96px!important}
    nav.mainNav,.profileSwitch+.mainNav{display:none!important}
    h2,h3,h4{color:var(--ink)!important;letter-spacing:-.03em!important}
    p,.muted,small{color:var(--muted)!important}
    .card,.hero,.profileSwitch,.statusStrip>div,.docItem,.plainList li,.rowButton,.staffCard,.panel,.workCard,.listItem,.issueCard{background:linear-gradient(180deg,var(--panel2),var(--panel))!important;color:var(--ink)!important;border:1px solid var(--line)!important;border-radius:24px!important;padding:16px!important}
    button,input,select,textarea{font:inherit!important}
    input,select,textarea{background:rgba(255,255,255,.06)!important;color:var(--ink)!important;border:1px solid var(--line)!important;border-radius:14px!important;min-height:48px!important;padding:12px!important}
    button.primary{background:linear-gradient(135deg,#1b1d20,#101113)!important;color:var(--ink)!important;border:1px solid var(--line)!important;border-radius:14px!important;min-height:48px!important;font-weight:850!important}
    button.ghost,a.ghost,.secondary,.rowButton{background:rgba(255,255,255,.05)!important;color:var(--ink)!important;border:1px solid var(--line)!important;border-radius:14px!important;min-height:48px!important}
    .bottomNav{position:fixed!important;left:10px!important;right:10px!important;bottom:max(10px,env(safe-area-inset-bottom))!important;z-index:50!important;height:72px!important;display:flex!important;gap:4px!important;padding:8px!important;background:rgba(8,9,10,.96)!important;border:1px solid rgba(255,255,255,.14)!important;border-radius:24px!important}
    .bottomNav .navBtn{flex:0 0 64px!important;min-width:64px!important;height:56px!important;background:transparent!important;color:rgba(255,248,234,.78)!important;border:0!important;border-radius:18px!important;font-size:12px!important;font-weight:750!important;padding:5px 4px!important}
    .bottomNav .navBtn.active{background:rgba(255,255,255,.10)!important;color:var(--accent)!important;box-shadow:inset 0 0 0 1px rgba(255,255,255,.16)!important}
    .avatarText{background:linear-gradient(135deg,#d7d0c4,#9b948b)!important;color:#090a0b!important;border-radius:50%!important;width:48px!important;height:48px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;font-weight:900!important}
    .modalCard{background:linear-gradient(180deg,#171d23,#0e1216)!important;color:var(--ink)!important;border:1px solid rgba(255,255,255,.14)!important}
  `;
  document.head.appendChild(style);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mark); else mark();
  document.addEventListener('click', function(){ setTimeout(mark, 0); }, true);
})();