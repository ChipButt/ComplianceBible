// Older screens open and close the shared modal by toggling its hidden class.
const sharedDialog = document.getElementById('modal');
const syncDialog = () => {
  if (sharedDialog.classList.contains('hidden')) {
    if (sharedDialog.open) sharedDialog.close();
    return;
  }
  if (!sharedDialog.open) {
    const heading = sharedDialog.querySelector('h2, h3');
    if (heading) {
      heading.id ||= 'dialog-heading';
      sharedDialog.setAttribute('aria-labelledby', heading.id);
    } else {
      sharedDialog.removeAttribute('aria-labelledby');
    }
    for (const button of sharedDialog.querySelectorAll('button.close')) {
      button.setAttribute('aria-label', 'Close');
    }
    sharedDialog.showModal();
  }
};
new MutationObserver(syncDialog).observe(sharedDialog, {
  attributes: true,
  attributeFilter: ['class'],
  childList: true
});
sharedDialog.addEventListener('close', () => {
  if (!sharedDialog.open) sharedDialog.classList.add('hidden');
});
syncDialog();
