// Restores Checks page interaction with simple native expanders and existing completion modal.
(function checksLiveFix(){
  if (window.__checksLiveFix) return;
  window.__checksLiveFix = true;

  function safeEsc(value) {
    try { return esc(value); }
    catch (_) { return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  }

  function todaySafe() {
    try { return today(); }
    catch (_) { return new Date().toISOString().slice(0, 10); }
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

  function checkButton(check) {
    return '<button type="button" class="primary checkDueButton" data-complete="' + safeEsc(check.id) + '">' +
      '<span><strong>' + safeEsc(check.title) + '</strong><small>' + safeEsc(check.freq || '') + ' · Due ' + safeEsc(check.due || '') + '</small></span>' +
      '<b>Open</b>' +
    '</button>';
  }

  window.checks = checks = function checksFixedPage() {
    var list = pendingChecks();
    var groups = groupByArea(list);
    var areas = Object.keys(groups).sort();
    var doneCount = (state.done || []).filter(function(record){ return record.date === todaySafe(); }).length;

    return '<section class="card checksPage">' +
      '<h2>Checks to complete</h2>' +
      '<p class="muted">Tap an area to show its checks, then tap a check to complete it.</p>' +
      (areas.length ? areas.map(function(area){
        return '<details class="checkAreaDetails" open>' +
          '<summary><span><strong>' + safeEsc(area) + '</strong><small>' + groups[area].length + ' checks to complete</small></span></summary>' +
          '<div class="checkAreaBody">' + groups[area].map(checkButton).join('') + '</div>' +
        '</details>';
      }).join('') : '<div class="emptyState">No checks currently due.</div>') +
    '</section>' +
    '<section class="card"><h2>Completed today</h2><p class="muted">' + doneCount + ' checks completed today.</p>' + history() + '</section>';
  };

  function bindFixedChecks() {
    document.querySelectorAll('.checksPage [data-complete]').forEach(function(btn){
      btn.onclick = function(event) {
        event.preventDefault();
        event.stopPropagation();
        if (typeof openCheck === 'function') openCheck(btn.getAttribute('data-complete'));
      };
    });
  }

  if (typeof bind === 'function' && !bind.__checksLiveFix) {
    var oldBind = bind;
    bind = function bindWithChecksLiveFix() {
      oldBind();
      bindFixedChecks();
    };
    bind.__checksLiveFix = true;
  }

  document.addEventListener('click', function(){ setTimeout(bindFixedChecks, 0); }, true);
  if (typeof render === 'function') setTimeout(function(){ render(); }, 0);
})();
