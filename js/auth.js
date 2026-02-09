// /**
//  * Firebase Authentication（アプリと同一アカウント）
//  * - Google でログイン・新規登録
//  * - onAuthStateChanged でヘッダーの認証表示を更新
//  */
// (function() {
//   'use strict';

//   var firebaseApp = null;
//   var firebaseAuth = null;
//   var envErrorMessage = null;

//   function checkAuthEnvironment() {
//     var protocol = window.location.protocol;
//     if (!(protocol === 'http:' || protocol === 'https:' || protocol === 'chrome-extension:')) {
//       return 'この環境ではFirebase認証を利用できません（http/httpsでアクセスしてください）。';
//     }
//     try {
//       var key = '__storage_test__';
//       window.localStorage.setItem(key, '1');
//       window.localStorage.removeItem(key);
//     } catch (e) {
//       return 'Web Storageが無効のため、Firebase認証を利用できません。';
//     }
//     return null;
//   }

//   function getAuth() {
//     if (!firebaseAuth && typeof firebase !== 'undefined' && firebase.auth) {
//       firebaseAuth = firebase.auth();
//     }
//     return firebaseAuth;
//   }

//   function initFirebase() {
//     if (firebaseApp || !window.SPOTLIGHT_FIREBASE_CONFIG || typeof firebase === 'undefined') return;
//     envErrorMessage = checkAuthEnvironment();
//     if (envErrorMessage) {
//       window.SpotlightAuthEnvError = envErrorMessage;
//       updateAuthNav(null);
//       return;
//     }
//     try {
//       firebaseApp = firebase.initializeApp(window.SPOTLIGHT_FIREBASE_CONFIG);
//       firebaseAuth = firebase.auth();
//       var auth = getAuth();
//       if (auth) {
//         auth.onAuthStateChanged(function(user) {
//           if (!user && window.SpotlightApi) {
//             window.SpotlightApi.clearSession();
//           }
//           syncBackendSession(user);
//           if (user && /^(\/(login|signup))(\/|\/index\.html)?$/.test(window.location.pathname)) {
//             window.location.href = '/';
//           }
//         });
//         syncBackendSession(auth.currentUser);
//       }
//     } catch (e) {
//       console.warn('Firebase init:', e);
//     }
//   }

//   function updateAuthNav(user, appUser) {
//     var el = document.getElementById('auth-nav');
//     if (!el) return;
//     var p = window.location.pathname;
//     var parts = p.split('/').filter(function(x) { return x && x !== 'index.html'; });
//     var base = parts.length === 0 ? '' : Array(parts.length + 1).join('../');
//     if (user) {
//       var name = appUser && appUser.username ? appUser.username : 'ユーザー';
//       var icon = appUser && appUser.iconimgpath ? appUser.iconimgpath : null;
//       var photo = icon ? '<img src="' + escapeHtml(icon) + '" alt="" class="auth-avatar">' : '';
//       var myHref = base + 'mypage/';
//       var adminLink = '';
//       if (appUser && appUser.admin) {
//         adminLink = '<a href="' + base + 'notice-admin/" class="auth-link">管理者</a>';
//       }
//       el.innerHTML = '<a href="' + myHref + '" class="auth-user">' + photo + '<span class="auth-name">' + escapeHtml(name) + '</span></a>' +
//         adminLink +
//         '<a href="#" class="auth-link" data-action="logout">ログアウト</a>';
//       var logoutBtn = el.querySelector('[data-action="logout"]');
//       if (logoutBtn) logoutBtn.addEventListener('click', function(e) { e.preventDefault(); signOut(); });
//     } else {
//       el.innerHTML = '<a href="' + base + 'login/" class="auth-link">ログイン</a>' +
//         '<a href="' + base + 'signup/" class="auth-link auth-link-primary">新規登録</a>';
//     }
//   }

//   function escapeHtml(s) {
//     if (!s) return '';
//     var d = document.createElement('div');
//     d.textContent = s;
//     return d.innerHTML;
//   }

//   function signOut() {
//     var auth = getAuth();
//     if (auth) auth.signOut().then(function() { updateAuthNav(null); }).catch(function(e) { console.warn(e); });
//   }

//   function signInWithGoogle() {
//     if (envErrorMessage) return Promise.reject(new Error(envErrorMessage));
//     var auth = getAuth();
//     if (!auth) return Promise.reject(new Error('Auth not ready'));
//     var provider = new firebase.auth.GoogleAuthProvider();
//     return auth.signInWithPopup(provider);
//   }

//   function getIdToken(forceRefresh) {
//     var auth = getAuth();
//     if (!auth || !auth.currentUser) return Promise.reject(new Error('No current user'));
//     return auth.currentUser.getIdToken(!!forceRefresh);
//   }

//   function syncBackendSession(user) {
//     if (!user) {
//       updateAuthNav(null);
//       return;
//     }
//     if (!window.SpotlightApi || !user.getIdToken) {
//       updateAuthNav(user, null);
//       return;
//     }
//     user.getIdToken().then(function(idToken) {
//       return window.SpotlightApi.fetchJwt(idToken);
//     }).then(function(jwt) {
//       return window.SpotlightApi.fetchUserData(jwt);
//     }).then(function(appUser) {
//       updateAuthNav(user, appUser);
//     }).catch(function(e) {
//       console.warn('Backend sync failed:', e);
//       updateAuthNav(user, null);
//     });
//   }

//   function getCurrentUser() {
//     var auth = getAuth();
//     return auth ? auth.currentUser : null;
//   }

