(function installCoreCheckGroups(){
  if (window.__coreCheckGroupsV5) return;
  window.__coreCheckGroupsV5 = true;

  var openAreas = {};
  var openChecks = {};

  var icon = {
    check: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20 6L9 17l-5-5"/></svg>',
    camera: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h4l2-3h4l2 3h4v11H4z"/><circle cx="12" cy="13" r="4"/></svg>',
    temp: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M10 4a2 2 0 0 1 4 0v9a5 5 0 1 1-4 0z"/><path d="M12 7v8"/></svg>',
    group: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 5h16v4H4zM4 10h16v4H4zM4 15h16v4H4z"/></svg>'
  };

  function escx(value) {
    try { return esc(value); }
    catch (_) { return String(value == null ? '' : value).replace(/[&<>"']/g, function(c){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  }

  function todaySafe() { try { return today(); } catch (_) { return new Date().toISOString().slice(0, 10); } }
  function uidSafe() { try { return uid(); } catch (_) { return 'id-' + Date.now().toString(36) + '-' + Math.random().toString(36).slice(2); } }
  function currentUserId() { return state.currentUser || 'unknown'; }
  function userName() { try { var u = me(); return u.nickname || u.name || 'Current user'; } catch (_) { return 'Current user'; } }
  function saveSafe() { try { save(); } catch (_) {} }

  function defaultTemperatureUnits() { return ['Kitchen Fridge 1', 'Kitchen Fridge 2', 'Kitchen Freezer', 'Bar Bottle Fridge', 'Cellar Fridge']; }
  function genericFridgeCheck(check) { var text = String((check.id || '') + ' ' + (check.title || '')).toLowerCase(); return !check.equipmentUnit && (/fridge.*freezer|freezer.*fridge|fridge-freezer/.test(text)); }

  function ensureEquipmentChecks() {
    state.temperatureUnits = Array.isArray(state.temperatureUnits) && state.temperatureUnits.length ? state.temperatureUnits : defaultTemperatureUnits();
    state.checks = state.checks || [];
    var generic = state.checks.find(genericFridgeCheck);
    var template = generic || { area: 'Kitchen', freq: 'Daily', due: '11:00' };

    state.temperatureUnits.forEach(function(unit) {
      var id = 'temp-' + unit.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
      if (!state.checks.some(function(check) { return check.id === id; })) {
        state.checks.push({ id: id, title: unit + ' Temperature Check', area: template.area || 'Kitchen', freq: template.freq || 'Daily', due: template.due || '11:00', equipmentUnit: unit, checkType: 'temperature', items: ['Temperature recorded', 'Photo evidence uploaded', 'Corrective action recorded if required'] });
      }
    });

    state.checks.forEach(function(check) { if (genericFridgeCheck(check)) check.hiddenFromChecksPage = true; });
    saveSafe();
  }

  function doneToday(checkId) { return (state.done || []).some(function(done) { return done.checkId === checkId && done.date === todaySafe(); }); }
  function isTempCheck(check) { var text = String((check.checkType || '') + ' ' + (check.title || '') + ' ' + (check.items || []).join(' ')).toLowerCase(); return /temp|temperature|fridge|freezer|hot held|cooked|reheated|cooling|delivery/.test(text); }
  function dueChecks() { ensureEquipmentChecks(); return (state.checks || []).filter(function(check) { return !check.hiddenFromChecksPage && !doneToday(check.id); }); }
  function grouped(list) { var groups = {}; list.forEach(function(check) { var area = check.area || 'General'; (groups[area] = groups[area] || []).push(check); }); return groups; }

  function readFile(file) {
    return new Promise(function(resolve) {
      if (!file) return resolve(null);
      var reader = new FileReader();
      reader.onload = function() { resolve({ fileName: file.name || 'Photo', fileType: file.type || '', fileSize: file.size || 0, fileData: reader.result || '', uploadedAt: new Date().toISOString() }); };
      reader.onerror = function() { resolve(null); };
      reader.readAsDataURL(file);
    });
  }

  function preprocessImage(file) {
    return new Promise(function(resolve) {
      if (!file) return resolve(null);
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function() {
        try {
          var maxW = 1200;
          var scale = Math.min(1, maxW / img.width);
          var w = Math.max(1, Math.round(img.width * scale));
          var h = Math.max(1, Math.round(img.height * scale));
          var canvas = document.createElement('canvas');
          canvas.width = w;
          canvas.height = h;
          var ctx = canvas.getContext('2d', { willReadFrequently: true });
          ctx.drawImage(img, 0, 0, w, h);
          var data = ctx.getImageData(0, 0, w, h);
          for (var i = 0; i < data.data.length; i += 4) {
            var r = data.data[i], g = data.data[i+1], b = data.data[i+2];
            var grey = (r * 0.299 + g * 0.587 + b * 0.114);
            var v = grey > 130 ? 255 : 0;
            data.data[i] = data.data[i+1] = data.data[i+2] = v;
          }
          ctx.putImageData(data, 0, 0);
          URL.revokeObjectURL(url);
          resolve(canvas.toDataURL('image/png'));
        } catch (_) {
          URL.revokeObjectURL(url);
          resolve(file);
        }
      };
      img.onerror = function() { URL.revokeObjectURL(url); resolve(file); };
      img.src = url;
    });
  }

  function extractTemp(text) {
    var cleaned = String(text || '').replace(/[Oo]/g, '0').replace(/[lI|]/g, '1');
    var match = cleaned.match(/-?\d+(?:[\.,]\d+)?/);
    return match ? match[0].replace(',', '.') : '';
  }

  function maybeReadTemperature(file, input, status) {
    if (!file || !input) return;
    var fromName = extractTemp(file.name || '');
    if (fromName && !input.value) input.value = fromName;
    if (!window.Tesseract || input.value) {
      if (status) status.textContent = 'Image uploaded. Check the temperature before saving.';
      return;
    }
    if (status) status.textContent = 'Analysing image...';
    preprocessImage(file).then(function(imageForOcr) {
      return window.Tesseract.recognize(imageForOcr || file, 'eng', { tessedit_char_whitelist: '0123456789.-,', tessedit_pageseg_mode: '7' });
    }).then(function(result) {
      var found = extractTemp(result && result.data && result.data.text);
      if (found && !input.value) input.value = found;
      if (status) status.textContent = found ? 'Image uploaded. Temperature auto-filled — check it before saving.' : 'Image uploaded. Could not read temperature — type it manually before saving.';
    }).catch(function() { if (status) status.textContent = 'Image uploaded. Could not read temperature — type it manually before saving.'; });
  }

  function thumb(checkId) { return '<div class="fdocThumb empty checkPhotoThumb" data-check-thumb="' + escx(checkId) + '">No photo</div>'; }
  function photoPreviewHtml(dataUrl) { return '<img src="' + dataUrl + '" alt="Temperature evidence"><button type="button" class="checkPhotoRemove" data-remove-check-photo="true" aria-label="Remove image">×</button>'; }

  function tempPanel(check) {
    return '<p class="fdocInstruction">Take a clear photo of this unit’s temperature display, confirm the reading, then save.</p>' +
      '<div class="fdocBody checkTempBody">' + thumb(check.id) +
        '<div class="fdocControls">' +
          '<div class="fdocUploads checkPhotoUpload singleUpload">' +
            '<label>' + icon.camera + '<span>Take Photo</span><input type="file" name="photo" accept="image/*" capture="environment" required></label>' +
          '</div>' +
          '<div class="fdocMeta checkTempMeta">' +
            '<label class="fdocExpiry checkTempInput"><span class="fdocDateInputWrap"><span class="tempEntryWrap"><input name="temperature" inputmode="decimal" placeholder="Temp" required><span class="tempUnit">°C</span></span></span></label>' +
            '<button type="submit" class="fdocExpiry checkSaveButton"><span class="fdocExpiryText">Save</span></button>' +
          '</div>' +
        '</div>' +
      '</div>' +
      '<label class="actionRequiredInline"><input type="checkbox" name="actionRequired"><span>Corrective action required</span></label>' +
      '<div class="correctiveActionBox"><label><span>Corrective action taken</span><textarea name="correctiveAction" placeholder="Example: moved food to another fridge and reported unit for repair"></textarea></label></div>' +
      '<small class="tempReadStatus" aria-live="polite"></small>';
  }

  function generalPanel(check) {
    var items = check.items && check.items.length ? check.items : ['Completed'];
    return '<div class="checkDocItems">' + items.map(function(item, index) { return '<label class="checkDocTick"><input type="checkbox" name="task_' + index + '" required><span>' + escx(item) + '</span></label>'; }).join('') + '</div>' +
    '<label class="actionRequiredInline"><input type="checkbox" name="actionRequired"><span>Corrective action required</span></label>' +
    '<div class="correctiveActionBox"><label><span>Corrective action taken</span><textarea name="correctiveAction" placeholder="Write what was wrong and what was done to fix it"></textarea></label></div>' +
    '<div class="checkSaveRow"><label><span>Notes</span><input name="notes" placeholder="Optional note"></label><button class="primary checkSavePrimary" type="submit">Save</button></div>';
  }

  function checkCard(check) {
    var open = !!openChecks[check.id];
    var subtitle = (check.equipmentUnit ? check.equipmentUnit + ' · ' : '') + (check.freq || '') + ' · Due ' + (check.due || '');
    return '<article class="fdoc areaCheckCard ' + (open ? 'open' : '') + '" data-area-check="' + escx(check.id) + '">' +
      '<button type="button" class="fdocBar areaCheckToggle" data-toggle-check="' + escx(check.id) + '" aria-expanded="' + (open ? 'true' : 'false') + '">' +
        '<span class="fdocIcon">' + icon.check + '</span>' +
        '<span class="fdocName"><strong>' + escx(check.title) + '</strong><em>' + escx(subtitle) + '</em></span>' +
        '<span class="fdocArrow">⌄</span>' +
      '</button>' +
      '<div class="fdocPanel ' + (open ? '' : 'closed') + '"><form class="areaCheckForm" data-check-form="' + escx(check.id) + '">' + (isTempCheck(check) ? tempPanel(check) : generalPanel(check)) + '</form></div>' +
    '</article>';
  }

  checks = window.checks = function checksPage() {
    var list = dueChecks();
    var groups = grouped(list);
    var keys = Object.keys(groups).sort();
    var doneCount = (state.done || []).filter(function(done) { return done.date === todaySafe(); }).length;
    return '<section class="card checksPage"><h2>Checks to complete</h2><p class="muted">Open an area, complete the check, then save. Completed checks disappear until due again.</p><section class="areaGroupList">' +
      (keys.length ? keys.map(function(area) {
        var open = openAreas[area] !== false;
        return '<section class="areaGroup ' + (open ? 'open' : '') + '" data-area-group="' + escx(area) + '">' +
          '<button type="button" class="fdocBar areaGroupButton" data-toggle-area="' + escx(area) + '" aria-expanded="' + (open ? 'true' : 'false') + '">' +
            '<span class="fdocIcon">' + icon.group + '</span><span class="fdocName"><strong>' + escx(area) + '</strong><em>' + groups[area].length + ' checks to complete</em></span><span class="fdocArrow">⌄</span>' +
          '</button>' +
          '<div class="areaGroupBody ' + (open ? '' : 'closed') + '">' + groups[area].map(checkCard).join('') + '</div>' +
        '</section>';
      }).join('') : '<div class="emptyState">No checks currently due.</div>') +
      '</section></section><section class="card"><h2>Completed today</h2><p class="muted">' + doneCount + ' checks completed today.</p>' + history() + '</section>';
  };

  function completeForm(form) {
    if (!form.checkValidity()) { form.reportValidity(); return; }
    var checkId = form.getAttribute('data-check-form');
    var check = (state.checks || []).find(function(item) { return item.id === checkId; });
    if (!check) return;
    var data = new FormData(form);
    var actionRequired = !!data.get('actionRequired');
    var correctiveAction = String(data.get('correctiveAction') || '').trim();
    if (actionRequired && !correctiveAction) { alert('Please record the corrective action taken.'); return; }
    var temp = String(data.get('temperature') || '').trim();
    var tasks = (check.items && check.items.length ? check.items : ['Completed']).map(function(label, index) { return { label: label, checked: !!data.get('task_' + index) }; });
    var photoInput = form.querySelector('input[name="photo"]');
    readFile(photoInput && photoInput.files && photoInput.files[0]).then(function(photoData) {
      state.done = state.done || [];
      state.done.push({ id: uidSafe(), checkId: check.id, title: check.title, area: check.area || '', equipmentUnit: check.equipmentUnit || '', userId: currentUserId(), userName: userName(), date: todaySafe(), at: new Date().toISOString(), result: 'Completed', temperature: temp, notes: String(data.get('notes') || '').trim(), actionRequired: actionRequired, correctiveAction: correctiveAction, evidence: photoData ? [photoData] : [], tasks: tasks });
      saveSafe();
      openChecks[checkId] = false;
      render();
    });
  }

  function removePhotoFromForm(form) {
    if (!form) return;
    if (!confirm('Remove image?')) return;
    var photo = form.querySelector('input[name="photo"]');
    var thumbEl = form.querySelector('.checkPhotoThumb');
    var status = form.querySelector('.tempReadStatus');
    if (photo) photo.value = '';
    if (thumbEl) { thumbEl.classList.add('empty'); thumbEl.innerHTML = 'No photo'; }
    if (status) status.textContent = '';
  }

  function handlePhotoSelected(form, file) {
    var thumbEl = form && form.querySelector('.checkPhotoThumb');
    var tempInput = form && form.querySelector('input[name="temperature"]');
    var status = form && form.querySelector('.tempReadStatus');
    if (!file || !thumbEl) return;
    if (status) status.textContent = 'Uploading image...';
    readFile(file).then(function(data) {
      if (data && data.fileData) {
        thumbEl.classList.remove('empty');
        thumbEl.innerHTML = photoPreviewHtml(data.fileData);
        if (status) status.textContent = 'Image uploaded. Analysing image...';
      }
    });
    maybeReadTemperature(file, tempInput, status);
  }

  function bindAreaGroups() {
    document.querySelectorAll('[data-toggle-area]').forEach(function(btn) { btn.onclick = function(event) { event.preventDefault(); var area = btn.getAttribute('data-toggle-area'); openAreas[area] = !(openAreas[area] !== false); render(); }; });
    document.querySelectorAll('[data-toggle-check]').forEach(function(btn) { btn.onclick = function(event) { event.preventDefault(); var id = btn.getAttribute('data-toggle-check'); openChecks[id] = !openChecks[id]; render(); }; });
    document.querySelectorAll('[name="actionRequired"]').forEach(function(input) { var form = input.closest('form'); var box = form && form.querySelector('.correctiveActionBox'); var textarea = box && box.querySelector('textarea'); function sync() { if (!box) return; box.classList.toggle('open', input.checked); if (textarea) textarea.required = input.checked; } input.onchange = sync; sync(); });
    document.querySelectorAll('.areaCheckForm').forEach(function(form) { var photo = form.querySelector('input[name="photo"]'); if (photo) photo.onchange = function() { handlePhotoSelected(form, photo.files && photo.files[0]); }; form.onsubmit = function(event) { event.preventDefault(); completeForm(form); }; });
  }

  document.addEventListener('click', function(event) {
    var removeBtn = event.target.closest && event.target.closest('[data-remove-check-photo]');
    if (removeBtn && removeBtn.closest('.checksPage')) { event.preventDefault(); event.stopPropagation(); removePhotoFromForm(removeBtn.closest('form')); return; }
    var areaBtn = event.target.closest && event.target.closest('[data-toggle-area]');
    if (areaBtn && areaBtn.closest('.checksPage')) { event.preventDefault(); event.stopPropagation(); var area = areaBtn.getAttribute('data-toggle-area'); openAreas[area] = !(openAreas[area] !== false); render(); return; }
    var checkBtn = event.target.closest && event.target.closest('[data-toggle-check]');
    if (checkBtn && checkBtn.closest('.checksPage')) { event.preventDefault(); event.stopPropagation(); var id = checkBtn.getAttribute('data-toggle-check'); openChecks[id] = !openChecks[id]; render(); }
  }, true);

  document.addEventListener('change', function(event) {
    var action = event.target.closest && event.target.closest('.checksPage input[name="actionRequired"]');
    if (action) { var form = action.closest('form'); var box = form && form.querySelector('.correctiveActionBox'); var textarea = box && box.querySelector('textarea'); if (box) box.classList.toggle('open', action.checked); if (textarea) textarea.required = action.checked; return; }
    var photo = event.target.closest && event.target.closest('.checksPage input[name="photo"]');
    if (photo) { handlePhotoSelected(photo.closest('form'), photo.files && photo.files[0]); }
  }, true);

  document.addEventListener('submit', function(event) {
    var form = event.target.closest && event.target.closest('.checksPage .areaCheckForm');
    if (form) { event.preventDefault(); event.stopPropagation(); completeForm(form); }
  }, true);

  if (typeof bind === 'function' && !bind.__coreCheckGroupsV5) { var oldBind = bind; bind = function bindWithCoreCheckGroups() { oldBind(); bindAreaGroups(); }; bind.__coreCheckGroupsV5 = true; }
  window.openCheck = function(id) { openChecks[id] = true; render(); };
  if (typeof render === 'function') setTimeout(function(){ render(); }, 0);
})();