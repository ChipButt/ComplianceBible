// Adds file upload / camera capture wherever document evidence is shown.
(function documentEvidenceUploadPatch() {
  if (window.__documentEvidenceUploadPatch) return;
  window.__documentEvidenceUploadPatch = true;

  function readFile(file, done) {
    if (!file) return done('');
    const reader = new FileReader();
    reader.onload = () => done(reader.result || '');
    reader.readAsDataURL(file);
  }

  function evidenceInputs(prefix) {
    return `<div class="evidenceUploadBox">
      <label>Take photo<input name="${prefix}Camera" type="file" accept="image/*" capture="environment"></label>
      <label>Upload file<input name="${prefix}File" type="file" accept="image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg"></label>
    </div>`;
  }

  function addEvidenceToPremisesDocs() {
    document.querySelectorAll('[data-doc]').forEach(button => {
      const docId = button.dataset.doc;
      const doc = state.docs.find(d => d.id === docId);
      const container = button.closest('.docItem');
      if (!doc || !container || container.dataset.evidenceEnhanced) return;
      container.dataset.evidenceEnhanced = 'yes';
      const target = button.parentElement || container;
      const wrap = document.createElement('div');
      wrap.className = 'evidenceUploadActions';
      wrap.innerHTML = `${doc.fileName ? `<p class="muted">Evidence: ${esc(doc.fileName)}</p>` : '<p class="muted">No evidence uploaded</p>'}${evidenceInputs('premisesEvidence')}${doc.fileData ? '<button class="ghost small" data-view-premises-evidence="' + esc(doc.id) + '">View</button>' : ''}`;
      target.appendChild(wrap);

      wrap.querySelectorAll('input[type="file"]').forEach(input => {
        input.onchange = () => {
          const file = input.files && input.files[0];
          if (!file) return;
          readFile(file, data => {
            doc.fileName = file.name;
            doc.fileType = file.type;
            doc.fileData = data;
            doc.uploadedAt = new Date().toISOString();
            doc.status = 'Stored';
            save();
            render();
          });
        };
      });
    });

    document.querySelectorAll('[data-view-premises-evidence]').forEach(button => {
      button.onclick = () => {
        const doc = state.docs.find(d => d.id === button.dataset.viewPremisesEvidence);
        if (!doc || !doc.fileData) return;
        window.open(doc.fileData, '_blank');
      };
    });
  }

  function enhanceUserDocForms() {
    document.querySelectorAll('form[data-user-doc-upload]').forEach(form => {
      if (form.dataset.photoEnhanced) return;
      form.dataset.photoEnhanced = 'yes';
      const original = form.querySelector('input[name="file"]');
      if (original) original.remove();
      form.insertAdjacentHTML('afterbegin', evidenceInputs('userDocEvidence'));
      const oldSubmit = form.onsubmit;
      form.onsubmit = event => {
        event.preventDefault();
        const parts = form.dataset.userDocUpload.split('|');
        const userId = parts[0];
        const requirementId = parts[1];
        const camera = form.querySelector('input[name="userDocEvidenceCamera"]');
        const upload = form.querySelector('input[name="userDocEvidenceFile"]');
        const file = (camera && camera.files && camera.files[0]) || (upload && upload.files && upload.files[0]) || null;
        const noExpiry = form.querySelector('[name="noExpiry"]');
        const expiry = form.querySelector('[name="expiryDate"]');
        const noExpiryValue = !!(noExpiry && noExpiry.checked);
        const expiryDate = noExpiryValue ? '' : (expiry ? expiry.value : '');
        readFile(file, data => {
          state.userRequiredDocuments = state.userRequiredDocuments || [];
          let record = state.userRequiredDocuments.find(r => r.userId === userId && r.requirementId === requirementId);
          if (!record) {
            record = { id: uid(), userId, requirementId };
            state.userRequiredDocuments.push(record);
          }
          if (file) {
            record.fileName = file.name;
            record.fileType = file.type;
            record.fileData = data;
          }
          record.noExpiry = noExpiryValue;
          record.expiryDate = expiryDate;
          record.updatedAt = new Date().toISOString();
          save();
          render();
        });
      };
    });
  }

  function enhanceDocForm() {
    const form = document.getElementById('docForm');
    if (!form || form.dataset.evidenceEnhanced) return;
    form.dataset.evidenceEnhanced = 'yes';
    const button = form.querySelector('button');
    if (button) button.insertAdjacentHTML('beforebegin', evidenceInputs('newDocEvidence'));
    form.onsubmit = event => {
      event.preventDefault();
      const data = new FormData(form);
      const camera = form.querySelector('input[name="newDocEvidenceCamera"]');
      const upload = form.querySelector('input[name="newDocEvidenceFile"]');
      const file = (camera && camera.files && camera.files[0]) || (upload && upload.files && upload.files[0]) || null;
      readFile(file, fileData => {
        state.docs.push({
          id: uid(),
          title: data.get('title'),
          cat: data.get('cat'),
          expiry: data.get('expiry'),
          notes: data.get('notes') || '',
          status: file ? 'Stored' : 'Missing',
          fileName: file ? file.name : '',
          fileType: file ? file.type : '',
          fileData,
          uploadedAt: file ? new Date().toISOString() : ''
        });
        save();
        render();
      });
    };
  }

  function enhanceAll() {
    document.querySelectorAll('input[type="file"]').forEach(input => {
      if (!input.accept) input.accept = 'image/*,.pdf,.doc,.docx,.png,.jpg,.jpeg';
    });
    addEvidenceToPremisesDocs();
    enhanceUserDocForms();
    enhanceDocForm();
  }

  const style = document.createElement('style');
  style.textContent = `
    .evidenceUploadBox{display:grid;gap:8px;margin-top:8px}
    .evidenceUploadBox label{display:grid;gap:6px;color:var(--rotamut,#a69e90);font-weight:800}
    .evidenceUploadBox input[type=file]{padding:10px!important;min-height:auto!important}
    .evidenceUploadActions{display:grid;gap:8px;margin-top:8px}
  `;
  document.head.appendChild(style);

  if (typeof bind === 'function' && !bind.__documentEvidenceUploadPatch) {
    const oldBind = bind;
    bind = function bindWithDocumentEvidence() {
      oldBind();
      enhanceAll();
    };
    bind.__documentEvidenceUploadPatch = true;
  }

  document.addEventListener('click', () => setTimeout(enhanceAll, 0), true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', enhanceAll); else enhanceAll();
})();