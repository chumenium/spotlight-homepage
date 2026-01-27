/**
 * Firebase Authentication（アプリと同一アカウント）
 * - Google でログイン・新規登録
 * - onAuthStateChanged でヘッダーの認証表示を更新
 */
(function() {
  'use strict';

  var firebaseApp = null;
  var firebaseAuth = null;
  var envErrorMessage = null;

  function checkAuthEnvironment() {
    var protocol = window.location.protocol;
    if (!(protocol === 'http:' || protocol === 'https:' || protocol === 'chrome-extension:')) {
      return 'この環境ではFirebase認証を利用できません（http/httpsでアクセスしてください）。';
    }
    try {
      var key = '__storage_test__';
      window.localStorage.setItem(key, '1');
      window.localStorage.removeItem(key);
    } catch (e) {
      return 'Web Storageが無効のため、Firebase認証を利用できません。';
    }
    return null;
  }

  function getAuth() {
    if (!firebaseAuth && typeof firebase !== 'undefined' && firebase.auth) {
      firebaseAuth = firebase.auth();
    }
    return firebaseAuth;
  }

  function initFirebase() {
    if (firebaseApp || !window.SPOTLIGHT_FIREBASE_CONFIG || typeof firebase === 'undefined') return;
    envErrorMessage = checkAuthEnvironment();
    if (envErrorMessage) {
      window.SpotlightAuthEnvError = envErrorMessage;
      updateAuthNav(null);
      return;
    }
    try {
      firebaseApp = firebase.initializeApp(window.SPOTLIGHT_FIREBASE_CONFIG);
      firebaseAuth = firebase.auth();
      var auth = getAuth();
      if (auth) {
        auth.onAuthStateChanged(function(user) {
          updateAuthNav(user);
          if (user && /^\/(login|signup)(\/|\.html)?$/.test(window.location.pathname)) {
            window.location.href = '/';
          }
        });
        updateAuthNav(auth.currentUser);
      }
    } catch (e) {
      console.warn('Firebase init:', e);
    }
  }

  function updateAuthNav(user) {
    var el = document.getElementById('auth-nav');
    if (!el) return;
    var p = window.location.pathname;
    var parts = p.split('/').filter(function(x) { return x && x !== 'index.html'; });
    var base = parts.length === 0 ? '' : Array(parts.length + 1).join('../');
    if (user) {
      var name = user.displayName || user.email || 'ユーザー';
      var photo = user.photoURL ? '<img src="' + escapeHtml(user.photoURL) + '" alt="" class="auth-avatar">' : '';
      el.innerHTML = '<span class="auth-user">' + photo + '<span class="auth-name">' + escapeHtml(name) + '</span></span>' +
        '<a href="#" class="auth-link" data-action="logout">ログアウト</a>';
      var logoutBtn = el.querySelector('[data-action="logout"]');
      if (logoutBtn) logoutBtn.addEventListener('click', function(e) { e.preventDefault(); signOut(); });
    } else {
      el.innerHTML = '<a href="' + base + 'login.html" class="auth-link">ログイン</a>' +
        '<a href="' + base + 'signup.html" class="auth-link auth-link-primary">新規登録</a>';
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  function signOut() {
    var auth = getAuth();
    if (auth) auth.signOut().then(function() { updateAuthNav(null); }).catch(function(e) { console.warn(e); });
  }

  function signInWithGoogle() {
    if (envErrorMessage) return Promise.reject(new Error(envErrorMessage));
    var auth = getAuth();
    if (!auth) return Promise.reject(new Error('Auth not ready'));
    var provider = new firebase.auth.GoogleAuthProvider();
    return auth.signInWithPopup(provider);
  }

  function getCurrentUser() {
    var auth = getAuth();
    return auth ? auth.currentUser : null;
  }

  // グローバルに公開
  window.SpotlightAuth = {
    init: initFirebase,
    signInWithGoogle: signInWithGoogle,
    signOut: signOut,
    getCurrentUser: getCurrentUser,
    getAuth: getAuth
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initFirebase);
  } else {
    initFirebase();
  }
})();
