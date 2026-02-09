// /**
//  * Spotlight Backend API client
//  */
// (function() {
//   'use strict';

//   var API_BASE = 'https://api.spotlight-app.click';
//   var JWT_KEY = 'spotlight_jwt';
//   var USER_KEY = 'spotlight_user';

//   function getJwt() {
//     return window.localStorage.getItem(JWT_KEY);
//   }

//   function setJwt(jwt) {
//     if (jwt) {
//       window.localStorage.setItem(JWT_KEY, jwt);
//     }
//   }

//   function clearJwt() {
//     window.localStorage.removeItem(JWT_KEY);
//   }

//   function getCachedUser() {
//     try {
//       var raw = window.localStorage.getItem(USER_KEY);
//       return raw ? JSON.parse(raw) : null;
//     } catch (e) {
//       return null;
//     }
//   }

//   function setCachedUser(user) {
//     if (!user) return;
//     window.localStorage.setItem(USER_KEY, JSON.stringify(user));
//   }

//   function clearCachedUser() {
//     window.localStorage.removeItem(USER_KEY);
//   }

//   function normalizeIconPath(iconPath) {
//     if (!iconPath) return null;
//     if (iconPath.indexOf('http://') === 0 || iconPath.indexOf('https://') === 0) return iconPath;
//     return API_BASE + iconPath;
//   }

//   function postJson(path, body, jwt) {
//     return fetch(API_BASE + path, {
//       method: 'POST',
//       headers: Object.assign({
//         'Content-Type': 'application/json'
//       }, jwt ? { 'Authorization': 'Bearer ' + jwt } : {}),
//       body: JSON.stringify(body || {})
//     }).then(function(res) {
//       return res.json().then(function(data) {
//         return { status: res.status, data: data };
//       });
//     });
//   }

//   function fetchJwt(idToken) {
//     return postJson('/api/auth/firebase', { id_token: idToken })
//       .then(function(res) {
//         if (res.status === 200 && res.data && res.data.status === 'success' && res.data.jwt) {
//           setJwt(res.data.jwt);
//           return res.data.jwt;
//         }
//         throw new Error(res.data && (res.data.message || res.data.error) || 'JWT取得に失敗しました');
//       });
//   }

//   function fetchUserData(jwt) {
//     return postJson('/api/users/getusername', {}, jwt)
//       .then(function(res) {
//         if (res.status === 200 && res.data && res.data.status === 'success' && res.data.data) {
//           var user = res.data.data;
//           if (user.iconimgpath) user.iconimgpath = normalizeIconPath(user.iconimgpath);
//           setCachedUser(user);
//           return user;
//         }
//         throw new Error(res.data && res.data.message || 'ユーザーデータ取得に失敗しました');
//       });
//   }

//   function fetchUserContents(jwt) {
//     return postJson('/api/users/getusercontents', {}, jwt)
//       .then(function(res) {
//         if (res.status === 200 && res.data && res.data.status === 'success') {
//           return res.data.data || [];
//         }
//         throw new Error(res.data && res.data.message || '投稿一覧の取得に失敗しました');
//       });
//   }

//   function deleteContent(jwt, contentID) {
//     return postJson('/api/delete/content', { contentID: contentID }, jwt)
//       .then(function(res) {
//         if (res.status === 200 && res.data && res.data.status === 'success') {
//           return true;
//         }
//         throw new Error(res.data && res.data.message || 'コンテンツ削除に失敗しました');
//       });
//   }

//   function deleteAccount(jwt) {
//     return postJson('/api/users/deleteaccount', {}, jwt)
//       .then(function(res) {
//         if (res.status === 200 && res.data && res.data.status === 'success') {
//           clearJwt();
//           clearCachedUser();
//           return true;
//         }
//         throw new Error(res.data && res.data.message || 'アカウント削除に失敗しました');
//       });
//   }

//   function sendAdminNotification(jwt, payload) {
//     return postJson('/api/admin/adminnotification', payload, jwt)
//       .then(function(res) {
//         if (res.status === 200 && res.data && res.data.status === 'success') {
//           return true;
//         }
//         throw new Error(res.data && res.data.message || '通知送信に失敗しました');
//       });
//   }

//   function fetchAdminUsers(jwt, offset) {
//     return postJson('/api/admin/getusersdesclimit10', { offset: offset || 0 }, jwt)
//       .then(function(res) {
//         if (res.status === 200 && res.data && res.data.status === 'success') {
//           var users = res.data.userdatas || [];
//           return users.map(function(u) {
//             var icon = u.iconimgpath ? normalizeIconPath(u.iconimgpath) : null;
//             return Object.assign({}, u, { iconimgpath: icon });
//           });
//         }
//         throw new Error(res.data && res.data.message || 'ユーザー一覧の取得に失敗しました');
//       });
//   }

//   function normalizeContentPath(path) {
//     if (!path) return null;
//     if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0) return path;
//     return API_BASE + path;
//   }

//   function fetchAdminContents(jwt, offset) {
//     var safeOffset = Number(offset) || 0;
//     return postJson('/api/admin/getcontentsdesclimit10', { offset: safeOffset, limit: 10 }, jwt)
//       .then(function(res) {
//         if (res.status === 200 && res.data && res.data.status === 'success') {
//           var contents = res.data.contents;
//           if (!Array.isArray(contents)) {
//             throw new Error('コンテンツ一覧の取得に失敗しました（不正なレスポンス）');
//           }
//           return contents.map(function(c) {
//             return Object.assign({}, c, {
//               contentpath: normalizeContentPath(c.contentpath),
//               thumbnailpath: normalizeContentPath(c.thumbnailpath)
//             });
//           });
//         }
//         throw new Error(res.data && res.data.message || 'コンテンツ一覧の取得に失敗しました');
//       });
//   }

