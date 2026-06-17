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
})();

startApp();