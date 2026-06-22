(function compliancePushNotifications() {
  if (window.__compliancePushNotificationsV1) return;
  window.__compliancePushNotificationsV1 = true;

  var PUSH_SETTINGS_KEY = 'complianceBible.pushSettings.v1';
  var NOTIFICATION_RULES_KEY = 'complianceBible.notificationRules.v1';
  var NAVIGATION_KEY = 'complianceBible.navigation.v1';
  var VALID_ROUTES = ['dashboard', 'checks', 'documents', 'logs', 'rota', 'inspection', 'settings'];

  function readJSON(key, fallback) {
    try {
      var parsed = JSON.parse(localStorage.getItem(key) || 'null');
      return parsed && typeof parsed === 'object' ? parsed : fallback;
    } catch (_) {
      return fallback;
    }
  }

  function writeJSON(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch (_) {}
  }

  function appState() {
    try {
      if (typeof state !== 'undefined') return state;
    } catch (_) {}
    return {};
  }

  function userList() {
    var s = appState();
    return Array.isArray(s.users) ? s.users : [];
  }

  function currentUserId() {
    var s = appState();
    return String(s.currentUser || s.currentUserId || '');
  }

  function currentUserSummary() {
    var id = currentUserId();
    var user = userList().filter(function findUser(item) { return String(item.id) === id; })[0] || {};
    return {
      id: id || user.id || '',
      name: user.name || user.nickname || '',
      nickname: user.nickname || '',
      email: user.email || '',
      role: user.role || user.permissionSetId || ''
    };
  }

  function notificationRules() {
    var localRules = readJSON(NOTIFICATION_RULES_KEY, {});
    var s = appState();
    var stateRules = s.notificationRules && typeof s.notificationRules === 'object' ? s.notificationRules : {};
    var merged = {};
    Object.keys(localRules).forEach(function copyLocal(key) { merged[key] = localRules[key]; });
    Object.keys(stateRules).forEach(function copyState(key) { merged[key] = stateRules[key]; });
    return merged;
  }

  function settings() {
    var stored = readJSON(PUSH_SETTINGS_KEY, {});
    var rules = notificationRules();
    return {
      apiBase: String(rules.pushApiBase || stored.apiBase || '').trim(),
      vapidPublicKey: String(rules.pushVapidPublicKey || stored.vapidPublicKey || '').trim(),
      enabled: rules.pushEnabled !== false && stored.enabled !== false,
      subscription: stored.subscription || null,
      subscribedAt: stored.subscribedAt || ''
    };
  }

  function persistSettings(update) {
    var stored = readJSON(PUSH_SETTINGS_KEY, {});
    Object.keys(update).forEach(function setStored(key) { stored[key] = update[key]; });
    writeJSON(PUSH_SETTINGS_KEY, stored);

    var rules = notificationRules();
    if (Object.prototype.hasOwnProperty.call(update, 'apiBase')) rules.pushApiBase = update.apiBase;
    if (Object.prototype.hasOwnProperty.call(update, 'vapidPublicKey')) rules.pushVapidPublicKey = update.vapidPublicKey;
    if (Object.prototype.hasOwnProperty.call(update, 'enabled')) rules.pushEnabled = update.enabled;
    writeJSON(NOTIFICATION_RULES_KEY, rules);

    try {
      if (typeof state !== 'undefined') {
        state.notificationRules = Object.assign({}, state.notificationRules || {}, rules);
        if (typeof save === 'function') save();
      }
    } catch (_) {}
  }

  function supportStatus() {
    var status = {
      serviceWorker: 'serviceWorker' in navigator,
      pushManager: 'PushManager' in window,
      notifications: 'Notification' in window,
      permission: 'Notification' in window ? Notification.permission : 'unsupported',
      subscribed: !!settings().subscription,
      serverReady: !!(settings().apiBase && settings().vapidPublicKey)
    };
    status.supported = status.serviceWorker && status.pushManager && status.notifications;
    return status;
  }

  function urlBase64ToUint8Array(base64String) {
    var padding = '='.repeat((4 - base64String.length % 4) % 4);
    var base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    var rawData = atob(base64);
    var outputArray = new Uint8Array(rawData.length);
    for (var i = 0; i < rawData.length; i += 1) outputArray[i] = rawData.charCodeAt(i);
    return outputArray;
  }

  function normaliseApiBase(value) {
    return String(value || '').trim().replace(/\/+$/, '');
  }

  function readyRegistration() {
    if (!('serviceWorker' in navigator)) return Promise.reject(new Error('Service workers are not supported on this device.'));
    return navigator.serviceWorker.register('./sw.js').then(function registered() {
      return navigator.serviceWorker.ready;
    });
  }

  function postToPushServer(path, payload) {
    var current = settings();
    var apiBase = normaliseApiBase(current.apiBase);
    if (!apiBase) {
      return Promise.resolve({ ok: false, skipped: true, reason: 'missing_push_api_base' });
    }
    return fetch(apiBase + '/' + path.replace(/^\/+/, ''), {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    }).then(function parseResponse(response) {
      return response.text().then(function readText(text) {
        var body = text;
        try { body = text ? JSON.parse(text) : null; } catch (_) {}
        return { ok: response.ok, status: response.status, body: body };
      });
    }).catch(function serverError(error) {
      return { ok: false, error: error && error.message || String(error) };
    });
  }

  function subscribeCurrentDevice(options) {
    options = options || {};
    if (Object.prototype.hasOwnProperty.call(options, 'apiBase')) persistSettings({ apiBase: String(options.apiBase || '').trim() });
    if (Object.prototype.hasOwnProperty.call(options, 'vapidPublicKey')) persistSettings({ vapidPublicKey: String(options.vapidPublicKey || '').trim() });
    if (Object.prototype.hasOwnProperty.call(options, 'enabled')) persistSettings({ enabled: options.enabled !== false });

    var current = settings();
    var support = supportStatus();
    if (!support.supported) return Promise.resolve({ ok: false, reason: 'unsupported' });
    if (!current.vapidPublicKey) return Promise.resolve({ ok: false, reason: 'missing_vapid_public_key' });
    if (current.enabled === false) return Promise.resolve({ ok: false, reason: 'disabled' });

    var permissionPromise = Promise.resolve(Notification.permission);
    if (Notification.permission === 'default') permissionPromise = Notification.requestPermission();

    return permissionPromise.then(function afterPermission(permission) {
      if (permission !== 'granted') return { ok: false, reason: 'permission_' + permission };
      return readyRegistration().then(function withRegistration(registration) {
        return registration.pushManager.getSubscription().then(function withSubscription(existing) {
          if (existing) return existing;
          return registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(current.vapidPublicKey)
          });
        });
      }).then(function subscribed(subscription) {
        var json = subscription.toJSON();
        persistSettings({
          enabled: true,
          subscription: json,
          subscriptionEndpoint: subscription.endpoint,
          subscribedAt: new Date().toISOString()
        });
        return postToPushServer('subscribe', {
          app: 'ComplianceBible',
          user: currentUserSummary(),
          subscription: json,
          subscribedAt: new Date().toISOString()
        }).then(function withServer(server) {
          return { ok: true, subscription: json, server: server };
        });
      });
    }).catch(function subscribeError(error) {
      return { ok: false, reason: error && error.message || String(error) };
    });
  }

  function recipientMapFromShifts(shifts, users) {
    var byId = {};
    (users || []).forEach(function indexUser(user) { if (user && user.id) byId[user.id] = user; });
    var recipients = {};
    (shifts || []).forEach(function addShift(shift) {
      if (!shift || !shift.userId || shift.userId === 'unassigned') return;
      var user = byId[shift.userId] || {};
      if (user.upcomingShiftAlerts === false) return;
      var key = String(shift.userId);
      if (!recipients[key]) {
        recipients[key] = {
          userId: key,
          name: user.name || user.nickname || '',
          nickname: user.nickname || '',
          email: user.email || '',
          shiftCount: 0,
          shifts: []
        };
      }
      recipients[key].shiftCount += 1;
      recipients[key].shifts.push({
        id: shift.id || '',
        date: shift.date || '',
        start: shift.start || '',
        end: shift.end || '',
        section: shift.section || '',
        notes: shift.notes || ''
      });
    });
    return Object.keys(recipients).map(function toRecipient(key) { return recipients[key]; });
  }

  function showLocalNotification(title, body, data) {
    if (!('Notification' in window) || Notification.permission !== 'granted') {
      return Promise.resolve({ ok: false, reason: 'permission_not_granted' });
    }
    return readyRegistration().then(function notify(registration) {
      return registration.showNotification(title, {
        body: body,
        tag: data && data.tag || 'compliance-notification',
        renotify: true,
        data: data || {}
      }).then(function shown() {
        return { ok: true };
      });
    }).catch(function notificationError(error) {
      return { ok: false, reason: error && error.message || String(error) };
    });
  }

  function notifyRotaPublished(event) {
    event = event || {};
    var recipients = recipientMapFromShifts(event.shifts || [], event.users || userList());
    if (!recipients.length) return Promise.resolve({ ok: false, reason: 'no_recipients' });

    var total = recipients.reduce(function count(sum, recipient) { return sum + recipient.shiftCount; }, 0);
    var body = total === 1 ? 'You have a new shift on the rota.' : 'You have new shifts on the rota.';
    var payload = {
      type: 'rota_published',
      title: 'New rota published',
      body: body,
      route: 'rota',
      url: './index.html?route=rota',
      weekStart: event.weekStart || '',
      publishedAt: event.publishedAt || new Date().toISOString(),
      recipients: recipients
    };

    return postToPushServer('notify', payload).then(function afterServer(server) {
      var currentId = currentUserId();
      var shouldNotifyHere = recipients.some(function matchesCurrent(recipient) { return recipient.userId === currentId; });
      if (!shouldNotifyHere) return { ok: !!server.ok, server: server, local: { ok: false, skipped: true } };
      return showLocalNotification(payload.title, payload.body, {
        type: payload.type,
        route: payload.route,
        url: payload.url,
        weekStart: payload.weekStart,
        tag: 'rota-published-' + (payload.weekStart || 'latest')
      }).then(function withLocal(local) {
        return { ok: !!server.ok || !!local.ok, server: server, local: local };
      });
    });
  }

  function applyNotificationRoute() {
    var params;
    try { params = new URL(window.location.href).searchParams; } catch (_) { return; }
    var routeName = params.get('route') || params.get('notificationRoute') || '';
    if (VALID_ROUTES.indexOf(routeName) === -1) return;
    var current = readJSON(NAVIGATION_KEY, {});
    current.route = routeName;
    current.updatedAt = new Date().toISOString();
    writeJSON(NAVIGATION_KEY, current);
    try {
      if (typeof route !== 'undefined') route = routeName;
      if (typeof render === 'function') render();
    } catch (_) {}
  }

  window.CompliancePush = {
    settings: settings,
    supportStatus: supportStatus,
    subscribeCurrentDevice: subscribeCurrentDevice,
    notifyRotaPublished: notifyRotaPublished,
    showLocalNotification: showLocalNotification,
    persistSettings: persistSettings
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', applyNotificationRoute);
  } else {
    applyNotificationRoute();
  }
})();
