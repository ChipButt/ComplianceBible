// Validation layer for duplicate sections, duplicate nicknames, and overlapping shifts.
(function(){
  function norm(value){ return String(value || '').trim().toLowerCase(); }
  function minutes(time){ const [h,m] = String(time || '00:00').split(':').map(Number); return (h || 0) * 60 + (m || 0); }
  function range(start,end){ let s=minutes(start), e=minutes(end); if(e<=s) e+=1440; return [s,e]; }
  function overlaps(aStart,aEnd,bStart,bEnd){ const a=range(aStart,aEnd), b=range(bStart,bEnd); return a[0] < b[1] && b[0] < a[1]; }
  function duplicateSectionName(name){ return (state.sections || []).some(section => norm(section) === norm(name)); }
  function duplicateNickname(nickname, ignoreUserId){ return (state.users || []).some(user => user.id !== ignoreUserId && norm(user.nickname) === norm(nickname)); }
  function findShiftOverlap(shift, ignoreShiftId){
    return (state.shifts || []).find(existing =>
      existing.id !== ignoreShiftId &&
      existing.userId === shift.userId &&
      existing.userId !== 'unassigned' &&
      existing.date === shift.date &&
      overlaps(existing.start, existing.end, shift.start, shift.end)
    );
  }
  function alertOverlap(conflict){
    alert(`This user is already scheduled ${conflict.start}–${conflict.end} in ${conflict.section}. A user cannot work in two sections at the same time.`);
  }

  const originalAddSection = window.addSection || addSection;
  window.addSection = function(event){
    if(event) event.preventDefault();
    const input = document.getElementById('newSectionName');
    const name = input ? input.value.trim() : '';
    if(!name) return;
    if(duplicateSectionName(name)) return alert('There is already a Section with that name.');
    return originalAddSection(event);
  };
  if(typeof addSection !== 'undefined') addSection = window.addSection;

  const originalSaveShift = window.saveShift || saveShift;
  window.saveShift = function(event){
    if(event) event.preventDefault();
    const shift = {
      userId: document.getElementById('shiftUser')?.value,
      section: document.getElementById('shiftSection')?.value,
      date: document.getElementById('shiftDate')?.value,
      start: document.getElementById('shiftStart')?.value,
      end: document.getElementById('shiftEnd')?.value
    };
    const conflict = findShiftOverlap(shift, null);
    if(conflict) return alertOverlap(conflict);
    return originalSaveShift(event);
  };
  if(typeof saveShift !== 'undefined') saveShift = window.saveShift;

  const originalSaveShiftModal = window.saveShiftModal || saveShiftModal;
  window.saveShiftModal = function(event, shiftId){
    if(event) event.preventDefault();
    const shift = {
      userId: document.getElementById('modalShiftUser')?.value,
      section: document.getElementById('modalShiftSection')?.value,
      date: document.getElementById('modalShiftDate')?.value,
      start: document.getElementById('modalShiftStart')?.value,
      end: document.getElementById('modalShiftEnd')?.value
    };
    const conflict = findShiftOverlap(shift, shiftId || null);
    if(conflict) return alertOverlap(conflict);
    return originalSaveShiftModal(event, shiftId);
  };
  if(typeof saveShiftModal !== 'undefined') saveShiftModal = window.saveShiftModal;

  const originalSaveProfileEdit = window.saveProfileEdit || saveProfileEdit;
  window.saveProfileEdit = function(event){
    if(event) event.preventDefault();
    const profileUserId = state.profileUserId;
    const nickname = document.getElementById('edit_nickname')?.value?.trim();
    if(nickname && duplicateNickname(nickname, profileUserId)) return alert('There is already a User with that nickname.');
    return originalSaveProfileEdit(event);
  };
  if(typeof saveProfileEdit !== 'undefined') saveProfileEdit = window.saveProfileEdit;

  window.newUser = function(){
    const name = prompt('User name');
    if(!name) return;
    const parts = String(name).trim().split(/\s+/);
    const nickname = parts[0] || '';
    if(duplicateNickname(nickname, null)) return alert('There is already a User with that nickname.');
    const u = makeUser(name);
    state.users.push(u);
    save();
    renderPeople();
  };
  if(typeof newUser !== 'undefined') newUser = window.newUser;
})();
