// Compact profile circle for the main app header.
(function profileCircleFinalPatch() {
  if (window.__profileCircleFinalPatchV4) return;
  window.__profileCircleFinalPatchV4 = true;

  function getUser() {
    try {
      return state.users.find(function (u) { return u.id === state.currentUser; }) || state.users[0] || {};
    } catch (e) {
      return {};
    }
  }

  function getInitials(value) {
    var text = String(value || 'User').trim();
    var parts = text.split(/\s+/).filter(Boolean);
    if (parts.length > 1) return (parts[0].charAt(0) + parts[1].charAt(0)).toUpperCase();
    return text.slice(0, 2).toUpperCase();
  }

  function escapeText(value) {
    return String(value == null ? '' : value).replace(/[&<>'"]/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c];
    });
  }

  function openPanel() {
    var root;
    try { root = modalRoot; } catch (e) { root = document.getElementById('modal'); }
    if (!root) return;

    var u = getUser();
    var pubName = '';
    try { pubName = state.pub && state.pub.name ? state.pub.name : ''; } catch (e) {}

    root.innerHTML = '<div class="modalCard profileCircleModal">' +
      '<button class="close" id="profileCircleClose">×</button>' +
      '<div class="profileCircleModalTop">' +
        '<span class="avatarText big">' + escapeText(getInitials(u.nickname || u.name)) + '</span>' +
        '<div><p class="muted">' + escapeText(pubName || 'Current user') + '</p>' +
        '<h2>' + escapeText(u.nickname || u.name || 'User') + '</h2>' +
        '<p>' + escapeText([u.role, u.area || u.jobArea].filter(Boolean).join(' · ')) + '</p></div>' +
      '</div>' +
      '<label>Switch user<select id="profileCircleUserSelect">' +
        state.users.map(function (x) { return '<option value="' + escapeText(x.id) + '" ' + (x.id === state.currentUser ? 'selected' : '') + '>' + escapeText(x.nickname || x.name) + ' (' + escapeText(x.role || 'User') + ')</option>'; }).join('') +
      '</select></label>' +
      '<div class="profileCircleActions profileCircleActionsThree">' +
        '<button id="profileCircleUsers">Full Profile</button>' +
        '<button id="profileCircleSchedule">Schedule</button>' +
        '<button id="profileCircleSettings">Settings</button>' +
      '</div>' +
      '</div>';

    root.classList.remove('hidden');

    document.getElementById('profileCircleClose').onclick = function () { root.classList.add('hidden'); };
    document.getElementById('profileCircleUserSelect').onchange = function (event) {
      state.currentUser = event.target.value;
      if (typeof save === 'function') save();
      root.classList.add('hidden');
      if (typeof render === 'function') render();
    };
    document.getElementById('profileCircleUsers').onclick = function () {
      root.classList.add('hidden');
      if (typeof window.openUserProfileModal === 'function') window.openUserProfileModal(u.id);
      else { route = 'settings'; render(); if (typeof window.openCoreSettingsSection === 'function') setTimeout(function () { window.openCoreSettingsSection('users'); }, 0); }
    };
    document.getElementById('profileCircleSchedule').onclick = function () { route = 'rota'; root.classList.add('hidden'); render(); };
    document.getElementById('profileCircleSettings').onclick = function () { route = 'settings'; root.classList.add('hidden'); render(); };
  }

  function ensureButton() {
    var topbar = document.querySelector('.topbar');
    if (!topbar || document.body.classList.contains('is-rota-route')) return;

    var button = document.getElementById('globalProfileCircle');
    if (!button) {
      button = document.createElement('button');
      button.id = 'globalProfileCircle';
      button.type = 'button';
      button.setAttribute('aria-label', 'Current user profile');
      topbar.appendChild(button);
    }

    var u = getUser();
    button.textContent = getInitials(u.nickname || u.name);
    button.onclick = function (event) {
      event.preventDefault();
      event.stopPropagation();
      openPanel();
    };
  }

  var style = document.createElement('style');
  style.textContent = '.profileSwitch,.rotaHomeIdentity{display:none!important;height:0!important;min-height:0!important;margin:0!important;padding:0!important;border:0!important;overflow:hidden!important}.topbar{display:grid!important;grid-template-columns:1fr auto!important;align-items:start!important;gap:12px!important}#globalProfileCircle{width:54px!important;height:54px!important;min-width:54px!important;min-height:54px!important;display:inline-flex!important;align-items:center!important;justify-content:center!important;border-radius:50%!important;background:linear-gradient(135deg,#B0914A,#d0ad58)!important;color:#060708!important;border:1px solid rgba(255,255,255,.16)!important;box-shadow:0 10px 26px rgba(176,145,74,.24)!important;font-size:18px!important;font-weight:950!important;padding:0!important;pointer-events:auto!important}.profileCircleModalTop{display:grid!important;grid-template-columns:auto 1fr!important;gap:14px!important;align-items:center!important;margin-bottom:18px!important}.profileCircleActionsThree{display:grid!important;grid-template-columns:1fr!important;gap:10px!important;margin-top:14px!important}';
  document.head.appendChild(style);

  function afterRender() { ensureButton(); }
  if (typeof bind === 'function' && !bind.__profileCircleFinalPatchV4) {
    var oldBind = bind;
    bind = function bindWithProfileCircle() {
      oldBind();
      afterRender();
    };
    bind.__profileCircleFinalPatchV4 = true;
  }

  document.addEventListener('click', function () { setTimeout(afterRender, 0); }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', afterRender); else afterRender();
})();
