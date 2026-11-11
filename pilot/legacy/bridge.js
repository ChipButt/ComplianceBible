(() => {
  const values = new Map();
  const rotaKey = 'rotaAppUnifiedV2';
  const fromHost = window.parent;
  let initialized = false;
  let rotaLoaded = false;

  window.workspaceStorage = {
    getItem(key) {
      return values.get(key) ?? null;
    },
    setItem(key, value) {
      const text = String(value);
      if (text === values.get(key)) return;
      values.set(key, text);
      fromHost.postMessage({type: 'cb:write', key, value: text}, '*');
    }
  };

  window.addEventListener('message', async event => {
    if (event.source !== fromHost || event.data?.type !== 'cb:init' || initialized) return;
    initialized = true;
    for (const [key, value] of Object.entries(event.data.values)) values.set(key, value);
    try {
      for (const path of document.querySelectorAll('[data-workspace-script]')) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = path.dataset.workspaceScript;
          script.onload = resolve;
          script.onerror = () => reject(new Error(script.src));
          document.body.append(script);
        });
      }
      fromHost.postMessage({type: 'cb:loaded'}, '*');
    } catch {
      fromHost.postMessage({type: 'cb:failed'}, '*');
    }
  });

  window.addEventListener('message', event => {
    const rotaFrame = document.querySelector('.rotaExactFrame');
    if (!rotaFrame || event.source !== rotaFrame.contentWindow) return;
    if (event.data?.type === 'cb:ready') {
      rotaLoaded = false;
      const value = values.get(rotaKey);
      rotaFrame.contentWindow.postMessage({type: 'cb:init', values: value ? {[rotaKey]: value} : {}}, '*');
    }
    if (event.data?.type === 'cb:loaded') rotaLoaded = true;
    if (event.data?.type === 'cb:write' && event.data.key === rotaKey && typeof event.data.value === 'string') {
      if (rotaLoaded) window.workspaceStorage.setItem(rotaKey, event.data.value);
      else values.set(rotaKey, event.data.value);
    }
  });

  if (window.parent !== window) fromHost.postMessage({type: 'cb:ready'}, '*');
})();
