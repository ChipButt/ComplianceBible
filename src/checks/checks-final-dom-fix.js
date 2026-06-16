(function installChecksFinalDomFix(){
  if (window.__checksFinalDomFix) return;
  window.__checksFinalDomFix = true;

  function fixCheckButtons(){
    document.querySelectorAll('#app .areaGroupButton').forEach(button => {
      button.style.setProperty('display', 'grid', 'important');
      button.style.setProperty('grid-template-columns', '48px minmax(0, 1fr) 30px', 'important');
      button.style.setProperty('gap', '12px', 'important');
      button.style.setProperty('align-items', 'center', 'important');
      button.style.setProperty('padding-left', '14px', 'important');
      button.style.setProperty('padding-right', '14px', 'important');
      button.style.setProperty('min-height', '68px', 'important');
      button.style.setProperty('height', '68px', 'important');

      const name = button.querySelector(':scope > .fdocName');
      if (name) {
        name.style.setProperty('grid-column', '2', 'important');
        name.style.setProperty('align-self', 'center', 'important');
        name.style.setProperty('min-width', '0', 'important');
        name.style.setProperty('transform', 'none', 'important');
        name.style.setProperty('margin', '0', 'important');
      }
    });

    document.querySelectorAll('#app .areaCheckToggle').forEach(button => {
      const icon = button.querySelector(':scope > .fdocIcon');
      if (icon) icon.remove();

      button.style.setProperty('display', 'grid', 'important');
      button.style.setProperty('grid-template-columns', 'minmax(0, 1fr) 28px', 'important');
      button.style.setProperty('gap', '8px', 'important');
      button.style.setProperty('padding-left', '14px', 'important');
      button.style.setProperty('padding-right', '8px', 'important');
      button.style.setProperty('align-items', 'center', 'important');
      button.style.setProperty('overflow', 'hidden', 'important');

      const name = button.querySelector(':scope > .fdocName');
      if (name) {
        name.style.setProperty('display', 'block', 'important');
        name.style.setProperty('min-width', '0', 'important');
        name.style.setProperty('width', '100%', 'important');
        name.style.setProperty('max-width', 'none', 'important');
        name.style.setProperty('overflow', 'hidden', 'important');
        name.style.setProperty('grid-column', '1', 'important');
      }

      const arrow = button.querySelector(':scope > .fdocArrow');
      if (arrow) {
        arrow.style.setProperty('grid-column', '2', 'important');
        arrow.style.setProperty('justify-self', 'end', 'important');
        arrow.style.setProperty('align-self', 'center', 'important');
        arrow.style.setProperty('transform', 'none', 'important');
        arrow.style.setProperty('right', 'auto', 'important');
        arrow.style.setProperty('top', 'auto', 'important');
        arrow.style.setProperty('width', '28px', 'important');
        arrow.style.setProperty('height', '28px', 'important');
        arrow.style.setProperty('min-width', '28px', 'important');
        arrow.style.setProperty('max-width', '28px', 'important');
        arrow.style.setProperty('overflow', 'visible', 'important');
      }

      const strong = button.querySelector(':scope > .fdocName > strong');
      if (strong) {
        strong.style.setProperty('display', 'block', 'important');
        strong.style.setProperty('width', '100%', 'important');
        strong.style.setProperty('max-width', 'none', 'important');
        strong.style.setProperty('white-space', 'nowrap', 'important');
        strong.style.setProperty('overflow', 'hidden', 'important');
        strong.style.setProperty('text-overflow', 'ellipsis', 'important');
      }

      const em = button.querySelector(':scope > .fdocName > em');
      if (em) {
        em.style.setProperty('display', 'block', 'important');
        em.style.setProperty('width', '100%', 'important');
        em.style.setProperty('max-width', 'none', 'important');
        em.style.setProperty('white-space', 'nowrap', 'important');
        em.style.setProperty('overflow', 'hidden', 'important');
        em.style.setProperty('text-overflow', 'ellipsis', 'important');
      }
    });

    document.querySelectorAll('#app .areaCheckCard.open > .areaCheckToggle .fdocName, #app .areaCheckCard.open > .areaCheckToggle .fdocName strong').forEach(el => {
      el.style.setProperty('white-space', 'normal', 'important');
      el.style.setProperty('overflow', 'visible', 'important');
      el.style.setProperty('text-overflow', 'clip', 'important');
    });
  }

  const previousRender = window.render;
  if (typeof previousRender === 'function') {
    window.render = function renderWithChecksFinalDomFix(){
      previousRender.apply(this, arguments);
      setTimeout(fixCheckButtons, 0);
      setTimeout(fixCheckButtons, 80);
    };
  }

  document.addEventListener('click', () => {
    setTimeout(fixCheckButtons, 0);
    setTimeout(fixCheckButtons, 80);
  }, true);

  const observer = new MutationObserver(() => fixCheckButtons());
  observer.observe(document.documentElement, { childList: true, subtree: true });

  fixCheckButtons();
})();