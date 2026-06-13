// Restores Checks page interaction using document-style expandable rows.
(function checksLiveFix(){
  if (window.__checksLiveFixV3) return;
  window.__checksLiveFixV3 = true;

  var openAreas = {};
  var openChecks = {};

  function safeEsc(value) {
    try { return esc(value); }
    catch (_) { return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  }

  function todaySafe() {
    try { return today(); }
    catch (_) { return new Date().toISOString().slice(0, 10); }
  }

  function newId() {
    try { return uid(); }
    catch (_) { return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2); }
  }

  function currentUserId() {
    return state.currentUser || 'unknown';
  }

  function ensureEquipmentChecks() {
    state.temperatureUnits = state.temperatureUnits || [
      'Kitchen Fridge 1',
      'Kitchen Fridge 2',
      'Kitchen Freezer',
      'Bar Bottle Fridge',
      'Cellar Fridge'
    ];

    var oldGeneric = (state.checks || []).find(function(check){ return check.id === 'fridge'; });
    var template = oldGeneric || {
      area: 'Kitchen',
      freq: 'Daily',
      due: '11:00',
      items: ['Temperature recorded', 'Photo evidence uploaded', 'Corrective action recorded if issues found']
    };

    state.checks = state.checks || [];
    state.temperatureUnits.forEach(function(unit, index){
      var id = 'temp-' + unit.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!state.checks.some(function(check){ return check.id === id; })) {
        state.checks.push({
          id: id,
          title: unit + ' Temperature Check',
          area: template.area || 'Kitchen',
          freq: template.freq || 'Daily',
          due: template.due || '11:00',
          equipmentUnit: unit,
          checkType: 'temperature',
          items: ['Temperature recorded', 'Photo or file evidence uploaded', 'Corrective action recorded if required']
        });
      }
    });

    if (oldGeneric) oldGeneric.hiddenFromChecksPage = true;
    try { save(); } catch (_) {}
  }

  function isDoneToday(checkId) {
    return (state.done || []).some(function(record){ return record.checkId === checkId && record.date === todaySafe(); });
  }

  function pendingChecks() {
    ensureEquipmentChecks();
    return (state.checks || []).filter(function(check){ return !check.hiddenFromChecksPage && !isDoneToday(check.id); });
  }

  function groupByArea(checks) {
    var groups = {};
    checks.forEach(function(check){
      var area = check.area || 'General';
      if (!groups[area]) groups[area] = [];
      groups[area].push(check);
    });
    return groups;
  }

  function isTemperatureCheck(check) {
    var text = String((check.checkType || '') + ' ' + (check.title || '') + ' ' + (check.items || []).join(' ')).toLowerCase();
    return /temp|temperature|fridge|freezer|hot held|cooked|reheated|cooling|delivery/.test(text);
  }

  function checkSummary(check) {
    var isTemp = isTemperatureCheck(check);
    var unit = check.equipmentUnit ? '<em>' + safeEsc(check.equipmentUnit) + ' · ' + safeEsc(check.freq || '') + ' · Due ' + safeEsc(check.due || '') + '</em>' : '<em>' + safeEsc(check.freq || '') + ' · Due ' + safeEsc(check.due || '') + '</em>';
    return '<button type="button" class="fdocBar checkDocBar" data-toggle-check-row="' + safeEsc(check.id) + '">' +
      '<span class="fdocIcon">✓</span>' +
      '<span class="fdocName"><strong>' + safeEsc(check.title) + '</strong>' + unit + '</span>' +
      '<span class="fdocBadge ' + (isTemp ? 'warn' : 'danger') + '">' + (isTemp ? 'Temperature' : 'To do') + '</span>' +
      '<span class="fdocArrow">⌄</span>' +
    '</button>';
  }

  function generalPanel(check) {
    var items = check.items && check.items.length ? check.items : ['Completed'];
    return '<div class="checkDocItems">' + items.map(function(item, index){
      return '<label class="checkDocTick"><input type="checkbox" name="task_' + index + '" required><span>' + safeEsc(item) + '</span></label>';
    }).join('') + '</div>' +
    '<label class="checkDocTick actionRequiredTick"><input type="checkbox" name="actionRequired"><span>Corrective action required</span></label>' +
    '<div class="correctiveActionBox"><label><span>Corrective action taken</span><textarea name="correctiveAction" placeholder="Write what was wrong and what was done to fix it"></textarea></label></div>' +
    '<div class="checkDocFieldRow"><label><span>Notes</span><input name="notes" placeholder="Optional note"></label><button type="submit" class="primary saveCheckInline">Save</button></div>';
  }

  function temperaturePanel(check) {
    return '<div class="tempEvidenceGrid">' +
      '<div class="tempEvidenceIcon">▣</div>' +
      '<div class="tempEvidenceControls">' +
        '<label class="fileButton"><span>Choose file</span><input type="file" name="evidenceFile" accept="image/*,.pdf,.png,.jpg,.jpeg"></label>' +
        '<label class="fileButton"><span>Take photo</span><input type="file" name="evidencePhoto" accept="image/*" capture="environment"></label>' +
      '</div>' +
    '</div>' +
    '<div class="checkDocFieldRow tempSaveRow">' +
      '<label><span>Temperature reading</span><input name="temperature" inputmode="decimal" placeholder="e.g. 3°C" required></label>' +
      '<button type="submit" class="primary saveCheckInline">Save</button>' +
    '</div>' +
    '<label class="checkDocTick actionRequiredTick"><input type="checkbox" name="actionRequired"><span>Corrective action required</span></label>' +
    '<div class="correctiveActionBox"><label><span>Corrective action taken</span><textarea name="correctiveAction" placeholder="Example: moved food to another fridge, reported unit for repair"></textarea></label></div>';
  }

  function checkPanel(check) {
    var isTemp = isTemperatureCheck(check);
    return '<div class="fdocPanel checkDocPanel closed" data-check-panel="' + safeEsc(check.id) + '">' +
      '<form class="checkDocForm" data-save-check="' + safeEsc(check.id) + '">' +
        (isTemp ? temperaturePanel(check) : generalPanel(check)) +
      '</form>' +
    '</div>';
  }

  function checkCard(check) {
    return '<article class="fdoc checkDocCard" data-check-card="' + safeEsc(check.id) + '">' + checkSummary(check) + checkPanel(check) + '</article>';
  }

  window.checks = checks = function checksFixedPage() {
    var list = pendingChecks();
    var groups = groupByArea(list);
    var areas = Object.keys(groups).sort();
    var doneCount = (state.done || []).filter(function(record){ return record.date === todaySafe(); }).length;

    return '<section class="card checksPage">' +
      '<h2>Checks to complete</h2>' +
      '<p class="muted">Tap an area, then tap a check to open its completion fields.</p>' +
      (areas.length ? areas.map(function(area){
        var areaOpen = openAreas[area] !== false;
        return '<section class="checkAreaGroup ' + (areaOpen ? 'open' : '') + '" data-check-area="' + safeEsc(area) + '">' +
          '<button type="button" class="fdocBar checkAreaBar" data-toggle-check-area="' + safeEsc(area) + '">' +
            '<span class="fdocIcon">▦</span>' +
            '<span class="fdocName"><strong>' + safeEsc(area) + '</strong><em>' + groups[area].length + ' checks to complete</em></span>' +
            '<span class="fdocArrow">⌄</span>' +
          '</button>' +
          '<div class="checkAreaBody ' + (areaOpen ? '' : 'closed') + '">' + groups[area].map(checkCard).join('') + '</div>' +
        '</section>';
      }).join('') : '<div class="emptyState">No checks currently due.</div>') +
    '</section>' +
    '<section class="card"><h2>Completed today</h2><p class="muted">' + doneCount + ' checks completed today.</p>' + history() + '</section>';
  };

  function readFileMeta(input) {
    var file = input && input.files && input.files[0];
    if (!file) return null;
    return { fileName: file.name || 'Evidence', fileType: file.type || '', fileSize: file.size || 0, uploadedAt: new Date().toISOString() };
  }

  function markCheckComplete(form, checkId) {
    var check = (state.checks || []).find(function(item){ return item.id === checkId; });
    if (!check) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var formData = new FormData(form);
    var actionRequired = !!formData.get('actionRequired');
    var correctiveAction = String(formData.get('correctiveAction') || '').trim();
    if (actionRequired && !correctiveAction) {
      alert('Please record the corrective action taken.');
      return;
    }
    var notes = String(formData.get('notes') || '').trim();
    var temperature = String(formData.get('temperature') || '').trim();
    var taskData = (check.items || ['Complete this check']).map(function(item, index){
      return { label: item, checked: !!formData.get('task_' + index) };
    });

    var evidence = [];
    var fileMeta = readFileMeta(form.querySelector('[name="evidenceFile"]'));
    var photoMeta = readFileMeta(form.querySelector('[name="evidencePhoto"]'));
    if (fileMeta) evidence.push(fileMeta);
    if (photoMeta) evidence.push(photoMeta);

    state.done = state.done || [];
    state.done.push({
      id: newId(),
      checkId: check.id,
      title: check.title,
      area: check.area || '',
      equipmentUnit: check.equipmentUnit || '',
      userId: currentUserId(),
      date: todaySafe(),
      at: new Date().toISOString(),
      result: 'Completed',
      notes: temperature ? ('Temperature: ' + temperature + (notes ? ' · ' + notes : '')) : notes,
      tasks: taskData,
      temperature: temperature,
      actionRequired: actionRequired,
      correctiveAction: correctiveAction,
      evidence: evidence
    });
    try { save(); } catch (_) {}
    openChecks[checkId] = false;
    render();
  }

  function bindFixedChecks() {
    document.querySelectorAll('[data-toggle-check-area]').forEach(function(btn){
      btn.onclick = function(event) {
        event.preventDefault();
        var area = btn.getAttribute('data-toggle-check-area');
        openAreas[area] = !(openAreas[area] !== false);
        render();
      };
    });

    document.querySelectorAll('[data-toggle-check-row]').forEach(function(btn){
      btn.onclick = function(event) {
        event.preventDefault();
        var id = btn.getAttribute('data-toggle-check-row');
        openChecks[id] = !openChecks[id];
        var card = btn.closest('[data-check-card]');
        if (!card) return;
        card.classList.toggle('open', !!openChecks[id]);
        var panel = card.querySelector('[data-check-panel]');
        if (panel) panel.classList.toggle('closed', !openChecks[id]);
      };
    });

    document.querySelectorAll('[data-save-check]').forEach(function(form){
      form.onsubmit = function(event) {
        event.preventDefault();
        markCheckComplete(form, form.getAttribute('data-save-check'));
      };
    });

    document.querySelectorAll('[name="actionRequired"]').forEach(function(input){
      var form = input.closest('form');
      var box = form && form.querySelector('.correctiveActionBox');
      var textarea = box && box.querySelector('textarea');
      function sync(){
        if (!box) return;
        box.classList.toggle('open', input.checked);
        if (textarea) textarea.required = input.checked;
      }
      input.onchange = sync;
      sync();
    });

    document.querySelectorAll('[data-check-card]').forEach(function(card){
      var id = card.getAttribute('data-check-card');
      var panel = card.querySelector('[data-check-panel]');
      if (panel) panel.classList.toggle('closed', !openChecks[id]);
      card.classList.toggle('open', !!openChecks[id]);
    });
  }

  if (typeof bind === 'function' && !bind.__checksLiveFixV3) {
    var oldBind = bind;
    bind = function bindWithChecksLiveFix() {
      oldBind();
      bindFixedChecks();
    };
    bind.__checksLiveFixV3 = true;
  }

  document.addEventListener('click', function(){ setTimeout(bindFixedChecks, 0); }, true);
  if (typeof render === 'function') setTimeout(function(){ render(); }, 0);
})();
