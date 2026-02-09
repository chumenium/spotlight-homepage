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
          if (!user && window.SpotlightApi) {
            window.SpotlightApi.clearSession();
          }
          syncBackendSession(user);
          if (user && /^(\/(login|signup))(\/|\/index\.html)?$/.test(window.location.pathname)) {
            window.location.href = '/';
          }
        });
        syncBackendSession(auth.currentUser);
      }
    } catch (e) {
      console.warn('Firebase init:', e);
    }
  }

  function updateAuthNav(user, appUser) {
    var el = document.getElementById('auth-nav');
    if (!el) return;
    var p = window.location.pathname;
    var parts = p.split('/').filter(function(x) { return x && x !== 'index.html'; });
    var base = parts.length === 0 ? '' : Array(parts.length + 1).join('../');
    if (user) {
      var name = appUser && appUser.username ? appUser.username : 'ユーザー';
      var icon = appUser && appUser.iconimgpath ? appUser.iconimgpath : null;
      var photo = icon ? '<img src="' + escapeHtml(icon) + '" alt="" class="auth-avatar">' : '';
      var myHref = base + 'mypage/';
      var adminLink = '';
      if (appUser && appUser.admin) {
        adminLink = '<a href="' + base + 'notice-admin/" class="auth-link">管理者</a>';
      }
      el.innerHTML = '<a href="' + myHref + '" class="auth-user">' + photo + '<span class="auth-name">' + escapeHtml(name) + '</span></a>' +
        adminLink +
        '<a href="#" class="auth-link" data-action="logout">ログアウト</a>';
      var logoutBtn = el.querySelector('[data-action="logout"]');
      if (logoutBtn) logoutBtn.addEventListener('click', function(e) { e.preventDefault(); signOut(); });
    } else {
      el.innerHTML = '<a href="' + base + 'login/" class="auth-link">ログイン</a>' +
        '<a href="' + base + 'signup/" class="auth-link auth-link-primary">新規登録</a>';
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

  function getIdToken(forceRefresh) {
    var auth = getAuth();
    if (!auth || !auth.currentUser) return Promise.reject(new Error('No current user'));
    return auth.currentUser.getIdToken(!!forceRefresh);
  }

  function syncBackendSession(user) {
    if (!user) {
      updateAuthNav(null);
      return;
    }
  
    if (!window.SpotlightApi) {
      updateAuthNav(user, null);
      return;
    }
  
    // ★ ここが重要
    var jwt = window.SpotlightApi.getJwt && window.SpotlightApi.getJwt();
  
    var jwtPromise = jwt
      ? Promise.resolve(jwt) // 既存JWTを使う
      : user.getIdToken().then(function(idToken) {
          return window.SpotlightApi.fetchJwt(idToken); // 初回のみ
        });
  
    jwtPromise
      .then(function(jwt) {
        return window.SpotlightApi.fetchUserData(jwt);
      })
      .then(function(appUser) {
        updateAuthNav(user, appUser);
      })
      .catch(function(e) {
        console.warn('Backend sync failed:', e);
        updateAuthNav(user, null);
      });
  }
  

  function getCurrentUser() {
    var auth = getAuth();
    return auth ? auth.currentUser : null;
  }

  window.SpotlightAuth = {
    init: initFirebase,
    signInWithGoogle: signInWithGoogle,
    getIdToken: getIdToken,
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
