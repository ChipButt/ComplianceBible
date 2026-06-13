// Restores Checks page interaction using document-style expandable rows.
(function checksLiveFix(){
  if (window.__checksLiveFixV2) return;
  window.__checksLiveFixV2 = true;

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

  function isDoneToday(checkId) {
    return (state.done || []).some(function(record){ return record.checkId === checkId && record.date === todaySafe(); });
  }

  function pendingChecks() {
    return (state.checks || []).filter(function(check){ return !isDoneToday(check.id); });
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
    var text = String((check.title || '') + ' ' + (check.items || []).join(' ')).toLowerCase();
    return /temp|temperature|fridge|freezer|hot held|cooked|reheated|cooling|delivery/.test(text);
  }

  function checkSummary(check) {
    var isTemp = isTemperatureCheck(check);
    return '<button type="button" class="fdocBar checkDocBar" data-toggle-check-row="' + safeEsc(check.id) + '">' +
      '<span class="fdocIcon">✓</span>' +
      '<span class="fdocName"><strong>' + safeEsc(check.title) + '</strong><em>' + safeEsc(check.freq || '') + ' · Due ' + safeEsc(check.due || '') + '</em></span>' +
      '<span class="fdocBadge ' + (isTemp ? 'warn' : 'danger') + '">' + (isTemp ? 'Temperature' : 'To do') + '</span>' +
      '<span class="fdocArrow">⌄</span>' +
    '</button>';
  }

  function checkPanel(check) {
    var isTemp = isTemperatureCheck(check);
    var items = check.items && check.items.length ? check.items : ['Complete this check'];
    return '<div class="fdocPanel checkDocPanel closed" data-check-panel="' + safeEsc(check.id) + '">' +
      '<form class="checkDocForm" data-save-check="' + safeEsc(check.id) + '">' +
        '<div class="checkDocItems">' + items.map(function(item, index){
          return '<label class="checkDocTick"><input type="checkbox" name="task_' + index + '" required><span>' + safeEsc(item) + '</span></label>';
        }).join('') + '</div>' +
        (isTemp ? '<div class="checkDocFieldRow"><label><span>Temperature</span><input name="temperature" inputmode="decimal" placeholder="e.g. 3°C" required></label><button type="submit" class="primary saveCheckInline">Save</button></div>' : '<div class="checkDocFieldRow"><label><span>Notes</span><input name="notes" placeholder="Optional note"></label><button type="submit" class="primary saveCheckInline">Save</button></div>') +
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

  function markCheckComplete(form, checkId) {
    var check = (state.checks || []).find(function(item){ return item.id === checkId; });
    if (!check) return;
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var formData = new FormData(form);
    var notes = String(formData.get('notes') || '').trim();
    var temperature = String(formData.get('temperature') || '').trim();
    var taskData = (check.items || ['Complete this check']).map(function(item, index){
      return { label: item, checked: !!formData.get('task_' + index) };
    });

    state.done = state.done || [];
    state.done.push({
      id: newId(),
      checkId: check.id,
      title: check.title,
      userId: currentUserId(),
      date: todaySafe(),
      at: new Date().toISOString(),
      result: 'Completed',
      notes: temperature ? ('Temperature: ' + temperature + (notes ? ' · ' + notes : '')) : notes,
      tasks: taskData,
      temperature: temperature
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

    document.querySelectorAll('[data-check-card]').forEach(function(card){
      var id = card.getAttribute('data-check-card');
      var panel = card.querySelector('[data-check-panel]');
      if (panel) panel.classList.toggle('closed', !openChecks[id]);
      card.classList.toggle('open', !!openChecks[id]);
    });
  }

  if (typeof bind === 'function' && !bind.__checksLiveFixV2) {
    var oldBind = bind;
    bind = function bindWithChecksLiveFix() {
      oldBind();
      bindFixedChecks();
    };
    bind.__checksLiveFixV2 = true;
  }

  document.addEventListener('click', function(){ setTimeout(bindFixedChecks, 0); }, true);
  if (typeof render === 'function') setTimeout(function(){ render(); }, 0);
})();
