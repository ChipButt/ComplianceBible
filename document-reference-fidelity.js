// Final visual override for Option C document cards.
// Loaded after final-document-system.js so this styling actually wins over renderer-injected CSS.
(function () {
  if (window.__documentReferenceFidelityFinal) return;
  window.__documentReferenceFidelityFinal = true;

  const css = `
    :root {
      --ref-black: #030405;
      --ref-panel: #08090a;
      --ref-control: #16181a;
      --ref-control-2: #101113;
      --ref-gold: #d2a143;
      --ref-gold-bright: #f2b84c;
      --ref-white: #f8f1e5;
      --ref-muted: #aaa298;
      --ref-line: rgba(210,161,67,.38);
    }

    body .fdoc {
      background: var(--ref-black) !important;
      border: 1px solid rgba(210,161,67,.28) !important;
      border-radius: 18px !important;
      overflow: hidden !important;
      box-shadow: 0 14px 28px rgba(0,0,0,.42), inset 0 0 0 1px rgba(255,255,255,.025) !important;
    }

    body .fdocBar {
      min-height: 62px !important;
      padding: 8px 11px !important;
      background: linear-gradient(180deg, rgba(23,18,10,.84), rgba(9,9,10,.98)) !important;
      border: 0 !important;
      border-bottom: 1px solid rgba(210,161,67,.34) !important;
      border-radius: 0 !important;
      color: var(--ref-white) !important;
      box-shadow: none !important;
      display: grid !important;
      grid-template-columns: 42px minmax(0, 1fr) auto auto 26px !important;
      gap: 10px !important;
      align-items: center !important;
    }

    body .fdocIcon {
      width: 34px !important;
      height: 34px !important;
      border-radius: 50% !important;
      border: 1px solid rgba(210,161,67,.55) !important;
      background: rgba(210,161,67,.08) !important;
      color: var(--ref-gold-bright) !important;
      box-shadow: inset 0 0 0 1px rgba(0,0,0,.38), 0 0 12px rgba(210,161,67,.08) !important;
    }

    body .fdocIcon svg,
    body .fdocUploads svg,
    body .fdocDateInputWrap svg {
      fill: none !important;
      stroke: var(--ref-gold-bright) !important;
      stroke-width: 1.85 !important;
      stroke-linecap: round !important;
      stroke-linejoin: round !important;
    }

    body .fdocName strong {
      color: var(--ref-white) !important;
      font-size: 15px !important;
      font-weight: 850 !important;
      line-height: 1.06 !important;
    }

    body .fdocName em {
      color: var(--ref-gold-bright) !important;
      font-size: 12px !important;
      margin-top: 3px !important;
    }

    body .fdocBadge {
      background: rgba(0,0,0,.28) !important;
      color: var(--ref-white) !important;
      border: 1px solid rgba(210,161,67,.54) !important;
      border-radius: 8px !important;
      padding: 6px 9px !important;
      font-size: 12px !important;
      font-weight: 820 !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.03) !important;
    }

    body .fdocDate {
      color: #d7cfc2 !important;
      font-size: 13px !important;
      white-space: nowrap !important;
    }

    body .fdocArrow {
      color: var(--ref-gold-bright) !important;
      font-size: 19px !important;
      line-height: 1 !important;
    }

    body .fdocPanel {
      background: linear-gradient(180deg, #090a0b, #050607) !important;
      padding: 9px 10px 11px !important;
      border-radius: 0 !important;
    }

    body .fdocInstruction {
      margin: 0 0 9px !important;
      color: var(--ref-muted) !important;
      font-size: 12.5px !important;
      line-height: 1.35 !important;
    }

    body .fdocBody {
      display: grid !important;
      grid-template-columns: 86px minmax(0, 1fr) !important;
      gap: 11px !important;
      align-items: stretch !important;
    }

    body .fdocThumb {
      width: 82px !important;
      height: 108px !important;
      border-radius: 11px !important;
      background: linear-gradient(180deg, rgba(255,255,255,.065), rgba(255,255,255,.025)) !important;
      border: 1px solid rgba(255,255,255,.16) !important;
      color: #d9d0c2 !important;
      box-shadow: inset 0 0 0 1px rgba(0,0,0,.76), 0 8px 15px rgba(0,0,0,.24) !important;
      font-size: 11px !important;
      line-height: 1.15 !important;
      padding: 6px !important;
    }

    body .fdocThumb.empty {
      background: linear-gradient(180deg, #17191b, #101113) !important;
      color: #bcb3a5 !important;
    }

    body .fdocControls {
      display: grid !important;
      gap: 8px !important;
      min-width: 0 !important;
    }

    body .fdocUploads,
    body .fdocMeta,
    body #finalDocAdd .fdocUploads,
    body #finalDocAdd .fdocMeta {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) minmax(0, 1fr) !important;
      gap: 8px !important;
      align-items: stretch !important;
    }

    body .fdocUploads label,
    body .fdocSwitch,
    body .fdocExpiry,
    body #finalDocAdd .fdocUploads label,
    body #finalDocAdd .fdocSwitch,
    body #finalDocAdd .fdocExpiry {
      height: 46px !important;
      min-height: 46px !important;
      border-radius: 11px !important;
      background: linear-gradient(180deg, #181a1c, #101113) !important;
      border: 1px solid rgba(255,255,255,.12) !important;
      color: var(--ref-white) !important;
      box-shadow: inset 0 1px 0 rgba(255,255,255,.035) !important;
      box-sizing: border-box !important;
      padding: 7px 10px !important;
      font-size: 13px !important;
      font-weight: 720 !important;
    }

    body .fdocUploads label {
      display: flex !important;
      align-items: center !important;
      justify-content: center !important;
      gap: 8px !important;
      white-space: nowrap !important;
    }

    body .fdocUploads input {
      position: absolute !important;
      opacity: 0 !important;
      width: 1px !important;
      height: 1px !important;
      pointer-events: none !important;
    }

    body .fdocSwitch {
      display: flex !important;
      align-items: center !important;
      justify-content: space-between !important;
      gap: 8px !important;
      text-align: left !important;
    }

    body .fdocSwitchText,
    body .fdocExpiry > span:first-child {
      color: var(--ref-white) !important;
      font-size: 13px !important;
      font-weight: 680 !important;
      white-space: nowrap !important;
    }

    body .fdocSwitch input {
      position: absolute !important;
      opacity: 0 !important;
    }

    body .fdocSwitchTrack {
      flex: 0 0 auto !important;
      width: 40px !important;
      height: 22px !important;
      border-radius: 999px !important;
      background: #242526 !important;
      border: 1px solid rgba(255,255,255,.10) !important;
      box-shadow: inset 0 1px 3px rgba(0,0,0,.55) !important;
      position: relative !important;
    }

    body .fdocSwitchTrack::after {
      content: '' !important;
      position: absolute !important;
      width: 18px !important;
      height: 18px !important;
      left: 2px !important;
      top: 2px !important;
      border-radius: 50% !important;
      background: #8b8b8b !important;
      transition: left .15s ease, background .15s ease !important;
    }

    body .fdocSwitch input:checked + .fdocSwitchTrack {
      background: rgba(210,161,67,.25) !important;
    }

    body .fdocSwitch input:checked + .fdocSwitchTrack::after {
      left: 20px !important;
      background: var(--ref-gold-bright) !important;
      box-shadow: 0 0 12px rgba(242,184,76,.40) !important;
    }

    body .fdocExpiry {
      display: grid !important;
      grid-template-columns: auto minmax(0, 1fr) !important;
      align-items: center !important;
      gap: 7px !important;
      text-align: left !important;
    }

    body .fdocDateInputWrap {
      min-width: 0 !important;
      display: flex !important;
      align-items: center !important;
      gap: 6px !important;
    }

    body .fdocDateInputWrap svg,
    body .fdocUploads svg {
      width: 19px !important;
      height: 19px !important;
      flex: 0 0 auto !important;
    }

    body .fdocExpiry input {
      width: 100% !important;
      min-width: 0 !important;
      height: 28px !important;
      min-height: 28px !important;
      border: 0 !important;
      padding: 0 !important;
      background: transparent !important;
      color: var(--ref-white) !important;
      font-size: 12.5px !important;
    }

    body .fdocFull {
      width: 100% !important;
      height: auto !important;
      border-radius: 18px !important;
      background: white !important;
    }

    @media (max-width: 430px) {
      body .fdocBar {
        grid-template-columns: 34px minmax(0,1fr) auto 22px !important;
        min-height: 58px !important;
        padding: 7px 9px !important;
        gap: 8px !important;
      }

      body .fdocIcon {
        width: 30px !important;
        height: 30px !important;
      }

      body .fdocIcon svg {
        width: 17px !important;
        height: 17px !important;
      }

      body .fdocName strong {
        font-size: 14px !important;
      }

      body .fdocName em {
        font-size: 11.5px !important;
      }

      body .fdocBadge {
        font-size: 10.5px !important;
        padding: 5px 7px !important;
      }

      body .fdocDate {
        display: none !important;
      }

      body .fdocPanel {
        padding: 8px 9px 10px !important;
      }

      body .fdocInstruction {
        font-size: 12px !important;
        margin-bottom: 8px !important;
      }

      body .fdocBody {
        grid-template-columns: 70px minmax(0,1fr) !important;
        gap: 8px !important;
      }

      body .fdocThumb {
        width: 66px !important;
        height: 86px !important;
        font-size: 10px !important;
      }

      body .fdocUploads,
      body .fdocMeta,
      body #finalDocAdd .fdocUploads,
      body #finalDocAdd .fdocMeta {
        grid-template-columns: minmax(0,1fr) minmax(0,1fr) !important;
        gap: 7px !important;
      }

      body .fdocUploads label,
      body .fdocSwitch,
      body .fdocExpiry,
      body #finalDocAdd .fdocUploads label,
      body #finalDocAdd .fdocSwitch,
      body #finalDocAdd .fdocExpiry {
        height: 38px !important;
        min-height: 38px !important;
        padding: 5px 7px !important;
        font-size: 11px !important;
        border-radius: 10px !important;
      }

      body .fdocSwitchText,
      body .fdocExpiry > span:first-child {
        font-size: 11px !important;
        white-space: nowrap !important;
      }

      body .fdocSwitchTrack {
        width: 34px !important;
        height: 20px !important;
      }

      body .fdocSwitchTrack::after {
        width: 16px !important;
        height: 16px !important;
      }

      body .fdocSwitch input:checked + .fdocSwitchTrack::after {
        left: 16px !important;
      }

      body .fdocDateInputWrap svg,
      body .fdocUploads svg {
        width: 16px !important;
        height: 16px !important;
      }

      body .fdocExpiry input {
        font-size: 11px !important;
        height: 24px !important;
        min-height: 24px !important;
      }
    }
  `;

  const style = document.createElement('style');
  style.id = 'document-reference-fidelity-final-style';
  style.textContent = css;
  document.head.appendChild(style);
})();
