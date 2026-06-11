// Force the final document UI to the dark reference palette after every render.
// This avoids old/global CSS winning with gold-filled backgrounds.
(function () {
  if (window.__documentForceDark) return;
  window.__documentForceDark = true;

  function set(el, prop, value) {
    if (el) el.style.setProperty(prop, value, 'important');
  }

  function applyForceDark() {
    document.querySelectorAll('.fdoc').forEach(card => {
      set(card, 'background', '#030405');
      set(card, 'border', '1px solid rgba(210,161,67,.28)');
      set(card, 'border-radius', '18px');
      set(card, 'overflow', 'hidden');
      set(card, 'box-shadow', '0 14px 28px rgba(0,0,0,.42), inset 0 0 0 1px rgba(255,255,255,.025)');
    });

    document.querySelectorAll('.fdocBar').forEach(bar => {
      set(bar, 'background', 'linear-gradient(180deg, rgba(23,18,10,.84), rgba(9,9,10,.98))');
      set(bar, 'background-color', '#08090a');
      set(bar, 'color', '#f8f1e5');
      set(bar, 'border', '0');
      set(bar, 'border-bottom', '1px solid rgba(210,161,67,.34)');
      set(bar, 'box-shadow', 'none');
      set(bar, 'min-height', '62px');
    });

    document.querySelectorAll('.fdocIcon').forEach(icon => {
      set(icon, 'background', 'rgba(210,161,67,.08)');
      set(icon, 'color', '#f2b84c');
      set(icon, 'border', '1px solid rgba(210,161,67,.55)');
    });

    document.querySelectorAll('.fdocName strong').forEach(el => set(el, 'color', '#f8f1e5'));
    document.querySelectorAll('.fdocName em, .fdocArrow').forEach(el => set(el, 'color', '#f2b84c'));

    document.querySelectorAll('.fdocBadge').forEach(badge => {
      set(badge, 'background', 'rgba(0,0,0,.28)');
      set(badge, 'color', '#f8f1e5');
      set(badge, 'border', '1px solid rgba(210,161,67,.54)');
    });

    document.querySelectorAll('.fdocPanel').forEach(panel => {
      set(panel, 'background', 'linear-gradient(180deg, #090a0b, #050607)');
    });

    document.querySelectorAll('.fdocInstruction').forEach(text => set(text, 'color', '#aaa298'));

    document.querySelectorAll('.fdocThumb').forEach(thumb => {
      set(thumb, 'background', 'linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.025))');
      set(thumb, 'color', '#d9d0c2');
      set(thumb, 'border', '1px solid rgba(255,255,255,.16)');
    });

    document.querySelectorAll('.fdocThumb.empty').forEach(thumb => {
      set(thumb, 'background', 'linear-gradient(180deg, #17191b, #101113)');
      set(thumb, 'color', '#bcb3a5');
    });

    document.querySelectorAll('.fdocUploads label, .fdocSwitch, .fdocExpiry').forEach(ctrl => {
      set(ctrl, 'background', 'linear-gradient(180deg, #181a1c, #101113)');
      set(ctrl, 'color', '#f8f1e5');
      set(ctrl, 'border', '1px solid rgba(255,255,255,.12)');
      set(ctrl, 'box-shadow', 'inset 0 1px 0 rgba(255,255,255,.035)');
    });

    document.querySelectorAll('.fdocSwitchText, .fdocExpiry > span:first-child').forEach(text => {
      set(text, 'color', '#f8f1e5');
    });

    document.querySelectorAll('.fdocUploads svg, .fdocDateInputWrap svg').forEach(svg => {
      set(svg, 'stroke', '#f2b84c');
      set(svg, 'fill', 'none');
    });

    document.querySelectorAll('.fdocMeta').forEach(meta => {
      set(meta, 'display', 'grid');
      set(meta, 'grid-template-columns', 'minmax(0,1fr) minmax(0,1fr)');
      set(meta, 'gap', '8px');
      set(meta, 'align-items', 'stretch');
    });

    // Toggle positioning fix: keep the switch fully inside the Does Not Expire box.
    document.querySelectorAll('.fdocSwitch').forEach(box => {
      set(box, 'display', 'grid');
      set(box, 'grid-template-columns', 'minmax(0,1fr) auto');
      set(box, 'align-items', 'center');
      set(box, 'justify-content', 'normal');
      set(box, 'gap', '8px');
      set(box, 'overflow', 'hidden');
      set(box, 'padding', '7px 8px');
    });

    document.querySelectorAll('.fdocSwitchText').forEach(text => {
      set(text, 'min-width', '0');
      set(text, 'overflow', 'hidden');
      set(text, 'text-overflow', 'ellipsis');
      set(text, 'white-space', 'nowrap');
    });

    document.querySelectorAll('.fdocSwitchTrack').forEach(track => {
      set(track, 'justify-self', 'end');
      set(track, 'margin', '0');
      set(track, 'position', 'relative');
      set(track, 'right', 'auto');
      set(track, 'left', 'auto');
      set(track, 'transform', 'none');
      set(track, 'width', '38px');
      set(track, 'height', '22px');
      set(track, 'flex', '0 0 auto');
      set(track, 'background', '#242526');
      set(track, 'border', '1px solid rgba(255,255,255,.10)');
    });

    document.querySelectorAll('.fdocExpiry').forEach(box => {
      set(box, 'display', 'grid');
      set(box, 'grid-template-columns', 'auto minmax(0,1fr)');
      set(box, 'align-items', 'center');
      set(box, 'gap', '7px');
      set(box, 'overflow', 'hidden');
    });
  }

  function hookRender() {
    if (typeof render !== 'function' || render.__documentForceDark) return;
    const originalRender = render;
    render = function () {
      originalRender.apply(this, arguments);
      setTimeout(applyForceDark, 0);
      setTimeout(applyForceDark, 80);
      setTimeout(applyForceDark, 250);
    };
    render.__documentForceDark = true;
  }

  hookRender();
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      hookRender();
      applyForceDark();
      setTimeout(applyForceDark, 250);
    });
  } else {
    applyForceDark();
    setTimeout(applyForceDark, 250);
  }

  document.addEventListener('click', () => setTimeout(applyForceDark, 0), true);
})();
