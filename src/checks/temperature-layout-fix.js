// Final temperature check layout: match the confirmed document-card expanded layout.
(function temperatureLayoutFix(){
  if (window.__temperatureLayoutFix) return;
  window.__temperatureLayoutFix = true;

  const style = document.createElement('style');
  style.textContent = `
    .checksPage .tempEvidenceGrid { display: block !important; }
    .checksPage .tempEvidenceGrid .tempEvidenceIcon,
    .checksPage .tempEvidenceGrid .tempEvidenceControls { display: none !important; }
    .checksPage .temperatureDocBody { display: grid !important; grid-template-columns: auto minmax(0,1fr) !important; gap: 18px !important; align-items: stretch !important; }
    .checksPage .temperatureDocBody .fdocThumb { width: 112px !important; min-height: 142px !important; }
    .checksPage .temperatureDocControls { display: grid !important; gap: 14px !important; min-width: 0 !important; }
    .checksPage .temperaturePhotoUpload { display: grid !important; grid-template-columns: 1fr !important; }
    .checksPage .temperaturePhotoUpload label { min-height: 58px !important; display: grid !important; grid-template-columns: auto 1fr !important; place-items: center !important; gap: 12px !important; border-radius: 18px !important; background: linear-gradient(180deg,#1b1d20,#101215) !important; border: 1px solid rgba(255,255,255,.1) !important; box-shadow: inset 0 1px 0 rgba(255,255,255,.06), 0 8px 18px rgba(0,0,0,.22) !important; color: #fff8ea !important; font-weight: 900 !important; cursor: pointer !important; }
    .checksPage .temperaturePhotoUpload input { position: absolute !important; width: 1px !important; height: 1px !important; opacity: 0 !important; pointer-events: none !important; }
    .checksPage .temperatureMeta { display: grid !important; grid-template-columns: 1fr 1fr !important; gap: 14px !important; }
    .checksPage .temperatureInputBox { min-height: 58px !important; border-radius: 18px !important; background: linear-gradient(180deg,#1b1d20,#101215) !important; border: 1px solid rgba(255,255,255,.1) !important; display: grid !important; align-items: center !important; padding: 8px 14px !important; }
    .checksPage .temperatureInputBox span { color: #fff8ea !important; font-weight: 900 !important; font-size: 13px !important; }
    .checksPage .temperatureInputBox input { width: 100% !important; border: 0 !important; padding: 4px 0 0 !important; background: transparent !important; color: #fff8ea !important; font-size: 20px !important; font-weight: 900 !important; outline: 0 !important; }
    .checksPage .temperatureSaveButton { min-height: 58px !important; border-radius: 18px !important; width: 100% !important; }
    @media(max-width:430px){ .checksPage .temperatureDocBody{grid-template-columns:112px minmax(0,1fr)!important;gap:12px!important}.checksPage .temperatureMeta{grid-template-columns:1fr!important} }
  `;
  document.head.appendChild(style);

  const cameraIcon = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 8h4l2-3h4l2 3h4v11H4z"/><circle cx="12" cy="13" r="4"/></svg>';

  function transformTemperaturePanel(panel) {
    if (!panel || panel.dataset.temperatureDocFixed) return;
    const form = panel.querySelector('form');
    const tempInput = form && form.querySelector('input[name="temperature"]');
    const oldPhoto = form && form.querySelector('input[name="evidencePhoto"]');
    if (!form || !tempInput || !oldPhoto) return;
    panel.dataset.temperatureDocFixed = '1';

    const oldGrid = form.querySelector('.tempEvidenceGrid');
    const oldSave = form.querySelector('.tempSaveRow .saveCheckInline') || form.querySelector('.saveCheckInline');
    if (oldGrid) oldGrid.remove();
    if (oldSave && oldSave.parentElement) oldSave.parentElement.remove();

    const body = document.createElement('div');
    body.className = 'temperatureDocBody';
    body.innerHTML = '<button type="button" class="fdocThumb empty temperatureThumb">No photo</button>' +
      '<div class="temperatureDocControls">' +
        '<div class="temperaturePhotoUpload"><label>' + cameraIcon + '<span>Take Photo</span><input type="file" name="evidencePhoto" accept="image/*" capture="environment"></label></div>' +
        '<div class="temperatureMeta"><label class="temperatureInputBox"><span>Temperature °C</span><input name="temperature" inputmode="decimal" placeholder="3°C" required></label><button type="submit" class="primary temperatureSaveButton">Save</button></div>' +
      '</div>';

    form.insertBefore(body, form.firstChild);

    const oldTemp = form.querySelector('.tempSaveRow');
    if (oldTemp) oldTemp.remove();

    const photoInput = body.querySelector('input[name="evidencePhoto"]');
    const newTempInput = body.querySelector('input[name="temperature"]');
    const thumb = body.querySelector('.temperatureThumb');
    photoInput.addEventListener('change', function(){
      const file = photoInput.files && photoInput.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = function(){ thumb.classList.remove('empty'); thumb.innerHTML = '<img src="' + reader.result + '" alt="Temperature evidence">'; };
      reader.readAsDataURL(file);
      if (window.Tesseract && !newTempInput.value) {
        window.Tesseract.recognize(file,'eng').then(function(result){
          const text = result && result.data && result.data.text || '';
          const found = String(text).match(/-?\d+(?:\.\d+)?\s*(?:°\s*)?[cC]?/);
          if (found && !newTempInput.value) newTempInput.value = found[0].replace(/\s+/g,'');
        }).catch(function(){});
      }
    });
  }

  function apply() {
    document.querySelectorAll('.checkDocPanel').forEach(transformTemperaturePanel);
  }

  document.addEventListener('click', function(){ setTimeout(apply, 20); }, true);
  document.addEventListener('change', function(){ setTimeout(apply, 20); }, true);
  const oldRender = render;
  render = function renderWithTemperatureLayoutFix() {
    oldRender();
    setTimeout(apply, 20);
  };
  setTimeout(apply, 20);
})();
