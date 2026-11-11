import {createClient} from '@supabase/supabase-js';

const db = SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null;
const bucket = 'cb-opening-evidence';
const tasks = [
  ['exits', 'Fire exits and escape routes are clear'],
  ['first-aid', 'First aid kit is accessible and stocked'],
  ['public-areas', 'Bar, toilets and public areas are ready'],
  ['equipment', 'Equipment is safe to use']
];

const byId = id => document.getElementById(id);
const form = byId('check-form');
const photo = byId('photo');
const dialog = byId('evidence');
const buttons = [...document.querySelectorAll('[data-view]')];
const timeFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'medium', timeStyle: 'short', timeZone: 'Europe/London'
});
const dateFormat = new Intl.DateTimeFormat('en-GB', {
  dateStyle: 'full', timeZone: 'Europe/London'
});
let user = null;
let records = [];
let today = '';
let previewUrl = '';

let memberships = [];
let site = null;
let upload = null;
let evidenceUrl = '';
let viewerRequest = 0;

function unwrap(result) {
  if (result.error) throw result.error;
  return result.data;
}

function notice(text = '', error = false) {
  const message = byId('message');
  message.textContent = text;
  message.classList.toggle('error', error);
  message.hidden = !text;
}

function show(view, focus = false) {
  for (const name of ['welcome', 'check', 'records']) byId(name).hidden = name !== view;
  for (const button of buttons) {
    if (button.dataset.view === view) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  }
  if (focus) byId('main').focus();
}

function makeTasks(tasks) {
  for (const [value, description] of tasks) {
    const row = document.createElement('label');
    row.className = 'task';
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.name = 'task';
    checkbox.value = value;
    checkbox.required = true;
    row.append(checkbox, description);
    byId('tasks').append(row);
  }
}

function dateLabel(day) {
  return dateFormat.format(new Date(day + 'T12:00:00Z'));
}

function renderRecords() {
  const list = byId('record-list');
  list.replaceChildren();
  if (!records.length) {
    list.textContent = 'There are no opening check records for this premises yet.';
    return;
  }
  for (const record of records) {
    const button = document.createElement('button');
    button.className = 'record';
    const heading = document.createElement('strong');
    heading.textContent = dateLabel(record.business_day);
    const details = document.createElement('span');
    details.textContent = record.actor_name + ' · ' + timeFormat.format(new Date(record.submitted_at));
    button.append(heading, details);
    button.addEventListener('click', () => openRecord(record));
    list.append(button);
  }
}

async function refreshRecords() {
  const selected = site;
  const data = unwrap(await db.from('cb_opening_checks')
    .select('id, business_day, submitted_at, actor_name, notes, evidence_path')
    .eq('premises_id', selected.premises_id).order('submitted_at', {ascending: false}).limit(50));
  if (selected !== site) return;
  records = data;
  today = new Intl.DateTimeFormat('sv-SE', {timeZone: 'Europe/London'}).format(new Date());
  byId('check-context').textContent = site.cb_premises.name + ' · ' + dateLabel(today);
  byId('records-context').textContent = site.cb_premises.name;
  const completed = records.find(record => record.business_day === today);
  const status = byId('check-status');
  status.textContent = completed ? 'Complete' : 'To do';
  status.classList.toggle('complete', Boolean(completed));
  form.hidden = Boolean(completed);
  byId('completed').hidden = !completed;
  byId('show-completed').onclick = completed ? () => openRecord(completed) : null;
  renderRecords();
}

function clearPhoto() {
  if (previewUrl) URL.revokeObjectURL(previewUrl);
  previewUrl = '';
  byId('photo-preview').removeAttribute('src');
  byId('photo-preview').hidden = true;
}

async function openRecord(record) {
  const details = byId('record-details');
  details.replaceChildren();
  for (const [label, value] of [
    ['Premises', site.cb_premises.name], ['Submitted by', record.actor_name],
    ['Submitted at', timeFormat.format(new Date(record.submitted_at))],
    ['Notes', record.notes || 'None']
  ]) {
    const term = document.createElement('dt');
    const description = document.createElement('dd');
    term.textContent = label;
    description.textContent = value;
    details.append(term, description);
  }
  const request = ++viewerRequest;
  byId('original').hidden = true;
  byId('zoom').disabled = true;
  byId('evidence-frame').classList.remove('zoom');
  byId('zoom').setAttribute('aria-pressed', 'false');
  dialog.showModal();
  try {
    const blob = unwrap(await db.storage.from(bucket).download(record.evidence_path));
    if (request !== viewerRequest || !dialog.open) return;
    evidenceUrl = URL.createObjectURL(blob);
    byId('original').href = evidenceUrl;
    byId('original').hidden = false;
    byId('evidence-image').src = evidenceUrl;
    byId('zoom').disabled = false;
  } catch {
    if (request !== viewerRequest) return;
    dialog.close();
    notice('The evidence could not be opened. Try again.', true);
  }
}

