// Make the Home summary cards useful: tap them to go to the right place to fix the issue.
(function statusCardActions() {
  if (window.__statusCardActions) return;
  window.__statusCardActions = true;

  function go(target) {
    try {
      route = target;
      if (typeof render === 'function') render();
      window.scrollTo(0, 0);
    } catch (e) {
      console.warn('Could not route from status card', e);
    }
  }

  function wireCards() {
    var cards = document.querySelectorAll('.statusStrip > div');
    if (!cards.length) return;

    var routes = ['checks', 'documents', 'logs'];
    var labels = [
      'Open overdue checks',
      'Open missing documents',
      'Open unresolved issues'
    ];

    cards.forEach(function (card, index) {
      if (!routes[index]) return;
      card.classList.add('statusActionCard');
      card.setAttribute('role', 'button');
      card.setAttribute('tabindex', '0');
      card.setAttribute('aria-label', labels[index]);
      card.dataset.statusRoute = routes[index];
      card.onclick = function () { go(card.dataset.statusRoute); };
      card.onkeydown = function (event) {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          go(card.dataset.statusRoute);
        }
      };
    });
  }

  var style = document.createElement('style');
  style.textContent = `
    .statusActionCard {
      cursor: pointer !important;
      position: relative !important;
      transition: transform .12s ease, border-color .12s ease, background .12s ease !important;
      padding-right: 46px !important;
    }

    .statusActionCard::after {
      content: '›' !important;
      position: absolute !important;
      right: 18px !important;
      top: 50% !important;
      transform: translateY(-50%) !important;
      color: #B0914A !important;
      font-size: 34px !important;
      line-height: 1 !important;
      font-weight: 700 !important;
      opacity: .9 !important;
    }

    .statusActionCard:active {
      transform: scale(.985) !important;
    }

    .statusActionCard:focus-visible {
      outline: 3px solid rgba(176,145,74,.45) !important;
      outline-offset: 3px !important;
    }
  `;
  document.head.appendChild(style);

  if (typeof bind === 'function' && !bind.__statusCardActions) {
    var oldBind = bind;
    bind = function bindWithStatusActions() {
      oldBind();
      wireCards();
    };
    bind.__statusCardActions = true;
  }

  document.addEventListener('click', function () { setTimeout(wireCards, 0); }, true);
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', wireCards); else wireCards();
})();