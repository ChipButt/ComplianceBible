const keys = new Set(['complianceBible.v1', 'complianceUserDocumentRequirementsV1', 'rotaAppUnifiedV2']);
const backupFormat = 'compliance-bible-workspace-v1';
const maxSize = 20 * 1024 * 1024;
const encoder = new TextEncoder();

export function ownerWorkspace(db) {
  const frame = document.getElementById('workspace-frame');
  const status = document.getElementById('workspace-status');
  const retry = document.getElementById('retry-workspace');
  const backup = document.getElementById('export-cloud-workspace');
  const importLabel = document.getElementById('import-workspace-label');
  const fileInput = document.getElementById('import-workspace');
  let selected = null;
  let loading = false;
  let revision = 0;
  let values = {};
  let pending = false;
  let loaded = false;
  let saving = null;
  let timer;
  let restorePending = false;

  async function persist() {
    if (saving) return saving;
    if (!pending) return true;
    saving = (async () => {
      while (pending) {
        pending = false;
        const snapshot = {...values};
        const size = encoder.encode(JSON.stringify(snapshot)).length;
        if (size > maxSize) {
          pending = true;
          status.textContent = 'The workspace exceeds 20 MB. Download a backup before closing.';
          return false;
        }
        status.textContent = 'Saving to Supabase…';
        try {
          const table = db.from('cb_workspace');
          const request = revision
            ? table.update({snapshot}).eq('premises_id', selected.premises_id).eq('revision', revision)
            : table.insert({premises_id: selected.premises_id, snapshot});
          const {data, error} = await request.select('revision').maybeSingle();
          if (error) throw error;
          if (!data) throw new Error('Another session saved a newer version. Download your backup and reload.');
          revision = data.revision;
          importLabel.hidden = true;
        } catch (error) {
          pending = true;
          status.textContent = error.code === '23505'
            ? 'Another session created the workspace. Download your backup and reload.'
            : error.message || 'Save failed. Retry or download a backup.';
          retry.hidden = false;
          return false;
        }
      }
      retry.hidden = true;
      status.textContent = 'Saved to Supabase';
      if (restorePending) {
        restorePending = false;
        frame.hidden = false;
        frame.src = '/workspace/index.html';
      }
      return true;
    })();
    try {
      return await saving;
    } finally {
      saving = null;
    }
  }

  function queueSave() {
    pending = true;
    status.textContent = 'Changes pending…';
    clearTimeout(timer);
    timer = setTimeout(persist, 250);
  }

  async function open(site) {
    if (selected === site && (loading || frame.hasAttribute('src'))) return;
    selected = site;
    loading = true;
    status.textContent = 'Loading premises workspace…';
    const {data, error} = await db.from('cb_workspace')
      .select('revision, snapshot').eq('premises_id', site.premises_id).maybeSingle();
    if (selected !== site) return;
    loading = false;
    if (error) {
      status.textContent = 'Could not load this premises. Reopen Compliance Bible to retry.';
      return;
    }
    revision = data?.revision || 0;
    values = data?.snapshot || {
      'complianceBible.v1': JSON.stringify({
        pub: {name: site.cb_premises.name, licence: '', dps: '', address: ''},
        currentUser: 'workspace-owner',
        users: [{id: 'workspace-owner', name: site.display_name, nickname: site.display_name,
          role: 'Admin', rotaRole: 'admin', area: 'Office'}],
        training: [],
        issues: []
      })
    };
    backup.hidden = false;
    importLabel.hidden = Boolean(revision);
    frame.hidden = false;
    frame.src = '/workspace/index.html';
  }

  async function close() {
    clearTimeout(timer);
    if (!await persist()) return false;
    selected = null;
    loading = false;
    loaded = false;
    revision = 0;
    values = {};
    frame.hidden = true;
    frame.removeAttribute('src');
    backup.hidden = true;
    importLabel.hidden = true;
    retry.hidden = true;
    return true;
  }

  window.addEventListener('message', event => {
    if (!selected || event.source !== frame.contentWindow || event.origin !== 'null') return;
    const {type, key, value} = event.data || {};
    if (type === 'cb:ready') frame.contentWindow.postMessage({type: 'cb:init', values}, '*');
    if (type === 'cb:loaded') {
      loaded = true;
      status.textContent = revision ? 'Saved to Supabase' : 'New workspace · import a backup or start editing';
    }
    if (type === 'cb:failed') status.textContent = 'Some app files could not load. Reload and try again.';
    if (type === 'cb:write' && keys.has(key) && typeof value === 'string' && value !== values[key]) {
      values[key] = value;
      if (loaded) queueSave();
    }
  });

  window.addEventListener('beforeunload', event => {
    if (pending || saving) event.preventDefault();
  });
  retry.addEventListener('click', persist);
  backup.addEventListener('click', () => {
    const data = JSON.stringify({format: backupFormat, values});
    const url = URL.createObjectURL(new Blob([data], {type: 'application/json'}));
    const link = document.createElement('a');
    link.href = url;
    link.download = 'compliance-bible-backup.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });

  fileInput.addEventListener('change', async () => {
    const file = fileInput.files[0];
    fileInput.value = '';
    if (!file || revision || pending || saving || !selected) return;
    const site = selected;
    try {
      if (file.size > maxSize) throw new Error('Backup exceeds the 20 MB limit.');
      const source = JSON.parse(await file.text());
      if (source?.format !== backupFormat || typeof source.values?.['complianceBible.v1'] !== 'string') {
        throw new Error('Choose a backup exported from Compliance Bible.');
      }
      const imported = {};
      for (const key of keys) {
        if (source.values[key] === undefined) continue;
        const value = JSON.parse(source.values[key]);
        if (!value || typeof value !== 'object') throw new Error('The backup contains invalid data.');
        if (key === 'complianceBible.v1' &&
            (!Array.isArray(value.users) || !value.users.length || !Array.isArray(value.checks) || !Array.isArray(value.docs))) {
          throw new Error('The backup is missing users, checks or documents.');
        }
        imported[key] = JSON.stringify(value);
      }
      if (site !== selected || revision || pending || saving) return;
      values = imported;
      pending = true;
      loaded = false;
      restorePending = true;
      frame.hidden = true;
      frame.removeAttribute('src');
      await persist();
    } catch (error) {
      status.textContent = error.message;
    }
  });
  return {open, close};
}