async function selectPremises() {
  site = memberships.find(row => row.premises_id === byId('premises').value);
  form.reset();
  clearPhoto();
  upload = null;
  await refreshRecords();
  show(site.role === 'staff' ? 'check' : 'records');
}

async function setUser(account) {
  user = account;
  site = null;
  records = [];
  byId('record-list').replaceChildren();
  byId('account').hidden = !user;
  byId('navigation').hidden = true;
  byId('premises').hidden = true;
  byId('venue').textContent = user?.email || '';
  form.reset();
  clearPhoto();
  upload = null;
  if (!user) {
    show('welcome');
    return;
  }

  memberships = unwrap(await db.from('cb_memberships')
    .select('company_id, premises_id, display_name, role, cb_premises(name)').order('premises_id'));
  if (!memberships.length) {
    show('welcome');
    notice('Your account needs a premises assignment. Contact your administrator.', true);
    return;
  }
  const picker = byId('premises');
  picker.replaceChildren(...memberships.map(row => new Option(row.cb_premises.name, row.premises_id)));
  picker.hidden = false;
  byId('navigation').hidden = false;
  await selectPremises();
}

byId('sign-in').addEventListener('submit', async event => {
  event.preventDefault();
  if (!db) return;
  const button = event.submitter;
  button.disabled = true;
  notice();
  try {
    const data = unwrap(await db.auth.signInWithPassword({
      email: byId('email').value.trim(), password: byId('password').value
    }));
    event.target.reset();
    await setUser(data.user);
  } catch (error) {
    notice(error.message, true);
  } finally {
    button.disabled = false;
  }
});

byId('premises').addEventListener('change', async () => {
  notice();
  try {
    await selectPremises();
  } catch (error) {
    notice(error.message, true);
  }
});

for (const button of buttons) button.addEventListener('click', async () => {
  notice();
  try {
    await refreshRecords();
    show(button.dataset.view, true);
  } catch (error) {
    notice(error.message, true);
  }
});

byId('sign-out').addEventListener('click', async () => {
  try {
    unwrap(await db.auth.signOut());
    notice();
    await setUser(null);
  } catch (error) {
    notice(error.message, true);
  }
});

photo.addEventListener('change', () => {
  clearPhoto();
  upload = null;
  const file = photo.files[0];
  if (!file) return;
  if (file.size > 5 * 1024 * 1024 || !['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
    photo.value = '';
    notice('Choose a JPEG, PNG or WebP photo up to 5 MB.', true);
    return;
  }
  notice();
  previewUrl = URL.createObjectURL(file);
  byId('photo-preview').src = previewUrl;
  byId('photo-preview').hidden = false;
});

form.addEventListener('submit', async event => {
  event.preventDefault();
  const submit = byId('submit');
  submit.disabled = true;
  byId('premises').disabled = true;
  byId('sign-out').disabled = true;
  photo.disabled = true;
  submit.textContent = 'Submitting…';
  notice();
  try {
    const file = photo.files[0];
    upload ??= {id: crypto.randomUUID(), complete: false};
    const path = [site.premises_id, user.id, upload.id].join('/');
    if (!upload.complete) {
      const result = await db.storage.from(bucket).upload(path, file, {contentType: file.type});
      if (result.error) {
        const existing = await db.storage.from(bucket).download(path);
        if (existing.error) throw result.error;
      }
      upload.complete = true;
    }
    const result = await db.from('cb_opening_checks').insert({
      id: upload.id, company_id: site.company_id, premises_id: site.premises_id,
      completed_tasks: new FormData(form).getAll('task'), notes: byId('notes').value.trim()
    });
    if (result.error) {
      if (result.error.code !== '23505') throw result.error;
      await refreshRecords();
      if (!records.some(record => record.id === upload.id)) {
        throw new Error('An opening check already exists for this premises today.');
      }
    }
    form.reset();
    clearPhoto();
    upload = null;
    await refreshRecords();
    notice('Opening check saved.');
    byId('show-completed').focus();
  } catch (error) {
    notice(error.message, true);
  } finally {
    submit.disabled = false;
    byId('premises').disabled = false;
    byId('sign-out').disabled = false;
    photo.disabled = false;
    submit.textContent = 'Submit opening check';
  }
});

byId('zoom').addEventListener('click', () => {
  const zoomed = byId('evidence-frame').classList.toggle('zoom');
  byId('zoom').setAttribute('aria-pressed', String(zoomed));
});

dialog.addEventListener('close', () => {
  viewerRequest++;
  if (evidenceUrl) URL.revokeObjectURL(evidenceUrl);
  evidenceUrl = '';
  byId('evidence-image').removeAttribute('src');
  byId('original').removeAttribute('href');
});

(async () => {
  makeTasks(tasks);
  if (!db) {
    show('welcome');
    byId('sign-in').hidden = true;
    notice('Set up this deployment’s Supabase connection to enable sign-in.');
    return;
  }
  const session = unwrap(await db.auth.getSession()).session;
  await setUser(session?.user ?? null);
})().catch(error => notice(error.message, true));
