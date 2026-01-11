// パーティクル生成
function createParticles() {
  const particlesContainer = document.getElementById('particles');
  if (!particlesContainer) return;
  
  const particleCount = 50;
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    particle.className = 'particle';
    particle.style.left = Math.random() * 100 + '%';
    particle.style.animationDelay = Math.random() * 15 + 's';
    particle.style.animationDuration = (10 + Math.random() * 10) + 's';
    particlesContainer.appendChild(particle);
  }
}

// スクロールアニメーション
function handleScrollAnimation() {
  const elements = document.querySelectorAll('.fade-in');
  const windowHeight = window.innerHeight;
  
  elements.forEach(element => {
    const elementTop = element.getBoundingClientRect().top;
    
    if (elementTop < windowHeight - 100) {
      element.classList.add('visible');
    }
  });
}

// スムーススクロール
function initSmoothScroll() {
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
      e.preventDefault();
      const target = document.querySelector(this.getAttribute('href'));
      if (target) {
        target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    });
  });
}

// ヘッダーのスクロール効果
function initHeaderScroll() {
  let lastScroll = 0;
  window.addEventListener('scroll', () => {
    const header = document.querySelector('header');
    if (!header) return;
    
    const currentScroll = window.pageYOffset;
    
    if (currentScroll > 100) {
      header.style.background = 'rgba(5, 8, 22, 0.95)';
    } else {
      header.style.background = 'rgba(5, 8, 22, 0.8)';
    }
    
    lastScroll = currentScroll;
  });
}

// アクティブリンクの設定
function setActiveLink() {
  const currentPath = window.location.pathname;
  const links = document.querySelectorAll('.nav-links a');
  
  links.forEach(link => {
    const href = link.getAttribute('href');
    let isActive = false;
    
    // ルートページの場合
    if (currentPath === '/' || currentPath === '/index.html' || currentPath.endsWith('/index.html')) {
      if (href === 'https://spotlight-app.click/' || href === '/' || href === '/index.html') {
        isActive = true;
      }
    } else if (href && currentPath.startsWith(href)) {
      isActive = true;
    }
    
    if (isActive) {
      link.classList.add('active');
    } else {
      link.classList.remove('active');
    }
  });
}

// 現在のページのパスに基づいてベースパスを取得
function getBasePath() {
  const path = window.location.pathname;
  const parts = path.split('/').filter(p => p && p !== 'index.html');
  // ルートページの場合
  if (parts.length === 0) {
    return '';
  }
  // サブディレクトリの場合、1レベル上に戻る
  return '../';
}

// ヘッダーを生成
function loadHeader() {
  const placeholder = document.getElementById('header-placeholder');
  if (!placeholder) return;
  
  const basePath = getBasePath();
  const currentPath = window.location.pathname;
  
  // アクティブページを判定
  const pathParts = currentPath.split('/').filter(p => p);
  const isHome = pathParts.length === 0 || (pathParts.length === 1 && pathParts[0] === 'index.html');
  const isFeatures = currentPath.includes('/features/');
  const isTechStack = currentPath.includes('/tech-stack/');
  const isBadges = currentPath.includes('/badges/');
  const isArchitecture = currentPath.includes('/architecture/');
  
  const homeHref = basePath ? '../' : 'https://spotlight-app.click/';
  const featuresHref = basePath + 'features/';
  const techStackHref = basePath + 'tech-stack/';
  const badgesHref = basePath + 'badges/';
  const architectureHref = basePath + 'architecture/';
  
  const headerHTML = `
    <header>
      <nav>
        <a href="${homeHref}" class="logo">✨ SpotLight</a>
        <ul class="nav-links">
          <li><a href="${homeHref}"${isHome ? ' class="active"' : ''}>ホーム</a></li>
          <li><a href="${featuresHref}"${isFeatures ? ' class="active"' : ''}>機能</a></li>
          <li><a href="${techStackHref}"${isTechStack ? ' class="active"' : ''}>技術スタック</a></li>
          <li><a href="${badgesHref}"${isBadges ? ' class="active"' : ''}>バッジシステム</a></li>
          <li><a href="${architectureHref}"${isArchitecture ? ' class="active"' : ''}>アーキテクチャ</a></li>
        </ul>
      </nav>
    </header>
  `;
  
  placeholder.outerHTML = headerHTML;
}

// フッターを生成
function loadFooter() {
  const placeholder = document.getElementById('footer-placeholder');
  if (!placeholder) return;
  
  const basePath = getBasePath();
  const homeHref = basePath ? '../' : 'https://spotlight-app.click/';
  
  const footerHTML = `
    <footer>
      <div class="footer-links">
        <a href="https://github.com/chumenium/spotlight" target="_blank">フロントエンド</a>
        <a href="https://github.com/chumenium/spotlight-backend" target="_blank">バックエンド</a>
        <a href="${homeHref}">ホーム</a>
        <a href="${basePath}features/">機能一覧</a>
        <a href="${basePath}tech-stack/">技術スタック</a>
        <a href="${basePath}terms/">利用規約</a>
        <a href="${basePath}privacy/">プライバシーポリシー</a>
      </div>
      <div class="footer-text">
        © 2025 SpotLight
      </div>
    </footer>
  `;
  
  placeholder.outerHTML = footerHTML;
}

// 初期化
document.addEventListener('DOMContentLoaded', () => {
  loadHeader();
  loadFooter();
  createParticles();
  handleScrollAnimation();
  initSmoothScroll();
  initHeaderScroll();
  setActiveLink();
  
  window.addEventListener('scroll', handleScrollAnimation);
  window.addEventListener('resize', handleScrollAnimation);
});

