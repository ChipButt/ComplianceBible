(function () {
  const originalNav = nav;
  nav = function maintenanceAwareNav(id, label) {
    return originalNav(id, id === 'logs' ? 'Maintenance' : label);
  };

  logs = function maintenancePage() {
    return `<section class="grid two"><article class="card"><h2>Maintenance log</h2><form id="logForm" class="stack"><select name="type"><option>Maintenance</option><option>Incident</option><option>Alcohol Refusal</option><option>Accident</option><option>Pest Sighting</option><option>Cleaning Exception</option></select><input name="summary" placeholder="Short summary" required><textarea name="details" placeholder="Details, witnesses, action taken"></textarea><button class="primary">Add maintenance log</button></form>${logList()}</article><article class="card"><h2>Report an issue</h2><form id="issueForm" class="issueForm"><input name="title" placeholder="Issue title" required><select name="area">${state.areas.map(a => `<option>${esc(a)}</option>`).join('')}</select><select name="severity"><option>Low</option><option>Medium</option><option>High</option><option>Critical</option></select><textarea name="notes" placeholder="What needs fixing?"></textarea><button class="primary">Report issue</button></form><div class="issueList">${state.issues.map(i => `<div class="docItem"><div><strong>${esc(i.title)}</strong><span>${esc(i.area)} · ${esc(i.severity)} · ${new Date(i.created).toLocaleString()}</span><p>${esc(i.notes)}</p></div><div>${badge(i.status, i.status === 'Resolved' ? 'ok' : 'warn')}<button class="ghost small" data-issue="${i.id}">${i.status === 'Resolved' ? 'Reopen' : 'Resolve'}</button></div></div>`).join('')}</div></article></section>`;
  };

  logList = function maintenanceLogList() {
    return state.logs.length ? `<ul class="plainList">${[...state.logs].reverse().slice(0, 8).map(l => `<li><span>${esc(l.type)}: ${esc(l.summary)}</span><small>${new Date(l.created).toLocaleString()}</small></li>`).join('')}</ul>` : '<p class="muted">No maintenance logs yet.</p>';
  };

  const originalSetNavIcons = setNavIcons;
  setNavIcons = function maintenanceNavIcons() {
    originalSetNavIcons();
    document.querySelectorAll('[data-route="logs"]').forEach(button => {
      button.textContent = 'Maintenance';
    });
  };

  let editUserLockedScrollY = 0;
  const editUserStyle = document.createElement('style');
  editUserStyle.id = 'edit-user-modal-lock-fix';
  editUserStyle.textContent = `
    body.edit-user-modal-open {
      overflow: hidden !important;
      position: fixed !important;
      width: 100% !important;
      left: 0 !important;
      right: 0 !important;
      touch-action: none !important;
    }
    body.edit-user-modal-open #modal {
      touch-action: auto !important;
    }
    #modal.editUserModalOpen {
      position: fixed !important;
      inset: calc(var(--fixed-topbar-height,112px) + var(--fixed-mainnav-height,80px)) 0 0 0 !important;
      z-index: 1000 !important;
      display: flex !important;
      align-items: flex-start !important;
      justify-content: center !important;
      padding: 14px 12px max(18px,env(safe-area-inset-bottom)) !important;
      box-sizing: border-box !important;
      overflow: hidden !important;
      background: rgba(0,0,0,.58) !important;
    }
    #modal.editUserModalOpen.hidden {
      display: none !important;
    }
    #modal.editUserModalOpen .modalCard.editUserModalCard {
      width: min(720px,100%) !important;
      max-width: calc(100vw - 24px) !important;
      max-height: 100% !important;
      margin: 0 auto !important;
      box-sizing: border-box !important;
      overflow-y: auto !important;
      overflow-x: hidden !important;
      -webkit-overflow-scrolling: touch !important;
      padding: 18px !important;
      border-radius: 24px !important;
    }
    #modal.editUserModalOpen .modalCard.editUserModalCard form,
    #modal.editUserModalOpen .modalCard.editUserModalCard .stack {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
      overflow-x: hidden !important;
    }
    #modal.editUserModalOpen .modalCard.editUserModalCard input,
    #modal.editUserModalOpen .modalCard.editUserModalCard select,
    #modal.editUserModalOpen .modalCard.editUserModalCard textarea,
    #modal.editUserModalOpen .modalCard.editUserModalCard button {
      width: 100% !important;
      max-width: 100% !important;
      box-sizing: border-box !important;
    }
    #modal.editUserModalOpen .modalCard.editUserModalCard .close {
      position: sticky !important;
      top: 0 !important;
      float: right !important;
      z-index: 3 !important;
      width: 34px !important;
      min-width: 34px !important;
      height: 34px !important;
      min-height: 34px !important;
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      padding: 0 !important;
      border-radius: 999px !important;
    }
  `;
  document.head.appendChild(editUserStyle);

  function lockEditUserBackground() {
    editUserLockedScrollY = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
    document.body.style.top = `-${editUserLockedScrollY}px`;
    document.body.classList.add('edit-user-modal-open');
    document.documentElement.style.overflow = 'hidden';
  }

  function unlockEditUserBackground() {
    document.body.classList.remove('edit-user-modal-open');
    document.body.style.top = '';
    document.documentElement.style.overflow = '';
    window.scrollTo(0, editUserLockedScrollY || 0);
  }

  function closeEditUserModal() {
    modalRoot.classList.add('hidden');
    modalRoot.classList.remove('editUserModalOpen');
    modalRoot.innerHTML = '';
    unlockEditUserBackground();
  }

  openUserEditor = function lockedOpenUserEditor(id) {
    const u = state.users.find(x => x.id === id);
    if (!u) return;
    lockEditUserBackground();
    modalRoot.innerHTML = `<div class="modalCard editUserModalCard"><button class="close" id="closeModal" type="button">×</button><h2>Edit user profile</h2>
      <form id="editUserForm" class="stack"><input name="name" value="${esc(u.name)}" required><input name="nickname" value="${esc(u.nickname)}" required><input name="email" value="${esc(u.email || '')}" placeholder="Email"><input name="mobile" value="${esc(u.mobile || '')}" placeholder="Mobile"><input name="dob" value="${esc(u.dob || '')}" placeholder="Date of birth"><textarea name="address" placeholder="Address">${esc(u.address || '')}</textarea><input name="wage" type="number" step="0.01" value="${esc(u.wage || 0)}"><input name="pronouns" value="${esc(u.pronouns || '')}" placeholder="Pronouns"><select name="area">${optionList(state.areas, u.area || u.jobArea)}</select><select name="role">${optionList(['Staff', 'Supervisor', 'Admin'], u.role)}</select><button class="primary">Save user profile</button></form>
      <h3>Add training document record</h3><form id="trainingDocForm" class="stack"><input name="title" placeholder="Document title e.g. Food Hygiene Certificate" required><textarea name="note" placeholder="Upload/link note for now. Real file upload comes with backend storage."></textarea><button class="primary">Add training document record</button></form>
    </div>`;
    modalRoot.classList.add('editUserModalOpen');
    modalRoot.classList.remove('hidden');
    document.getElementById('closeModal').onclick = closeEditUserModal;
    modalRoot.onclick = event => {
      if (event.target === modalRoot) closeEditUserModal();
    };
    document.getElementById('editUserForm').onsubmit = event => {
      const d = fd(event);
      Object.assign(u, d);
      u.jobArea = d.area || u.jobArea || u.area;
      save();
      closeEditUserModal();
      render();
    };
    document.getElementById('trainingDocForm').onsubmit = event => {
      const d = fd(event);
      state.trainingDocs.push({ id: uid(), userId: id, title: d.title, note: d.note, created: new Date().toISOString() });
      save();
      closeEditUserModal();
      render();
    };
  };

  document.addEventListener('touchmove', event => {
    if (!modalRoot.classList.contains('editUserModalOpen')) return;
    if (!event.target.closest('.editUserModalCard')) event.preventDefault();
  }, { passive: false });
})();

startApp();