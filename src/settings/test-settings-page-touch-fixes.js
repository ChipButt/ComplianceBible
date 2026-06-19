// Extra touch-friendly controls for the test settings page branch.
(function testSettingsPageTouchFixes(){
  if(window.__testSettingsPageTouchFixes) return;
  window.__testSettingsPageTouchFixes = true;
  window.modalRoot = window.modalRoot || document.getElementById('modal');
  const ROTA_KEY = 'rotaAppUnifiedV2';

  function readJSON(key,fallback){ try { const parsed = JSON.parse(localStorage.getItem(key) || 'null'); return parsed || fallback; } catch(_) { return fallback; } }
  function writeJSON(key,value){ try { localStorage.setItem(key, JSON.stringify(value)); } catch(_){} }
  function saveSafe(){ try { if(typeof save === 'function') save(); } catch(_){} }

  function saveOrder(list){
    const order = Array.from(list.querySelectorAll('[data-test-work-area]')).map(row => row.dataset.testWorkArea).filter(Boolean);
    if(!order.length) return;
    try {
      state.areas = order.slice();
      state.rotaSettings = state.rotaSettings || { sections: [] };
      state.rotaSettings.sections = order.slice();
      const rota = readJSON(ROTA_KEY, {});
      rota.sections = order.slice();
      writeJSON(ROTA_KEY, rota);
      saveSafe();
    } catch(_) {}
  }

  function moveRow(row,target,y){
    if(!row || !target || row === target) return;
    const list = row.parentElement;
    if(!list || target.parentElement !== list) return;
    const rect = target.getBoundingClientRect();
    list.insertBefore(row, y > rect.top + rect.height / 2 ? target.nextSibling : target);
  }

  function installPointerDrag(){
    document.querySelectorAll('.testAreaList').forEach(list => {
      list.querySelectorAll('.testAreaRow').forEach(row => {
        const label = row.querySelector('span:not(.testDragHandle)');
        if(label && !row.dataset.testWorkArea) row.dataset.testWorkArea = label.textContent.trim();
        const handle = row.querySelector('.testDragHandle');
        if(!handle || handle.dataset.touchDragReady) return;
        handle.dataset.touchDragReady = '1';
        handle.onpointerdown = event => {
          event.preventDefault();
          row.classList.add('dragging');
          try { handle.setPointerCapture(event.pointerId); } catch(_) {}
          const onMove = moveEvent => {
            moveEvent.preventDefault();
            const el = document.elementFromPoint(moveEvent.clientX, moveEvent.clientY);
            const target = el && el.closest && el.closest('.testAreaRow');
            moveRow(row, target, moveEvent.clientY);
          };
          const finish = () => {
            row.classList.remove('dragging');
            saveOrder(list);
            window.removeEventListener('pointermove', onMove, true);
            window.removeEventListener('pointerup', finish, true);
            window.removeEventListener('pointercancel', finish, true);
          };
          window.addEventListener('pointermove', onMove, true);
          window.addEventListener('pointerup', finish, true);
          window.addEventListener('pointercancel', finish, true);
        };
      });
    });
  }

  document.addEventListener('click', () => setTimeout(installPointerDrag, 0), true);
  const observer = new MutationObserver(() => installPointerDrag());
  if(document.body) observer.observe(document.body, { childList:true, subtree:true });
  installPointerDrag();
})();