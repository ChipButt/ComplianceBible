// User profile employment availability editor.
(function profileAvailabilityEditorPatch() {
  if (window.__profileAvailabilityEditorPatchV1) return;
  window.__profileAvailabilityEditorPatchV1 = true;

  const DAYS = [
    ['mon', 'Monday'],
    ['tue', 'Tuesday'],
    ['wed', 'Wednesday'],
    ['thu', 'Thursday'],
    ['fri', 'Friday'],
    ['sat', 'Saturday'],
    ['sun', 'Sunday']
  ];

  function safe(value) {
    try { return esc(value); } catch (_) {
      return String(value == null ? '' : value).replace(/[&<>'"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[c]));
    }
  }

  function timeOptions(selected) {
    const out = [];
    for (let h = 0; h < 24; h += 1) {
      for (let m = 0; m < 60; m += 30) {
        const value = String(h).padStart(2, '0') + ':' + String(m).padStart(2, '0');
        out.push('<option value="' + value + '" ' + (value === selected ? 'selected' : '') + '>' + value + '</option>');
      }
    }
    return out.join('');
  }

  function migrateAvailability(user) {
    user.availability = user.availability || {};
    DAYS.forEach(([key]) => {
      const current = user.availability[key];
      if (typeof current === 'boolean') {
        user.availability[key] = { allDay: current, ranges: current ? [] : [] };
      } else if (!current || typeof current !== 'object' || Array.isArray(current)) {
        user.availability[key] = { allDay: false, ranges: [] };
      } else {
        current.allDay = !!current.allDay;
        current.ranges = Array.isArray(current.ranges) ? current.ranges : [];
      }
    });
    return user.availability;
  }

  function employmentType(user) {
    return user && user.employmentType === 'Contractor' ? 'Contractor' : 'Employee';
  }

  function shiftList(shifts) {
    const upcoming = (shifts || []).filter(s => !s.date || s.date >= today()).slice(0, 5);
    if (!upcoming.length) return '<p class="muted">No upcoming shifts.</p>';
    return upcoming.map(s => '<div class="listItem"><strong>' + safe(s.date || 'Upcoming shift') + '</strong><p>' + safe((s.start || '') + (s.end ? ' - ' + s.end : '')) + '</p><p class="muted">' + safe(s.section || '') + (s.notes ? ' · ' + safe(s.notes) : '') + '</p></div>').join('');
  }

  function rangeRow(userId, dayKey, range, index) {
    const start = range && range.start ? range.start : '09:00';
    const end = range && range.end ? range.end : '17:00';
    return '<div class="availabilityRange" data-availability-range="' + safe(userId + '|' + dayKey + '|' + index) + '">' +
      '<select data-availability-start>' + timeOptions(start) + '</select>' +
      '<select data-availability-end>' + timeOptions(end) + '</select>' +
      '<button type="button" class="availabilityRemove" data-availability-remove="' + safe(userId + '|' + dayKey + '|' + index) + '" aria-label="Remove time range">×</button>' +
    '</div>';
  }

  function availabilityEditor(user) {
    const availability = migrateAvailability(user);
    return '<div class="availabilityEditor" data-availability-user="' + safe(user.id) + '">' +
      DAYS.map(([key, label]) => {
        const day = availability[key] || { allDay: false, ranges: [] };
        const ranges = day.ranges && day.ranges.length ? day.ranges : [];
        return '<section class="availabilityDay" data-availability-day="' + safe(key) + '">' +
          '<h4>' + safe(label) + '</h4>' +
          '<label class="availabilityAllDay"><input type="checkbox" data-availability-allday="' + safe(user.id + '|' + key) + '" ' + (day.allDay ? 'checked' : '') + '> <span>All day</span></label>' +
          '<p class="availabilitySubhead">Specific times</p>' +
          '<div class="availabilityRanges">' + (ranges.length ? ranges.map((range, index) => rangeRow(user.id, key, range, index)).join('') : '<p class="muted availabilityNoRanges">No specific times</p>') + '</div>' +
          '<button type="button" class="availabilityAdd" data-availability-add="' + safe(user.id + '|' + key) + '">+</button>' +
        '</section>';
      }).join('') +
    '</div>';
  }

  function employmentDetail(user, shifts, availabilityText) {
    migrateAvailability(user);
    return '<h2>Employment</h2>' +
      '<div class="listItem"><p>Employment type: ' + safe(employmentType(user)) + '</p><p>Job area: ' + safe(user.jobArea || user.area || '') + '</p><p>Role: ' + safe(user.role || '') + '</p><p>Permission set: ' + safe(user.permissionSetId || '') + '</p><p>Pay rate: £' + Number(user.wage || 0).toFixed(2) + '</p><p>Account status: ' + safe(user.accountStatus || '') + '</p></div>' +
      '<h3>Upcoming shifts</h3>' + shiftList(shifts) +
      '<h3>Availability</h3>' + availabilityEditor(user);
  }

  if (typeof centralProfileDetail === 'function' && !centralProfileDetail.__availabilityEditorWrapped) {
    const previousCentralProfileDetail = centralProfileDetail;
    centralProfileDetail = function centralProfileDetailWithAvailabilityEditor(user, section, shifts, training, docs, availabilityText) {
      if (section === 'employment' || section === 'shifts' || section === 'availability') {
        return employmentDetail(user, shifts, availabilityText);
      }
      return previousCentralProfileDetail(user, section, shifts, training, docs, availabilityText);
    };
    centralProfileDetail.__availabilityEditorWrapped = true;
  }

  function parseKey(value) {
    const parts = String(value || '').split('|');
    return { userId: parts[0], dayKey: parts[1], index: Number(parts[2] || 0) };
  }

  function getUserById(id) {
    return (state.users || []).find(user => user.id === id);
  }

  function saveAvailabilityChange() {
    save();
  }

  function bindAvailabilityEditor() {
    document.querySelectorAll('[data-availability-allday]').forEach(input => {
      if (input.dataset.boundAvailability) return;
      input.dataset.boundAvailability = '1';
      input.onchange = () => {
        const key = parseKey(input.dataset.availabilityAllday);
        const user = getUserById(key.userId);
        if (!user) return;
        const availability = migrateAvailability(user);
        availability[key.dayKey].allDay = input.checked;
        saveAvailabilityChange();
      };
    });

    document.querySelectorAll('[data-availability-start],[data-availability-end]').forEach(select => {
      if (select.dataset.boundAvailability) return;
      select.dataset.boundAvailability = '1';
      select.onchange = () => {
        const row = select.closest('[data-availability-range]');
        const key = parseKey(row && row.dataset.availabilityRange);
        const user = getUserById(key.userId);
        if (!user) return;
        const availability = migrateAvailability(user);
        availability[key.dayKey].ranges[key.index] = availability[key.dayKey].ranges[key.index] || { start: '09:00', end: '17:00' };
        availability[key.dayKey].ranges[key.index].start = row.querySelector('[data-availability-start]').value;
        availability[key.dayKey].ranges[key.index].end = row.querySelector('[data-availability-end]').value;
        availability[key.dayKey].allDay = false;
        const allDay = document.querySelector('[data-availability-allday="' + key.userId + '|' + key.dayKey + '"]');
        if (allDay) allDay.checked = false;
        saveAvailabilityChange();
      };
    });

    document.querySelectorAll('[data-availability-add]').forEach(button => {
      if (button.dataset.boundAvailability) return;
      button.dataset.boundAvailability = '1';
      button.onclick = () => {
        const key = parseKey(button.dataset.availabilityAdd);
        const user = getUserById(key.userId);
        if (!user) return;
        const availability = migrateAvailability(user);
        availability[key.dayKey].allDay = false;
        availability[key.dayKey].ranges.push({ start: '09:00', end: '17:00' });
        saveAvailabilityChange();
        const detail = document.getElementById('userModalDetail');
        if (detail && typeof centralProfileDetail === 'function') {
          let ctx = { shifts: [], training: [], docs: [], availabilityText: '' };
          try {
            const rs = readRotaState() || {};
            ctx.shifts = (rs.shifts || []).filter(s => s.userId === user.id).sort((a, b) => String(a.date).localeCompare(String(b.date)));
            ctx.training = (state.training || []).filter(t => t.userId === user.id);
            ctx.docs = (state.trainingDocs || []).filter(d => d.userId === user.id);
          } catch (_) {}
          detail.innerHTML = centralProfileDetail(user, 'employment', ctx.shifts, ctx.training, ctx.docs, ctx.availabilityText);
          bindAvailabilityEditor();
        } else {
          render();
        }
      };
    });

    document.querySelectorAll('[data-availability-remove]').forEach(button => {
      if (button.dataset.boundAvailability) return;
      button.dataset.boundAvailability = '1';
      button.onclick = () => {
        const key = parseKey(button.dataset.availabilityRemove);
        const user = getUserById(key.userId);
        if (!user) return;
        const availability = migrateAvailability(user);
        availability[key.dayKey].ranges.splice(key.index, 1);
        saveAvailabilityChange();
        const activeEmployment = document.querySelector('[data-user-modal-section="employment"].active');
        if (activeEmployment) activeEmployment.click(); else render();
      };
    });
  }

  const style = document.createElement('style');
  style.textContent = '.availabilityEditor{display:grid!important;grid-template-columns:repeat(7,minmax(0,1fr))!important;gap:4px!important;width:100%!important;box-sizing:border-box!important;overflow:hidden!important}.availabilityDay{min-width:0!important;background:rgba(255,255,255,.035)!important;border:1px solid rgba(255,255,255,.08)!important;border-radius:10px!important;padding:5px 3px!important;box-sizing:border-box!important}.availabilityDay h4{font-size:8px!important;line-height:1!important;text-align:center!important;margin:0 0 5px!important;white-space:nowrap!important;overflow:hidden!important;text-overflow:ellipsis!important}.availabilityAllDay{display:flex!important;align-items:center!important;justify-content:center!important;gap:2px!important;font-size:7px!important;line-height:1!important;margin:0 0 5px!important;white-space:nowrap!important}.availabilityAllDay input{width:13px!important;height:13px!important;min-height:13px!important;margin:0!important;padding:0!important}.availabilitySubhead{font-size:7px!important;line-height:1!important;text-align:center!important;margin:0 0 4px!important;color:#d0ad58!important;white-space:nowrap!important}.availabilityRanges{display:grid!important;gap:3px!important}.availabilityRange{display:grid!important;grid-template-columns:1fr!important;gap:2px!important;position:relative!important}.availabilityRange select{width:100%!important;min-width:0!important;height:24px!important;min-height:24px!important;padding:1px!important;border-radius:6px!important;font-size:7px!important;line-height:1!important;text-align:center!important}.availabilityRemove{position:absolute!important;top:-4px!important;right:-3px!important;width:13px!important;height:13px!important;min-width:13px!important;min-height:13px!important;border-radius:50%!important;padding:0!important;font-size:9px!important;line-height:1!important;background:#d83b2d!important;color:#fff!important;border:0!important}.availabilityAdd{width:100%!important;height:22px!important;min-height:22px!important;margin-top:4px!important;border-radius:7px!important;font-size:14px!important;line-height:1!important;padding:0!important}.availabilityNoRanges{display:none!important}@media(max-width:430px){.availabilityEditor{gap:3px!important}.availabilityDay{padding:4px 2px!important}.availabilityDay h4{font-size:7px!important}.availabilityAllDay span{display:none!important}.availabilitySubhead{font-size:6px!important}.availabilityRange select{font-size:6px!important;height:22px!important;min-height:22px!important}}';
  document.head.appendChild(style);

  if (Array.isArray(state.users)) {
    let changed = false;
    state.users.forEach(user => {
      const before = JSON.stringify(user.availability || {});
      migrateAvailability(user);
      if (JSON.stringify(user.availability || {}) !== before) changed = true;
    });
    if (changed) save();
  }

  if (typeof bind === 'function' && !bind.__availabilityEditorWrapped) {
    const previousBind = bind;
    bind = function bindWithAvailabilityEditor() {
      previousBind();
      bindAvailabilityEditor();
    };
    bind.__availabilityEditorWrapped = true;
  }

  document.addEventListener('change', event => {
    if (event.target && event.target.closest && event.target.closest('.availabilityEditor')) setTimeout(bindAvailabilityEditor, 0);
  }, true);
})();