//   function fetchAdminStatistics(jwt) {
//     return postJson('/api/admin/statistics', {}, jwt)
//       .then(function(res) {
//         if (res.status === 200 && res.data && res.data.status === 'success') {
//           return {
//             total_users: res.data.total_users,
//             total_contents: res.data.total_contents
//           };
//         }
//         throw new Error(res.data && res.data.message || '統計情報の取得に失敗しました');
//       });
//   }

//   function clearSession() {
//     clearJwt();
//     clearCachedUser();
//   }

//   window.SpotlightApi = {
//     apiBase: API_BASE,
//     getJwt: getJwt,
//     setJwt: setJwt,
//     clearJwt: clearJwt,
//     getCachedUser: getCachedUser,
//     setCachedUser: setCachedUser,
//     clearCachedUser: clearCachedUser,
//     normalizeIconPath: normalizeIconPath,
//     fetchJwt: fetchJwt,
//     fetchUserData: fetchUserData,
//     fetchUserContents: fetchUserContents,
//     deleteContent: deleteContent,
//     deleteAccount: deleteAccount,
//     sendAdminNotification: sendAdminNotification,
//     fetchAdminUsers: fetchAdminUsers,
//     fetchAdminContents: fetchAdminContents,
//     fetchAdminStatistics: fetchAdminStatistics,
//     clearSession: clearSession
//   };
// })();


(function() {
  'use strict';

  var firebaseApp = null;
  var firebaseAuth = null;
  var envErrorMessage = null;

  /* ===============================
   * Auth cache (safe optimization)
   * =============================== */
  var AUTH_CACHE_KEY = '__spotlight_auth_cache__';
  var AUTH_CACHE_TTL = 30 * 60 * 1000; // 30 minutes
  var backendSyncedThisPage = false; // ★重要

  function loadAuthCache() {
    try {
      var raw = localStorage.getItem(AUTH_CACHE_KEY);
      if (!raw) return null;
      var data = JSON.parse(raw);
      if (!data || Date.now() - data.cachedAt > AUTH_CACHE_TTL) return null;
      return data;
    } catch (e) {
      return null;
    }
  }

  function saveAuthCache(uid, idToken, appUser) {
    try {
      localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify({
        uid: uid,
        idToken: idToken,
        appUser: appUser,
        cachedAt: Date.now()
      }));
    } catch (e) {}
  }

  function clearAuthCache() {
    try {
      localStorage.removeItem(AUTH_CACHE_KEY);
    } catch (e) {}
  }

  /* ===============================
   * Environment check
   * =============================== */
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
            clearAuthCache();
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

  /* ===============================
   * UI
   * =============================== */
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

      el.innerHTML =
        '<a href="' + myHref + '" class="auth-user">' +
        photo +
        '<span class="auth-name">' + escapeHtml(name) + '</span>' +
        '</a>' +
        adminLink +
        '<a href="#" class="auth-link" data-action="logout">ログアウト</a>';

      var logoutBtn = el.querySelector('[data-action="logout"]');
      if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
          e.preventDefault();
          signOut();
        });
      }
    } else {
      el.innerHTML =
        '<a href="' + base + 'login/" class="auth-link">ログイン</a>' +
        '<a href="' + base + 'signup/" class="auth-link auth-link-primary">新規登録</a>';
    }
  }

  function escapeHtml(s) {
    if (!s) return '';
    var d = document.createElement('div');
    d.textContent = s;
    return d.innerHTML;
  }

  /* ===============================
   * Auth actions
   * =============================== */
  function signOut() {
    var auth = getAuth();
    clearAuthCache();
    backendSyncedThisPage = false;
    if (auth) {
      auth.signOut()
        .then(function() { updateAuthNav(null); })
        .catch(function(e) { console.warn(e); });
    }
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

  /* ===============================
   * Backend sync (fixed)
   * =============================== */
  function syncBackendSession(user) {
    if (!user) {
      clearAuthCache();
      backendSyncedThisPage = false;
      updateAuthNav(null);
      return;
    }

    var cached = loadAuthCache();

    // ★ このページで既に同期済み & キャッシュ有効ならAPIを叩かない
    if (backendSyncedThisPage && cached && cached.uid === user.uid) {
      updateAuthNav(user, cached.appUser);
      return;
    }

    if (!window.SpotlightApi || !user.getIdToken) {
      updateAuthNav(user, null);
      return;
    }

    user.getIdToken().then(function(idToken) {
      return window.SpotlightApi.fetchJwt(idToken)
        .then(function(jwt) {
          return window.SpotlightApi.fetchUserData(jwt)
            .then(function(appUser) {
              backendSyncedThisPage = true;
              saveAuthCache(user.uid, idToken, appUser);
              updateAuthNav(user, appUser);
            });
        });
    }).catch(function(e) {
      console.warn('Backend sync failed:', e);
      updateAuthNav(user, null);
    });
  }

  function getCurrentUser() {
    var auth = getAuth();
    return auth ? auth.currentUser : null;
  }

  /* ===============================
   * Export
   * =============================== */
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
