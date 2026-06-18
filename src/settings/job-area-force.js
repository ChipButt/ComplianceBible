// Force the app to use the correct staff job-area groups and linked required-doc buttons.
(function jobAreaForcePatch() {
  if (window.__jobAreaForcePatchV1) return;
  window.__jobAreaForcePatchV1 = true;

  const GROUP_KEY = 'complianceStaffDocumentGroupsV1';
  const REQ_KEY = 'complianceUserDocumentRequirementsV1';
  const CLEAN_FLAG = 'complianceStaffDocGroupsCleanedToSevenV1';
  const CORE_AREAS = [
    { id: 'Office', label: 'Office' },
    { id: 'FOH', label: 'FOH' },
    { id: 'Kitchen', label: 'Kitchen' },
    { id: 'KP', label: 'KP' },
    { id: 'Housekeeping', label: 'Housekeeping' },
    { id: 'WFH', label: 'WFH' },
    { id: 'Hybrid', label: 'Hybrid' }
  ];

  function h(value) {
    try { return esc(value); } catch (_) {
      return String(value == null ? '' : value).replace(/[&<>"']/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;', "'":'&#39;' }[c]));
    }
  }
  function normalise(value) { return String(value || '').trim().toLowerCase(); }
  function readJSON(key, fallback) { try { return JSON.parse(localStorage.getItem(key) || 'null') || fallback; } catch (_) { return fallback; } }
  function writeJSON(key, value) { try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {} }
  function stableReqId(title) { return 'req_' + String(title || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, ''); }
  function saveSafe() { try { save(); } catch (_) {} }
  function isCoreArea(value) { return CORE_AREAS.some(area => normalise(area.id) === normalise(value) || normalise(area.label) === normalise(value)); }

  function correctGroups() {
    const wasCleaned = localStorage.getItem(CLEAN_FLAG) === 'true';
    const saved = readJSON(GROUP_KEY, []);
    const map = new Map(CORE_AREAS.map(area => [normalise(area.id), { ...area }]));

    if (wasCleaned && Array.isArray(saved)) {
      saved.forEach(group => {
        if (!group || !group.id) return;
        if (!map.has(normalise(group.id))) map.set(normalise(group.id), { id: group.id, label: group.label || group.id });
      });
    }

    const groups = Array.from(map.values());
    writeJSON(GROUP_KEY, groups);
    localStorage.setItem(CLEAN_FLAG, 'true');
    return groups;
  }

  function correctAreasState() {
    const groups = correctGroups();
    const nextAreas = groups.map(group => group.id);
    const current = Array.isArray(state.areas) ? state.areas : [];
    if (JSON.stringify(current) !== JSON.stringify(nextAreas)) {
      state.areas = nextAreas;
      saveSafe();
    }
  }

  function defaultRequirements() {
    const all = CORE_AREAS.map(area => area.id);
    const kitchen = ['Kitchen', 'KP'];
    return [
      ['New Starter Pay Information', all, 'none'],
      ['New Starter Medical Questionnaire', all, 'none'],
      ['Piston Club Handbook Declaration', all, 'none'],
      ['Fire Safety & Training', all, 'none'],
      ['Food Allergy and Intolerance', all, 'none'],
      ['Safer Food Better Business Health & Safety Awareness', all, 'none'],
      ['Signed Contract', all, 'none'],
      ['Working Hours Opt Out', all, 'none'],
      ['Kitchen Oil & Fryer Training', kitchen, 'none'],
      ['Food Safety & Hygiene Level 2', kitchen, 'optional'],
      ['Challenge 25 Training', [], 'none'],
      ['COSHH Awareness', [], 'none'],
      ['Fire Marshal', [], 'optional'],
      ['Food Safety & Hygiene Level 3', [], 'optional'],
      ['HACCP', [], 'optional'],
      ['First Aid', [], 'optional'],
      ['Cellar Management', [], 'none']
    ].map(([title, staffGroups, expiryMode]) => ({ id: stableReqId(title), title, staffGroups, expiryMode }));
  }

  function correctRequirements() {
    const saved = readJSON(REQ_KEY, []);
    const defaults = defaultRequirements();
    const byTitle = new Map(defaults.map(req => [normalise(req.title), req]));
    if (Array.isArray(saved)) {
      saved.forEach(req => {
        if (!req || !req.title) return;
        const key = normalise(req.title);
        const base = byTitle.get(key) || { id: req.id || stableReqId(req.title), title: req.title, staffGroups: [], expiryMode: req.expiryMode || 'optional' };
        byTitle.set(key, { ...base, id: req.id || base.id, title: base.title || req.title, staffGroups: (req.staffGroups || base.staffGroups || []).filter(group => isCoreArea(group)), expiryMode: req.expiryMode || base.expiryMode || 'optional' });
      });
    }
    defaults.forEach(req => {
      const existing = byTitle.get(normalise(req.title));
      if (!existing || !existing.staffGroups.length && req.staffGroups.length) byTitle.set(normalise(req.title), req);
    });
    const reqs = Array.from(byTitle.values());
    writeJSON(REQ_KEY, reqs);
    return reqs;
  }

  function applies(req, groupId) {
    return (req.staffGroups || []).some(group => normalise(group) === normalise(groupId));
  }

  function staffDocSettingsMarkup() {
    const groups = correctGroups();
    const reqs = correctRequirements();
    return '<section class="settingsBlock staffDocSettingsBlock"><h2>Required staff documents</h2><p class="muted">Choose the documents required for each job area. These feed the Staff Documents list and user profile Training tab.</p><div class="permissionGroupList staffDocGroupList">' +
      groups.map(group => {
        const count = reqs.filter(req => applies(req, group.id)).length;
        return '<article class="permissionGroupCard staffDocGroupCard"><button type="button" class="fdocBar permissionGroupButton" data-staff-doc-area="' + h(group.id) + '"><span class="fdocIcon">□</span><span class="fdocName"><strong>' + h(group.label) + '</strong><em>' + count + ' required documents</em></span><span class="fdocArrow">⌄</span></button><div class="permissionGroupPanel closed"><form class="staffDocAreaForm" data-staff-doc-area-form="' + h(group.id) + '"><div class="permissionTickList staffDocRequirementTickList"><h3>Required documents</h3>' + reqs.map(req => '<label class="settingsTick permissionTick staffDocRequirementTick"><input type="checkbox" name="req__' + h(req.id) + '" ' + (applies(req, group.id) ? 'checked' : '') + '><span>' + h(req.title) + '</span></label>').join('') + '</div><div class="permissionActions"><button type="button" class="secondary" data-delete-staff-doc-area="' + h(group.id) + '">Delete group</button><button class="primary">Save group</button></div></form></div></article>';
      }).join('') +
      '<article class="permissionGroupCard createStaffDocGroupCard"><button type="button" class="fdocBar permissionGroupButton" data-create-staff-doc-area-open><span class="fdocIcon">+</span><span class="fdocName"><strong>Create new job area</strong><em>Add another staff group</em></span><span class="fdocArrow">⌄</span></button><div class="permissionGroupPanel closed"><form id="createStaffDocAreaForm" class="permissionGroupForm"><label class="settingsField"><span>Job area name</span><input name="title" placeholder="e.g. Cellar" required></label><button class="primary">Create group</button></form></div></article>' +
      '</div></section>';
  }

  function installSettingsOverride() {
    if (typeof window.settings !== 'function') return;
    const oldSettings = window.settings;
    window.settings = function forcedJobAreaSettings() {
      correctAreasState();
      const html = oldSettings();
      const start = html.indexOf('<section class="settingsBlock staffDocSettingsBlock">');
      if (start === -1) return html + staffDocSettingsMarkup();
      const end = html.indexOf('</section>', start);
      if (end === -1) return html;
      return html.slice(0, start) + staffDocSettingsMarkup() + html.slice(end + 10);
    };
  }

  function bindJobAreaControls() {
    document.querySelectorAll('[data-staff-doc-area]').forEach(button => {
      button.onclick = event => {
        event.preventDefault();
        const card = button.closest('.permissionGroupCard');
        const panel = card && card.querySelector('.permissionGroupPanel');
        const open = !(card && card.classList.contains('open'));
        if (card) card.classList.toggle('open', open);
        if (panel) panel.classList.toggle('closed', !open);
      };
    });
    document.querySelectorAll('[data-staff-doc-area-form]').forEach(form => {
      form.onsubmit = event => {
        event.preventDefault();
        const area = form.dataset.staffDocAreaForm;
        const reqs = correctRequirements();
        reqs.forEach(req => {
          req.staffGroups = (req.staffGroups || []).filter(group => normalise(group) !== normalise(area));
          if (form.elements['req__' + req.id] && form.elements['req__' + req.id].checked) req.staffGroups.push(area);
        });
        writeJSON(REQ_KEY, reqs);
        saveSafe();
        render();
      };
    });
    document.querySelectorAll('[data-delete-staff-doc-area]').forEach(button => {
      button.onclick = event => {
        event.preventDefault();
        event.stopPropagation();
        const area = button.dataset.deleteStaffDocArea;
        const groups = correctGroups().filter(group => normalise(group.id) !== normalise(area));
        writeJSON(GROUP_KEY, groups);
        state.areas = groups.map(group => group.id);
        const reqs = correctRequirements().map(req => ({ ...req, staffGroups: (req.staffGroups || []).filter(group => normalise(group) !== normalise(area)) }));
        writeJSON(REQ_KEY, reqs);
        saveSafe();
        render();
      };
    });
    document.querySelectorAll('[data-create-staff-doc-area-open]').forEach(button => {
      button.onclick = event => {
        event.preventDefault();
        const card = button.closest('.permissionGroupCard');
        const panel = card && card.querySelector('.permissionGroupPanel');
        const open = !(card && card.classList.contains('open'));
        if (card) card.classList.toggle('open', open);
        if (panel) panel.classList.toggle('closed', !open);
      };
    });
    const createForm = document.getElementById('createStaffDocAreaForm');
    if (createForm) {
      createForm.onsubmit = event => {
        event.preventDefault();
        const title = String(createForm.elements.title.value || '').trim();
        if (!title) return;
        const groups = correctGroups();
        if (!groups.some(group => normalise(group.id) === normalise(title))) groups.push({ id: title, label: title });
        writeJSON(GROUP_KEY, groups);
        state.areas = groups.map(group => group.id);
        saveSafe();
        render();
      };
    }
  }

  function forceJobAreaSelects() {
    correctAreasState();
    const valid = correctGroups().map(group => group.id);
    document.querySelectorAll('select[name="area"]').forEach(select => {
      const current = select.value;
      select.innerHTML = valid.map(area => '<option value="' + h(area) + '" ' + (normalise(area) === normalise(current) ? 'selected' : '') + '>' + h(area) + '</option>').join('');
    });
  }

  const style = document.createElement('style');
  style.textContent = '.staffDocGroupList .permissionGroupCard{padding:0!important}.staffDocRequirementTickList{display:grid!important;grid-template-columns:1fr!important;gap:6px!important}.staffDocGroupCard .permissionActions{display:grid!important;grid-template-columns:1fr 1fr!important;gap:8px!important}.staffDocGroupCard [data-delete-staff-doc-area]{color:#d83b2d!important}.settingsPillList{display:flex!important;flex-wrap:wrap!important;gap:6px!important}.settingsPill{display:inline-flex!important;align-items:center!important;gap:6px!important;min-height:30px!important;padding:4px 8px!important;border-radius:999px!important;background:rgba(255,255,255,.055)!important;border:1px solid rgba(255,255,255,.09)!important;color:#fff8ea!important;font-size:12px!important;font-weight:800!important}.settingsCompactForm{display:grid!important;grid-template-columns:minmax(0,1fr) 70px!important;gap:8px!important}.settingsCompactForm input,.settingsCompactForm button{min-height:38px!important;height:38px!important}.profileTrainingDocSection .fdocIcon,.profileTrainingDocSection .fdocIcon svg{width:28px!important;height:28px!important;min-width:28px!important;max-width:28px!important}.profileTrainingDocSection .fdocBar{min-height:64px!important;height:auto!important;padding:10px 12px!important}.profileTrainingDocSection .fdoc{border-radius:18px!important;overflow:hidden!important}.profileTrainingDocSection .fdocName strong{font-size:15px!important;line-height:1.15!important}.profileTrainingDocSection .fdocName em{font-size:11px!important}.profileTrainingDocSection .fdocThumb{width:74px!important;height:74px!important;min-width:74px!important;max-width:74px!important}.profileTrainingDocSection .fdocPanel{overflow:hidden!important}';
  document.head.appendChild(style);

  correctAreasState();
  correctRequirements();
  installSettingsOverride();

  if (typeof bind === 'function' && !bind.__jobAreaForcePatchV1) {
    const oldBind = bind;
    bind = function bindWithJobAreaForce() {
      oldBind();
      bindJobAreaControls();
      forceJobAreaSelects();
    };
    bind.__jobAreaForcePatchV1 = true;
  }
})();