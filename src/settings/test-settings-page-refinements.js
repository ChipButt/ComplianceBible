// Branch-only refinements for the test settings page prototype.
(function testSettingsPageRefinements(){
  if(window.__testSettingsPageRefinements) return;
  window.__testSettingsPageRefinements = true;

  const SECTION_KEY = 'complianceBible.testSettingsSection.v1';
  const ROTA_KEY = 'rotaAppUnifiedV2';
  let modalDrag = null;

  function appState(){ try { return state || {}; } catch(_) { return {}; } }
  function saveSafe(){ try { if(typeof save === 'function') save(); } catch(_){} }
  function esc(value){ return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
  function normalise(value){ return String(value || '').trim().toLowerCase(); }
  function readJSON(key,fallback){ try { const parsed = JSON.parse(localStorage.getItem(key) || 'null'); return parsed || fallback; } catch(_) { return fallback; } }
  function writeJSON(key,value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch(_){} }

  function removeNoUpcomingFullStop(){
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while(walker.nextNode()) nodes.push(walker.currentNode);
    nodes.forEach(node => {
      if(!node || !node.nodeValue) return;
      node.nodeValue = node.nodeValue
        .replace(/No upcoming shift\./g, 'No upcoming shift')
        .replace(/No upcoming shifts\./g, 'No upcoming shifts');
    });
  }

  function dueAssignedChecksCount(){
    const s = appState();
    const me = s.currentUser || (s.users && s.users[0] && s.users[0].id) || '';
    const today = (typeof window.today === 'function' ? window.today() : new Date().toISOString().slice(0,10));
    return (s.checks || []).filter(check => {
      if(!check) return false;
      if(check.assignedUserId && check.assignedUserId !== me) return false;
      try { if(typeof done === 'function' && done(check.id)) return false; } catch(_) {}
      return true;
    }).length;
  }

  function steadyNotificationDots(){
    const count = dueAssignedChecksCount();
    ['dashboard','checks'].forEach(route => {
      document.querySelectorAll('.bottomNav .navBtn[data-route="' + route + '"], .mainNav .navBtn[data-route="' + route + '"]').forEach(btn => {
        if(count > 0) btn.setAttribute('data-alert-count','1');
        else btn.removeAttribute('data-alert-count');
      });
    });
  }

  function getSectionTitle(id){
    const map = {
      pub:'Pub Details', users:'Users & Permission Groups', documents:'Documents', checks:'Checks', rota:'Rota & Time', issues:'Issues & Inspection', areas:'Work Areas', notifications:'Notification Rules'
    };
    return map[id] || 'Settings';
  }

  function openSettingsSectionAsModal(sectionId){
    localStorage.setItem(SECTION_KEY, sectionId);
    if(typeof render === 'function') render();
    setTimeout(() => {
      const panel = document.querySelector('.testSettingsPage > .testSettingsPanel');
      if(!panel || !window.modalRoot) return;
      const title = getSectionTitle(sectionId);
      modalRoot.innerHTML = '<div class="modalCard testSettingsModalCard" role="dialog" aria-modal="true"><div class="testSettingsModalHandle"><h2>' + esc(title) + '</h2><button type="button" class="close" data-close-test-settings>×</button></div><div class="testSettingsModalBody"></div></div>';
      modalRoot.classList.remove('hidden');
      modalRoot.classList.add('testSettingsModalOpen');
      document.body.classList.add('test-settings-modal-open');
      const body = modalRoot.querySelector('.testSettingsModalBody');
      body.appendChild(panel);
      panel.style.display = 'grid';
      wireModalDrag(modalRoot.querySelector('.testSettingsModalCard'), modalRoot.querySelector('.testSettingsModalHandle'));
      const close = () => closeSettingsModal();
      modalRoot.querySelector('[data-close-test-settings]').onclick = close;
      modalRoot.onclick = event => { if(event.target === modalRoot) close(); };
      enhanceModalContents();
    }, 0);
  }

  function closeSettingsModal(){
    if(!window.modalRoot) return;
    modalRoot.classList.add('hidden');
    modalRoot.classList.remove('testSettingsModalOpen');
    document.body.classList.remove('test-settings-modal-open');
    modalRoot.innerHTML = '';
    if(typeof render === 'function') render();
  }

  function wireModalDrag(card, handle){
    if(!card || !handle) return;
    let startX = 0, startY = 0, baseX = 0, baseY = 0;
    handle.onpointerdown = event => {
      if(event.target.closest('button')) return;
      event.preventDefault();
      startX = event.clientX;
      startY = event.clientY;
      const x = Number(card.dataset.dragX || 0);
      const y = Number(card.dataset.dragY || 0);
      baseX = x;
      baseY = y;
      modalDrag = { card, pointerId:event.pointerId };
      try { handle.setPointerCapture(event.pointerId); } catch(_) {}
      card.classList.add('dragging');
    };
    handle.onpointermove = event => {
      if(!modalDrag || modalDrag.card !== card) return;
      const nextX = baseX + (event.clientX - startX);
      const nextY = baseY + (event.clientY - startY);
      card.dataset.dragX = String(nextX);
      card.dataset.dragY = String(nextY);
      card.style.transform = 'translate(' + nextX + 'px,' + nextY + 'px)';
    };
    const finish = () => { if(card) card.classList.remove('dragging'); modalDrag = null; };
    handle.onpointerup = finish;
    handle.onpointercancel = finish;
  }

  function enhanceGroupMembershipControls(){
    const users = (appState().users || []);
    const areas = Array.from(new Set(users.map(user => user.jobArea || user.area || '').filter(Boolean))).sort((a,b)=>a.localeCompare(b));
    document.querySelectorAll('.testAssignedUsers').forEach(section => {
      const heading = section.querySelector('h4');
      if(heading) heading.textContent = "Who's in this group?";
      if(section.querySelector('.testGroupQuickSelect')) return;
      const controls = document.createElement('div');
      controls.className = 'testGroupQuickSelect';
      controls.innerHTML = '<label class="testMiniCheck"><input type="checkbox" data-select-all-users><span>All users</span></label><label class="testWorkAreaPicker"><span>Add by work area</span><select data-select-work-area><option value="">Select work area</option>' + areas.map(area => '<option value="' + esc(area) + '">' + esc(area) + '</option>').join('') + '</select></label>';
      const grid = section.querySelector('.testCheckboxGrid.users');
      section.insertBefore(controls, grid || null);
      const all = controls.querySelector('[data-select-all-users]');
      const picker = controls.querySelector('[data-select-work-area]');
      if(all) all.onchange = () => {
        section.querySelectorAll('.testCheckboxGrid.users input[type="checkbox"]:not(:disabled)').forEach(input => input.checked = all.checked);
      };
      if(picker) picker.onchange = () => {
        const area = normalise(picker.value);
        if(!area) return;
        users.forEach(user => {
          const userArea = normalise(user.jobArea || user.area || '');
          if(userArea !== area) return;
          const input = section.querySelector('[name="user__' + cssEscape(user.id) + '"]');
          if(input && !input.disabled) input.checked = true;
        });
        picker.value = '';
      };
    });
  }

  function cssEscape(value){ try { return CSS.escape(String(value)); } catch(_) { return String(value).replace(/"/g,'\\"'); } }

  function syncWorkAreaOrderFromDom(list){
    const order = Array.from(list.querySelectorAll('[data-test-work-area]')).map(row => row.dataset.testWorkArea).filter(Boolean);
    if(!order.length) return;
    state.areas = order.slice();
    state.rotaSettings = state.rotaSettings || { sections: [] };
    state.rotaSettings.sections = order.slice();
    const rota = readJSON(ROTA_KEY, {});
    rota.sections = order.slice();
    writeJSON(ROTA_KEY, rota);
    saveSafe();
  }

  function makeWorkAreasReorderable(){
    document.querySelectorAll('.testAreaList').forEach(list => {
      if(list.dataset.reorderReady) return;
      list.dataset.reorderReady = '1';
      list.querySelectorAll('.testAreaRow').forEach(row => {
        const label = row.querySelector('span');
        const area = label ? label.textContent.trim() : '';
        row.dataset.testWorkArea = area;
        row.draggable = true;
        if(!row.querySelector('.testDragHandle')){
          const handle = document.createElement('span');
          handle.className = 'testDragHandle';
          handle.textContent = '☰';
          row.insertBefore(handle, row.firstChild);
        }
        row.ondragstart = event => {
          row.classList.add('dragging');
          try { event.dataTransfer.effectAllowed = 'move'; event.dataTransfer.setData('text/plain', area); } catch(_) {}
        };
        row.ondragover = event => {
          event.preventDefault();
          const dragging = list.querySelector('.testAreaRow.dragging');
          if(!dragging || dragging === row) return;
          const rect = row.getBoundingClientRect();
          list.insertBefore(dragging, event.clientY > rect.top + rect.height / 2 ? row.nextSibling : row);
        };
        row.ondragend = () => { row.classList.remove('dragging'); syncWorkAreaOrderFromDom(list); };
        row.ondrop = event => { event.preventDefault(); syncWorkAreaOrderFromDom(list); };
      });
    });
  }

  function enhanceModalContents(){
    enhanceGroupMembershipControls();
    makeWorkAreasReorderable();
    removeUnneededInfoBoxes();
    removeNoUpcomingFullStop();
    steadyNotificationDots();
  }

  function removeUnneededInfoBoxes(){
    document.querySelectorAll('.testSettingsModalBody .testInfoBox').forEach(box => box.remove());
  }

  function installClickInterceptors(){
    document.addEventListener('click', event => {
      const tile = event.target.closest('[data-test-settings-section]');
      if(tile){
        event.preventDefault();
        event.stopImmediatePropagation();
        openSettingsSectionAsModal(tile.dataset.testSettingsSection);
        return;
      }
      setTimeout(() => { removeNoUpcomingFullStop(); steadyNotificationDots(); }, 0);
    }, true);
  }

  const style = document.createElement('style');
  style.id = 'test-settings-page-refinements-style';
  style.textContent = `
    .testSettingsPage > .testSettingsPanel { display: none !important; }
    #app .testSettingsTile { background: rgba(255,255,255,.045) !important; border: 1px solid rgba(208,173,88,.52) !important; color: #fff8ea !important; box-shadow: none !important; }
    #app .testSettingsTile strong { color: #fff8ea !important; }
    #app .testSettingsTile span { color: #fff8ea !important; opacity: .88 !important; }
    #app .testSettingsTile.active { background: rgba(176,145,74,.12) !important; border-color: rgba(208,173,88,.9) !important; }
    #modal.testSettingsModalOpen { position: fixed !important; inset: calc(var(--fixed-topbar-height,112px) + var(--fixed-mainnav-height,80px)) 0 0 0 !important; z-index: 1400 !important; display: flex !important; align-items: flex-start !important; justify-content: center !important; padding: 14px !important; background: rgba(0,0,0,.68) !important; overflow: hidden !important; box-sizing: border-box !important; }
    #modal.testSettingsModalOpen.hidden { display: none !important; }
    #modal .testSettingsModalCard { width: min(760px,100%) !important; max-height: 100% !important; margin: 0 !important; padding: 0 !important; overflow: hidden !important; display: grid !important; grid-template-rows: auto minmax(0,1fr) !important; box-sizing: border-box !important; }
    #modal .testSettingsModalCard.dragging { cursor: grabbing !important; }
    #modal .testSettingsModalHandle { cursor: grab !important; min-height: 58px !important; padding: 10px 12px 10px 16px !important; display: grid !important; grid-template-columns: minmax(0,1fr) 40px !important; gap: 12px !important; align-items: center !important; background: #151b22 !important; border-bottom: 1px solid rgba(255,255,255,.09) !important; }
    #modal .testSettingsModalHandle h2 { margin: 0 !important; white-space: nowrap !important; overflow: hidden !important; text-overflow: ellipsis !important; }
    #modal .testSettingsModalBody { overflow-y: auto !important; overflow-x: hidden !important; -webkit-overflow-scrolling: touch !important; padding: 14px !important; }
    #modal .testSettingsPanel { display: grid !important; box-shadow: none !important; border: 0 !important; background: transparent !important; padding: 0 !important; }
    #modal .testPermissionGroupCard summary b { font-size: 0 !important; width: 32px !important; height: 32px !important; display: grid !important; place-items: center !important; color: #d0ad58 !important; }
    #modal .testPermissionGroupCard summary b::before { content: '' !important; width: 11px !important; height: 11px !important; border-right: 4px solid currentColor !important; border-bottom: 4px solid currentColor !important; transform: rotate(45deg) !important; transition: transform .16s ease !important; }
    #modal .testPermissionGroupCard[open] summary b::before { transform: rotate(225deg) !important; }
    #modal .testFormGrid label, #modal .testPermissionGroupForm label { padding-left: 4px !important; padding-right: 4px !important; box-sizing: border-box !important; }
    #modal .testFormGrid input, #modal .testFormGrid textarea, #modal .testFormGrid select, #modal .testPermissionGroupForm textarea, #modal .testPermissionGroupForm input, #modal .testPermissionGroupForm select { font-size: 16px !important; }
    #modal .testPermissionSummary span, #modal .testInfoGrid span { background: rgba(255,255,255,.045) !important; border: 1px solid rgba(255,255,255,.09) !important; color: #fff8ea !important; pointer-events: none !important; text-align: center !important; }
    #modal .testInfoBox { display: none !important; }
    #modal .testGroupQuickSelect { display: grid !important; gap: 8px !important; margin: 8px 0 !important; padding: 10px !important; border-radius: 14px !important; background: rgba(255,255,255,.045) !important; border: 1px solid rgba(255,255,255,.08) !important; }
    #modal .testMiniCheck { display: grid !important; grid-template-columns: 22px minmax(0,1fr) !important; gap: 8px !important; align-items: center !important; color: #fff8ea !important; font-weight: 850 !important; }
    #modal .testWorkAreaPicker { display: grid !important; gap: 5px !important; color: #d0ad58 !important; font-size: 12px !important; font-weight: 900 !important; }
    #modal .testAreaRow { grid-template-columns: 32px minmax(0,1fr) auto !important; }
    #modal .testDragHandle { color: #d0ad58 !important; font-weight: 950 !important; cursor: grab !important; text-align: center !important; }
    #modal .testAreaRow.dragging { opacity: .55 !important; }
    #modal.homeActionModalOpen .homeModalListButton { white-space: normal !important; height: auto !important; min-height: 74px !important; align-items: start !important; }
    #modal.homeActionModalOpen .homeModalListButton span, #modal.homeActionModalOpen .homeModalListButton small { white-space: normal !important; overflow: visible !important; text-overflow: clip !important; line-height: 1.25 !important; display: block !important; }
    @media(max-width:430px){ #modal.testSettingsModalOpen { inset: calc(var(--fixed-topbar-height,112px) + var(--fixed-mainnav-height,80px)) 0 0 0 !important; padding: 10px !important; } #modal .testSettingsModalCard { width: 100% !important; } }
  `;
  document.head.appendChild(style);

  installClickInterceptors();
  const observer = new MutationObserver(() => {
    removeNoUpcomingFullStop();
    steadyNotificationDots();
    if(modalRoot && modalRoot.classList.contains('testSettingsModalOpen')) enhanceModalContents();
  });
  if(document.body) observer.observe(document.body, { childList:true, subtree:true, characterData:true });
  removeNoUpcomingFullStop();
  steadyNotificationDots();
})();