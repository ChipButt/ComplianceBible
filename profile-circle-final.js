// Compact profile circle for the main app header.
// Removes the large duplicated user panels from Home and replaces them with one top-right profile control.
(function profileCircleFinalPatch() {
  if (window.__profileCircleFinalPatch) return;
  window.__profileCircleFinalPatch = true;

  function currentUser() {
    return (window.state && state.users && state.users.find(u => u.id === state.currentUser)) || (window.state && state.users && state.users[0]) || {};
  }

  function initials(name) {
    const text = String(name || 'User').trim();
    const parts = text.split(/\s+/).filter(Boolean);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return text.slice(0, 2).toUpperCase();
  }

  function userLabel(user) {
    return `${user.nickname || user.name || 'User'}${user.role ? ' · ' + user.role : ''}`;
  }

  function ensureButton() {
    const topbar = document.querySelector('.topbar');
    if (!topbar || document.body.classList.contains('is-rota-route')) return;

    let button = document.getElementById('globalProfileCircle');
    if (!button) {
      button = document.createElement('button');
      button.id = 'globalProfileCircle';
      button.type = 'button';
      button.setAttribute('aria-label', 'Current user profile');
      topbar.appendChild(button);
      button.addEventListener('click', openProfileModal);
    }

    const user = currentUser();
    button.textContent = initials(user.nickname || user.name);
    button.title = userLabel(user);
  }

  function openProfileModal() {
    if (!window.modalRoot || !window.state) return;
    const user = currentUser();
    modalRoot.innerHTML = `<div class="modalCard profileCircleModal">
      <button class="close" id="closeProfileCircleModal">×</button>
      <div class="profileCircleModalTop">
        <span class="avatarText big">${esc(initials(user.nickname || user.name))}</span>
        <div>
          <p class="muted">Current user</p>
          <h2>${esc(user.nickname || user.name || 'User')}</h2>
          <p>${esc([user.role, user.area || user.jobArea].filter(Boolean).join(' · '))}</p>
        </div>
      </div>
      <label>Switch user
        <select id="compactUserSwitch">
          ${state.users.map(u => `<option value="${u.id}" ${u.id === state.currentUser ? 'selected' : ''}>${esc(u.nickname || u.name)} (${esc(u.role || 'User')})</option>`).join('')}
        </select>
      </label>
      <div class="profileCircleActions">
        <button data-route="staff">Open Users</button>
        <button class="secondary" data-route="settings">Settings</button>
      </div>
    </div>`;
    modalRoot.classList.remove('hidden');

    const close = document.getElementById('closeProfileCircleModal');
    if (close) close.onclick = () => modalRoot.classList.add('hidden');

    const select = document.getElementById('compactUserSwitch');
    if (select) select.onchange = event => {
      state.currentUser = event.target.value;
      if (typeof save === 'function') save();
      modalRoot.classList.add('hidden');
      if (typeof render === 'function') render();
      setTimeout(ensureButton, 0);
    };

    modalRoot.querySelectorAll('[data-route]').forEach(btn => btn.onclick = () => {
      window.route = btn.dataset.route;
      if (typeof route !== 'undefined') route = btn.dataset.route;
      modalRoot.classList.add('hidden');
      if (typeof render === 'function') render();
      setTimeout(ensureButton, 0);
    });
  }

  const style = document.createElement('style');
  style.textContent = `
    .profileSwitch,
    .rotaHomeIdentity {
      display: none !important;
      height: 0 !important;
      min-height: 0 !important;
      margin: 0 !important;
      padding: 0 !important;
      border: 0 !important;
      overflow: hidden !important;
    }

    .topbar {
      display: grid !important;
      grid-template-columns: 1fr auto !important;
      align-items: start !important;
      gap: 12px !important;
    }

    #globalProfileCircle {
      width: 54px !important;
      height: 54px !important;
      min-width: 54px !important;
      min-height: 54px !important;
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      align-self: start !important;
      margin-top: 2px !important;
      border-radius: 50% !important;
      background: linear-gradient(135deg, #B0914A, #d0ad58) !important;
      color: #060708 !important;
      border: 1px solid rgba(255,255,255,.16) !important;
      box-shadow: 0 10px 26px rgba(176,145,74,.24) !important;
      font-size: 18px !important;
      font-weight: 950 !important;
      letter-spacing: -.04em !important;
      padding: 0 !important;
      z-index: 12 !important;
    }

    #installBtn:not(.hidden) + #globalProfileCircle {
      margin-left: 8px !important;
    }

    .profileCircleModalTop {
      display: grid !important;
      grid-template-columns: auto 1fr !important;
      gap: 16px !important;
      align-items: center !important;
      margin-bottom: 18px !important;
    }

    .profileCircleActions {
      display: grid !important;
      grid-template-columns: 1fr 1fr !important;
      gap: 10px !important;
      margin-top: 14px !important;
    }

    .rotaHomePanel {
      margin-top: 0 !important;
    }
  `;
  document.head.appendChild(style);

  function afterRender() {
    ensureButton();
  }

  if (typeof bind === 'function' && !bind.__profileCircleFinalPatch) {
    const oldBind = bind;
    bind = function bindWithProfileCircle() {
      oldBind();
      afterRender();
    };
    bind.__profileCircleFinalPatch = true;
  }

  document.addEventListener('click', () => setTimeout(afterRender, 0), true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', afterRender); else afterRender();
})();