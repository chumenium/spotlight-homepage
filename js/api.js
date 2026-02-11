/**
 * Spotlight Backend API client
 */
(function() {
  'use strict';

  var API_BASE = 'https://api.spotlight-app.click';
  var JWT_KEY = 'spotlight_jwt';
  var USER_KEY = 'spotlight_user';

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

  function normalizeIconPath(iconPath) {
    if (!iconPath) return null;
    if (iconPath.indexOf('http://') === 0 || iconPath.indexOf('https://') === 0) return iconPath;
    return API_BASE + iconPath;
  }

  function postJson(path, body, jwt) {
    return fetch(API_BASE + path, {
      method: 'POST',
      headers: Object.assign({
        'Content-Type': 'application/json'
      }, jwt ? { 'Authorization': 'Bearer ' + jwt } : {}),
      body: JSON.stringify(body || {})
    }).then(function(res) {
      return res.json().then(function(data) {
        return { status: res.status, data: data };
      });
    });
  }
  
  function fetchJwt(idToken) {
    var existing = getJwt();
    if (existing) {
      return Promise.resolve(existing);
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

  function sendAdminNotification(jwt, payload) {
    return postJson('/api/admin/adminnotification', payload, jwt)
      .then(function(res) {
        if (res.status === 200 && res.data && res.data.status === 'success') {
          return true;
        }
        throw new Error(res.data && res.data.message || '通知送信に失敗しました');
      });
  }

  function fetchAdminUsers(jwt, offset) {
    return postJson('/api/admin/getusersdesclimit10', { offset: offset || 0 }, jwt)
      .then(function(res) {
        if (res.status === 200 && res.data && res.data.status === 'success') {
          var users = res.data.userdatas || [];
          return users.map(function(u) {
            var icon = u.iconimgpath ? normalizeIconPath(u.iconimgpath) : null;
            return Object.assign({}, u, { iconimgpath: icon });
          });
        }
        throw new Error(res.data && res.data.message || 'ユーザー一覧の取得に失敗しました');
      });
  }

  function normalizeContentPath(path) {
    if (!path) return null;
    if (path.indexOf('http://') === 0 || path.indexOf('https://') === 0) return path;
    return API_BASE + path;
  }

  function fetchAdminContents(jwt, offset) {
    var safeOffset = Number(offset) || 0;
    return postJson('/api/admin/getcontentsdesclimit10', { offset: safeOffset, limit: 10 }, jwt)
      .then(function(res) {
        if (res.status === 200 && res.data && res.data.status === 'success') {
          var contents = res.data.contents;
          if (!Array.isArray(contents)) {
            throw new Error('コンテンツ一覧の取得に失敗しました（不正なレスポンス）');
          }
          return contents.map(function(c) {
            return Object.assign({}, c, {
              contentpath: normalizeContentPath(c.contentpath),
              thumbnailpath: normalizeContentPath(c.thumbnailpath)
            });
          });
        }
        throw new Error(res.data && res.data.message || 'コンテンツ一覧の取得に失敗しました');
      });
  }

  function fetchAdminStatistics(jwt) {
    return postJson('/api/admin/statistics', {}, jwt)
      .then(function(res) {
        if (res.status === 200 && res.data && res.data.status === 'success') {
          return {
            total_users: res.data.total_users,
            total_contents: res.data.total_contents
          };
        }
        throw new Error(res.data && res.data.message || '統計情報の取得に失敗しました');
      });
  }

  function getContentComments(jwt, contentID) {
    return postJson('/api/admin/getcontentcomments',
      { contentID: contentID }, jwt)
      .then(function(res) {
        if (res.status === 200 && res.data.status === 'success') {
          return res.data.data;
        }
        throw new Error(res.data.message || 'コメント取得に失敗しました');
      });
  }
  
  function deleteComment(jwt, contentID, commentID) {
    return postJson('/api/delete/comment',
      { contentID: contentID, commentID: commentID }, jwt)
      .then(function(res) {
        if (res.status === 200 && res.data.status === 'success') {
          return true;
        }
        throw new Error(res.data.message || 'コメント削除に失敗しました');
      });
  }

  // 指定コンテンツの通報一覧取得（管理者用）
  function getContentReports(jwt, contentID) {
    return postJson('/api/admin/getcontentreports', { contentID: contentID }, jwt)
    .then(function(res) {
      if (res.status === 200 && res.data && res.data.status === 'success') {
        return res.data.reports;
      }
      throw new Error(res.data && res.data.message || '通報取得に失敗しました');
    })
  }

  

  function clearSession() {
    clearJwt();
    clearCachedUser();
  }

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
    sendAdminNotification: sendAdminNotification,
    fetchAdminUsers: fetchAdminUsers,
    fetchAdminContents: fetchAdminContents,
    fetchAdminStatistics: fetchAdminStatistics,
    clearSession: clearSession,
    getContentComments: getContentComments,
    deleteComment: deleteComment,
    getContentReports: getContentReports
  };
})();



