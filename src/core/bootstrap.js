(function () {
  const originalNav = nav;
  nav = function maintenanceAwareNav(id, label) {
    return originalNav(id, id === 'logs' ? 'Maintenance' : label);
  };

  const originalDashboard = dashboard;
  dashboard = function dashboardWithReportIssue() {
    return originalDashboard() + `<details class="card homeReportIssue"><summary>Report an Issue</summary><form id="homeLogForm" class="stack"><select name="type"><option>Incident</option><option>Alcohol Refusal</option><option>Accident</option><option>Pest Sighting</option></select><input name="summary" placeholder="Short summary" required><textarea name="details" placeholder="Details, witnesses, action taken"></textarea><button class="primary">Add log</button></form></details>`;
  };

  function activeMaintenanceIssues() {
    return (state.issues || []).filter(issue => issue.status !== 'Resolved');
  }

  function shoppingItems() {
    if (!Array.isArray(state.shoppingItems)) state.shoppingItems = [];
    return state.shoppingItems;
  }

  function shoppingListMarkup() {
    const items = shoppingItems().filter(item => item.status !== 'Completed');
    return items.length ? `<ul class="shoppingListItems">${items.map(item => `<li><span>${esc(item.title)}</span><button type="button" class="ghost small" data-shopping-complete="${item.id}">Done</button></li>`).join('')}</ul>` : '<p class="muted">Nothing on the shopping list yet.</p>';
  }

  function maintenanceIssueMarkup() {
    const issues = activeMaintenanceIssues();
    return issues.length ? `<div class="maintenanceIssueList">${issues.map(issue => `<details class="maintenanceIssueItem"><summary><span><strong>${esc(issue.title)}</strong><small>${esc(issue.area || 'No location set')}</small></span><span class="maintenanceExpandIcon">⌄</span></summary><div class="maintenanceIssueBody"><p>${esc(issue.notes || 'No extra details added.')}</p><button type="button" class="primary" data-issue="${issue.id}">Mark as complete</button></div></details>`).join('')}</div>` : '<p class="muted">No open maintenance issues.</p>';
  }

  logs = function maintenancePage() {
    shoppingItems();
    return `<section class="maintenancePage"><article class="card maintenanceCard"><h2>Report an issue</h2><form id="issueForm" class="maintenanceIssueForm stack"><input name="title" placeholder="Issue title" required><input name="area" placeholder="Location" required><textarea name="notes" placeholder="What needs fixing?" required></textarea><input type="hidden" name="severity" value="Maintenance"><button class="primary">Report issue</button></form><h2 class="maintenanceListTitle">Open maintenance issues</h2>${maintenanceIssueMarkup()}</article><article class="card shoppingListCard"><div class="shoppingListHeader"><div><h2>Shopping list</h2><p class="muted">Add things the team are running low on.</p></div><div class="shoppingListIcon" aria-hidden="true">▤</div></div><form id="shoppingForm" class="shoppingForm"><input name="title" placeholder="Add item, e.g. mint tea" required><button class="primary">Add</button></form>${shoppingListMarkup()}</article></section>`;
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

  const maintenanceStyle = document.createElement('style');
  maintenanceStyle.id = 'maintenance-page-clean-layout';
  maintenanceStyle.textContent = `
    .maintenancePage { display: grid !important; gap: 16px !important; }
    .maintenanceCard,.shoppingListCard { overflow: hidden !important; }
    .maintenanceIssueForm { margin-bottom: 20px !important; }
    .maintenanceListTitle { margin-top: 10px !important; }
    .maintenanceIssueList { display: grid !important; gap: 10px !important; }
    .maintenanceIssueItem { border: 1px solid rgba(255,255,255,.09) !important; border-radius: 18px !important; background: rgba(255,255,255,.035) !important; overflow: hidden !important; }
    .maintenanceIssueItem summary { list-style: none !important; cursor: pointer !important; display: grid !important; grid-template-columns: minmax(0,1fr) auto !important; align-items: center !important; gap: 12px !important; padding: 14px !important; }
    .maintenanceIssueItem summary::-webkit-details-marker { display: none !important; }
    .maintenanceIssueItem strong { display: block !important; color: #fff8ea !important; font-size: 17px !important; line-height: 1.15 !important; }
    .maintenanceIssueItem small { display: block !important; color: #aaa194 !important; font-size: 13px !important; margin-top: 4px !important; }
    .maintenanceExpandIcon { color: #d0ad58 !important; font-size: 24px !important; line-height: 1 !important; transition: transform .16s ease !important; }
    .maintenanceIssueItem[open] .maintenanceExpandIcon { transform: rotate(180deg) !important; }
    .maintenanceIssueBody { padding: 0 14px 14px !important; display: grid !important; gap: 12px !important; }
    .maintenanceIssueBody p { margin: 0 !important; }
    .shoppingListHeader { display: grid !important; grid-template-columns: minmax(0,1fr) 58px !important; gap: 12px !important; align-items: center !important; }
    .shoppingListHeader h2 { margin-bottom: 4px !important; }
    .shoppingListIcon { width: 58px !important; height: 58px !important; border-radius: 18px !important; display: grid !important; place-items: center !important; color: #d0ad58 !important; background: rgba(176,145,74,.16) !important; font-size: 34px !important; font-weight: 900 !important; }
    .shoppingForm { display: grid !important; grid-template-columns: minmax(0,1fr) 76px !important; gap: 10px !important; margin: 14px 0 !important; }
    .shoppingListItems { list-style: none !important; padding: 0 !important; margin: 0 !important; display: grid !important; gap: 8px !important; }
    .shoppingListItems li { display: grid !important; grid-template-columns: minmax(0,1fr) auto !important; gap: 10px !important; align-items: center !important; padding: 10px 12px !important; border-radius: 14px !important; background: rgba(255,255,255,.04) !important; border: 1px solid rgba(255,255,255,.08) !important; }
    .shoppingListItems span { color: #fff8ea !important; font-weight: 800 !important; }
    .rotaHomePanel > h2, .rotaHomePanel .homeShiftList { display: none !important; }
    .homeReportIssue { margin-top: 18px !important; }
    .homeReportIssue summary { cursor: pointer !important; display: grid !important; grid-template-columns: minmax(0,1fr) auto !important; align-items: center !important; gap: 12px !important; font-size: 22px !important; font-weight: 900 !important; color: #d83b2d !important; list-style: none !important; }
    .homeReportIssue summary::-webkit-details-marker { display: none !important; }
    .homeReportIssue summary::after { content: '⌄'; color: #d83b2d !important; font-size: 24px !important; line-height: 1 !important; transition: transform .16s ease !important; }
    .homeReportIssue[open] summary::after { transform: rotate(180deg) !important; }
    .homeReportIssue form { margin-top: 16px !important; }
  `;
  document.head.appendChild(maintenanceStyle);

  let editUserLockedScrollY = 0;
  const editUserStyle = document.createElement('style');
  editUserStyle.id = 'edit-user-modal-lock-fix';
  editUserStyle.textContent = `body.edit-user-modal-open{overflow:hidden!important;position:fixed!important;width:100%!important;left:0!important;right:0!important;touch-action:none!important}body.edit-user-modal-open #modal{touch-action:auto!important}#modal.editUserModalOpen{position:fixed!important;inset:calc(var(--fixed-topbar-height,112px) + var(--fixed-mainnav-height,80px)) 0 0 0!important;z-index:1000!important;display:flex!important;align-items:flex-start!important;justify-content:center!important;padding:14px 12px max(18px,env(safe-area-inset-bottom))!important;box-sizing:border-box!important;overflow:hidden!important;background:rgba(0,0,0,.58)!important}#modal.editUserModalOpen.hidden{display:none!important}#modal.editUserModalOpen .modalCard.editUserModalCard{width:min(720px,100%)!important;max-width:calc(100vw - 24px)!important;max-height:100%!important;margin:0 auto!important;box-sizing:border-box!important;overflow-y:auto!important;overflow-x:hidden!important;-webkit-overflow-scrolling:touch!important;padding:0!important;border-radius:24px!important}#modal.editUserModalOpen .editUserTopBar{position:sticky!important;top:0!important;z-index:6!important;display:grid!important;grid-template-columns:82px minmax(0,1fr) 48px!important;align-items:center!important;gap:10px!important;padding:14px 16px!important;background:#151b22!important;border-bottom:1px solid rgba(255,255,255,.08)!important}#modal.editUserModalOpen .editUserTopBar h2{margin:0!important;text-align:center!important;font-size:20px!important;line-height:1.1!important}#modal.editUserModalOpen .editUserTopBar .close,#modal.editUserModalOpen .editUserTopBar .saveUserButton{width:auto!important;min-width:48px!important;max-width:82px!important;height:44px!important;min-height:44px!important;display:flex!important;align-items:center!important;justify-content:center!important;padding:0 12px!important;margin:0!important;border-radius:999px!important;box-sizing:border-box!important;float:none!important;position:static!important}#modal.editUserModalOpen .editUserFormBody{padding:0 18px 18px!important}#modal.editUserModalOpen .editUserPhotoRow{display:flex!important;align-items:center!important;gap:14px!important;padding:18px 0!important;border-bottom:1px solid rgba(255,255,255,.08)!important;color:#aaa194!important;font-size:18px!important;font-weight:700!important}#modal.editUserModalOpen .editUserField{display:block!important;padding:14px 0!important;border-bottom:1px solid rgba(255,255,255,.08)!important}#modal.editUserModalOpen .editUserField span{display:block!important;color:#aaa194!important;font-size:15px!important;font-weight:750!important;margin:0 0 6px!important}#modal.editUserModalOpen .editUserField input,#modal.editUserModalOpen .editUserField select,#modal.editUserModalOpen .editUserField textarea{width:100%!important;max-width:100%!important;min-height:38px!important;margin:0!important;padding:0!important;border:0!important;border-radius:0!important;background:transparent!important;box-shadow:none!important;color:#fff8ea!important;font-size:20px!important;line-height:1.25!important;box-sizing:border-box!important}#modal.editUserModalOpen .editUserField textarea{min-height:58px!important;padding-top:4px!important;resize:vertical!important}#modal.editUserModalOpen .modalCard.editUserModalCard form,#modal.editUserModalOpen .modalCard.editUserModalCard .stack{width:100%!important;max-width:100%!important;box-sizing:border-box!important;overflow-x:hidden!important;gap:0!important}`;
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

  function returnToEditedUserProfile(id) {
    if (!id) return;
    window.__returnToUserProfileId = null;
    if (typeof render === 'function') render();
    setTimeout(() => {
      if (typeof window.openUserProfileModal === 'function') window.openUserProfileModal(id);
    }, 0);
  }

  function closeEditUserModal(returnToProfile = true) {
    const returnId = window.__returnToUserProfileId;
    modalRoot.classList.add('hidden');
    modalRoot.classList.remove('editUserModalOpen');
    modalRoot.innerHTML = '';
    unlockEditUserBackground();
    if (returnToProfile) returnToEditedUserProfile(returnId);
  }

  function splitNameParts(userRecord) {
    const full = String(userRecord.name || '').trim();
    const parts = full.split(/\s+/).filter(Boolean);
    return { first: userRecord.firstName || parts.shift() || '', last: userRecord.lastName || parts.join(' ') };
  }

  function field(label, name, value, attrs = '') {
    return `<label class="editUserField"><span>${esc(label)}</span><input name="${name}" value="${esc(value || '')}" ${attrs}></label>`;
  }

  function textareaField(label, name, value) {
    return `<label class="editUserField"><span>${esc(label)}</span><textarea name="${name}">${esc(value || '')}</textarea></label>`;
  }

  openUserEditor = function lockedOpenUserEditor(id) {
    const u = state.users.find(x => x.id === id);
    if (!u) return;
    window.__returnToUserProfileId = id;
    const nameParts = splitNameParts(u);
    lockEditUserBackground();
    modalRoot.innerHTML = `<div class="modalCard editUserModalCard"><form id="editUserForm" class="stack"><div class="editUserTopBar"><button class="primary saveUserButton" type="submit">Save</button><h2>Edit profile</h2><button class="close" id="closeModal" type="button">×</button></div><div class="editUserFormBody"><div class="editUserPhotoRow"><span class="avatarText">${esc(userInitials(u.name))}</span><span>Profile photo</span></div>${field('First name','firstName',nameParts.first,'required')}${field('Last name','lastName',nameParts.last)}${field('Nickname','nickname',u.nickname || '')}${field('Email','email',u.email || '', 'type="email"')}${field('Mobile','mobile',u.mobile || '')}${field('Emergency contact name','emergencyContactName',u.emergencyContactName || '')}${field('Emergency phone number','emergencyPhone',u.emergencyPhone || '')}${textareaField('Address','address',u.address || '')}${field('Date of birth','dob',u.dob || '')}${field('Pronouns','pronouns',u.pronouns || '')}<label class="editUserField"><span>Job area</span><select name="area">${optionList(state.areas, u.area || u.jobArea)}</select></label><label class="editUserField"><span>Role</span><select name="role">${optionList(['Staff', 'Supervisor', 'Admin'], u.role)}</select></label>${field('Pay rate','wage',u.wage || 0,'type="number" step="0.01"')}</div></form></div>`;
    modalRoot.classList.add('editUserModalOpen');
    modalRoot.classList.remove('hidden');
    document.getElementById('closeModal').onclick = () => closeEditUserModal(true);
    modalRoot.onclick = event => { if (event.target === modalRoot) closeEditUserModal(true); };
    document.getElementById('editUserForm').onsubmit = event => {
      const d = fd(event);
      const fullName = `${d.firstName || ''} ${d.lastName || ''}`.trim();
      Object.assign(u, d, { name: fullName || u.name, nickname: d.nickname || u.nickname });
      u.jobArea = d.area || u.jobArea || u.area;
      save();
      closeEditUserModal(true);
    };
  };

  function bindMaintenanceExtras() {
    const homeLogForm = document.getElementById('homeLogForm');
    if (homeLogForm && !homeLogForm.dataset.bound) {
      homeLogForm.dataset.bound = '1';
      homeLogForm.onsubmit = event => {
        const data = fd(event);
        state.logs.push({ id: uid(), type: data.type, summary: data.summary, details: data.details, userId: state.currentUser, created: new Date().toISOString() });
        save();
        render();
      };
    }
    const shopForm = document.getElementById('shoppingForm');
    if (shopForm && !shopForm.dataset.bound) {
      shopForm.dataset.bound = '1';
      shopForm.onsubmit = event => {
        const data = fd(event);
        shoppingItems().push({ id: uid(), title: data.title, status: 'Open', created: new Date().toISOString(), userId: state.currentUser });
        save();
        render();
      };
    }
    document.querySelectorAll('[data-shopping-complete]').forEach(button => {
      if (button.dataset.bound) return;
      button.dataset.bound = '1';
      button.onclick = () => {
        const item = shoppingItems().find(entry => entry.id === button.dataset.shoppingComplete);
        if (item) item.status = 'Completed';
        save();
        render();
      };
    });
  }

  if (typeof bind === 'function' && !bind.__maintenanceExtrasWrapped) {
    const previousBindForMaintenanceExtras = bind;
    bind = function bindWithMaintenanceExtras() {
      previousBindForMaintenanceExtras();
      bindMaintenanceExtras();
    };
    bind.__maintenanceExtrasWrapped = true;
  }

  document.addEventListener('touchmove', event => {
    if (!modalRoot.classList.contains('editUserModalOpen')) return;
    if (!event.target.closest('.editUserModalCard')) event.preventDefault();
  }, { passive: false });

  function countPendingChecksForBadge() {
    try {
      if (typeof hasPermission === 'function' && !hasPermission('checks')) return 0;
      return (state.checks || []).filter(check => typeof done === 'function' && !done(check.id)).length;
    } catch (_) {
      return 0;
    }
  }

  function syncCheckNotificationBadge() {
    const button = document.querySelector('.bottomNav .navBtn[data-route="checks"]');
    if (!button) return;
    const count = countPendingChecksForBadge();
    if (count > 0) button.setAttribute('data-alert-count', String(count));
    else button.removeAttribute('data-alert-count');
  }

  if (typeof render === 'function' && !render.__checkNotificationBadgeWrapped) {
    const previousRenderForCheckBadge = render;
    render = function renderWithCheckNotificationBadge() {
      previousRenderForCheckBadge();
      syncCheckNotificationBadge();
      setTimeout(syncCheckNotificationBadge, 0);
    };
    render.__checkNotificationBadgeWrapped = true;
  }

  document.addEventListener('click', () => setTimeout(syncCheckNotificationBadge, 0), true);
  document.addEventListener('change', () => setTimeout(syncCheckNotificationBadge, 0), true);
})();

startApp();