//   window.SpotlightAuth = {
//     init: initFirebase,
//     signInWithGoogle: signInWithGoogle,
//     getIdToken: getIdToken,
//     signOut: signOut,
//     getCurrentUser: getCurrentUser,
//     getAuth: getAuth
//   };

//   if (document.readyState === 'loading') {
//     document.addEventListener('DOMContentLoaded', initFirebase);
//   } else {
//     initFirebase();
//   }
// })();


/**
 * Spotlight Backend API client (optimized auth)
 */
(function() {
  'use strict';

  var API_BASE = 'https://api.spotlight-app.click';
  var JWT_KEY = 'spotlight_jwt';
  var USER_KEY = 'spotlight_user';

  /* ===============================
   * JWT utilities
   * =============================== */
  function getJwt() {
    return window.localStorage.getItem(JWT_KEY);
  }

  function setJwt(jwt) {
    if (jwt) {
      window.localStorage.setItem(JWT_KEY, jwt);
    }
  }

  function clearJwt() {
    window.localStorage.removeItem(JWT_KEY);
  }

  function isJwtValid(jwt) {
    try {
      var parts = jwt.split('.');
      if (parts.length !== 3) return false;
      var payload = JSON.parse(atob(parts[1]));
      if (!payload.exp) return false;
      return payload.exp * 1000 > Date.now();
    } catch (e) {
      return false;
    }
  }

  /* ===============================
   * User cache
   * =============================== */
  function getCachedUser() {
    try {
      var raw = window.localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function setCachedUser(user) {
    if (!user) return;
    window.localStorage.setItem(USER_KEY, JSON.stringify(user));
  }

  function clearCachedUser() {
    window.localStorage.removeItem(USER_KEY);
  }

  /* ===============================
   * Helpers
   * =============================== */
  function normalizeIconPath(iconPath) {
    if (!iconPath) return null;
    if (iconPath.indexOf('http://') === 0 || iconPath.indexOf('https://') === 0) return iconPath;
    return API_BASE + iconPath;
  }

  function postJson(path, body, jwt) {
    return fetch(API_BASE + path, {
      method: 'POST',
      headers: Object.assign(
        { 'Content-Type': 'application/json' },
        jwt ? { 'Authorization': 'Bearer ' + jwt } : {}
      ),
      body: JSON.stringify(body || {})
    }).then(function(res) {
      return res.json().then(function(data) {
        return { status: res.status, data: data };
      });
    });
  }

  /* ===============================
   * Auth (optimized)
   * =============================== */

  function fetchJwt(idToken) {
    var existingJwt = getJwt();

    // ★ 有効なJWTがあれば再取得しない
    if (existingJwt && isJwtValid(existingJwt)) {
      return Promise.resolve(existingJwt);
    }

    return postJson('/api/auth/firebase', { id_token: idToken })
      .then(function(res) {
        if (res.status === 200 && res.data && res.data.status === 'success' && res.data.jwt) {
          setJwt(res.data.jwt);
          return res.data.jwt;
        }
        throw new Error(
          (res.data && (res.data.message || res.data.error)) ||
          'JWT取得に失敗しました'
        );
      });
  }

  function fetchUserData(jwt) {
    var cachedUser = getCachedUser();

    // ★ JWTが同一でキャッシュがあるならAPI省略
    if (cachedUser && isJwtValid(jwt)) {
      return Promise.resolve(cachedUser);
    }

    return postJson('/api/users/getusername', {}, jwt)
      .then(function(res) {
        if (res.status === 200 && res.data && res.data.status === 'success' && res.data.data) {
          var user = res.data.data;
          if (user.iconimgpath) user.iconimgpath = normalizeIconPath(user.iconimgpath);
          setCachedUser(user);
          return user;
        }
        throw new Error(res.data && res.data.message || 'ユーザーデータ取得に失敗しました');
      });
  }

  /* ===============================
   * Other APIs (unchanged)
   * =============================== */

  function fetchUserContents(jwt) {
    return postJson('/api/users/getusercontents', {}, jwt)
      .then(function(res) {
        if (res.status === 200 && res.data && res.data.status === 'success') {
          return res.data.data || [];
        }
        throw new Error(res.data && res.data.message || '投稿一覧の取得に失敗しました');
      });
  }

  function deleteContent(jwt, contentID) {
    return postJson('/api/delete/content', { contentID: contentID }, jwt)
      .then(function(res) {
        if (res.status === 200 && res.data && res.data.status === 'success') {
          return true;
        }
        throw new Error(res.data && res.data.message || 'コンテンツ削除に失敗しました');
      });
  }

  function deleteAccount(jwt) {
    return postJson('/api/users/deleteaccount', {}, jwt)
      .then(function(res) {
        if (res.status === 200 && res.data && res.data.status === 'success') {
          clearJwt();
          clearCachedUser();
          return true;
        }
        throw new Error(res.data && res.data.message || 'アカウント削除に失敗しました');
      });
  }

  function clearSession() {
    clearJwt();
    clearCachedUser();
  }

  /* ===============================
   * Export
   * =============================== */
  window.SpotlightApi = {
    apiBase: API_BASE,
    getJwt: getJwt,
    setJwt: setJwt,
    clearJwt: clearJwt,
    getCachedUser: getCachedUser,
    setCachedUser: setCachedUser,
    clearCachedUser: clearCachedUser,
    normalizeIconPath: normalizeIconPath,
    fetchJwt: fetchJwt,
    fetchUserData: fetchUserData,
    fetchUserContents: fetchUserContents,
    deleteContent: deleteContent,
    deleteAccount: deleteAccount,
    clearSession: clearSession
  };
})();