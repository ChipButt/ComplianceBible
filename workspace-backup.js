// Browser storage belongs to the original site. Export it explicitly for an owner to import.
(() => {
  const button = document.getElementById('export-workspace');
  if (!button) return;
  button.addEventListener('click', () => {
    const values = {};
    for (const key of ['complianceBible.v1', 'complianceUserDocumentRequirementsV1', 'rotaAppUnifiedV2']) {
      const value = localStorage.getItem(key);
      if (value !== null) values[key] = value;
    }
    const file = new Blob([JSON.stringify({format: 'compliance-bible-workspace-v1', values})], {type: 'application/json'});
    const url = URL.createObjectURL(file);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'compliance-bible-backup.json';
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  });
})();
