/* ============================================
   皮斯分享 - JavaScript
   ============================================ */

let articles = [];
let currentCategory = '全部';
let currentSearch = '';

// --- Init ---
document.addEventListener('DOMContentLoaded', () => {
  loadArticles();
  setupMobileMenu();
  applyUrlSearch();
  
  // 判断是否为文章详情页
  if (window.location.pathname.includes('article.html')) {
    loadArticleDetail();
  }
});

// --- URL Search Params ---
function applyUrlSearch() {
  const params = new URLSearchParams(window.location.search);
  const q = params.get('q');
  if (q && !window.location.pathname.includes('article.html')) {
    const input = document.getElementById('searchInput');
    if (input) input.value = q;
    currentSearch = q;
    renderArticles();
  }
}

// --- Mobile Menu ---
function setupMobileMenu() {
  const btn = document.querySelector('.mobile-menu-btn');
  const nav = document.querySelector('.nav-links');
  if (btn && nav) {
    btn.addEventListener('click', () => nav.classList.toggle('open'));
    document.addEventListener('click', (e) => {
      if (!btn.contains(e.target) && !nav.contains(e.target)) {
        nav.classList.remove('open');
      }
    });
  }
}

// --- Load Articles ---
async function loadArticles() {
  try {
    const res = await fetch('data/articles.json');
    articles = await res.json();
    renderAll();
  } catch (err) {
    console.error('加载文章失败:', err);
    const grid = document.getElementById('articleGrid');
    if (grid) {
      grid.innerHTML = `<div class="empty-state"><div class="empty-icon">📭</div><p>暂无内容</p></div>`;
    }
  }
}

// --- Render ---
function renderAll() {
  renderFeatured();
  renderArticles();
}

// --- Featured ---
function renderFeatured() {
  const container = document.getElementById('featuredGrid');
  if (!container) return;

  const featured = articles.filter(a => a.featured);
  if (featured.length === 0) {
    container.style.display = 'none';
    const title = document.querySelector('.section-title-featured');
    if (title) title.style.display = 'none';
    return;
  }

  container.innerHTML = featured.map(a => createFeaturedCard(a)).join('');
  bindCardClicks();
}

function createFeaturedCard(a) {
  return `
    <div class="featured-card" data-id="${a.id}">
      <div class="card-image">
        <img src="${a.image}" alt="${a.title}" loading="lazy">
        ${a.badge ? `<span class="card-badge ${a.badge === '热门' ? 'badge-hot' : 'badge-rec'}">${a.badge}</span>` : ''}
      </div>
      <div class="card-body">
        <h3 class="card-title">${a.title}</h3>
        <p class="card-summary">${a.summary}</p>
        <div class="card-meta">
          <span>📅 ${a.date}</span>
          <span>👁 ${formatViews(a.views)}</span>
        </div>
      </div>
    </div>
  `;
}

// --- Article Cards ---
function renderArticles() {
  const grid = document.getElementById('articleGrid');
  const noResults = document.getElementById('noResults');
  if (!grid) return;

  let filtered = articles;

  if (currentCategory !== '全部') {
    filtered = filtered.filter(a => a.category === currentCategory);
  }

  if (currentSearch) {
    const q = currentSearch.toLowerCase();
    filtered = filtered.filter(a =>
      a.title.toLowerCase().includes(q) ||
      a.summary.toLowerCase().includes(q) ||
      a.tag.toLowerCase().includes(q)
    );
  }

  if (filtered.length === 0) {
    grid.innerHTML = '';
    if (noResults) noResults.classList.add('show');
  } else {
    if (noResults) noResults.classList.remove('show');
    grid.innerHTML = filtered.map(a => createCard(a)).join('');
  }

  bindCardClicks();
}

function createCard(a) {
  return `
    <div class="card" data-id="${a.id}">
      <div class="card-image">
        <img src="${a.image}" alt="${a.title}" loading="lazy">
        ${a.badge ? `<span class="card-badge ${a.badge === '热门' ? 'badge-hot' : 'badge-rec'}">${a.badge}</span>` : ''}
        <span class="card-cat">${a.category}</span>
      </div>
      <div class="card-body">
        <h3 class="card-title">${a.title}</h3>
        <p class="card-summary">${a.summary}</p>
        <div class="card-meta">
          <span>📅 ${a.date}</span>
          <span>👁 ${formatViews(a.views)}</span>
        </div>
      </div>
    </div>
  `;
}

// --- Card Click -> Detail ---
function bindCardClicks() {
  document.querySelectorAll('.card, .featured-card').forEach(el => {
    el.addEventListener('click', function(e) {
      const id = this.dataset.id;
      if (id) {
        window.location.href = `article.html?id=${id}`;
      }
    });
  });
}

// --- Category Filter ---
function filterCategory(cat) {
  currentCategory = cat;
  document.querySelectorAll('.cat-btn').forEach(b => b.classList.remove('active'));
  const btn = document.querySelector(`.cat-btn[onclick*="${cat}"]`);
  if (btn) btn.classList.add('active');
  renderArticles();
}

// --- Search ---
function doSearch() {
  const input = document.getElementById('searchInput');
  currentSearch = input ? input.value.trim() : '';
  renderArticles();
}

// --- Utilities ---
function formatViews(n) {
  if (n >= 10000) return (n / 10000).toFixed(1) + 'W';
  if (n >= 1000) return (n / 1000).toFixed(1) + 'K';
  return n.toString();
}

// --- Article Detail ---
async function loadArticleDetail() {
  const params = new URLSearchParams(window.location.search);
  const id = parseInt(params.get('id'));

  if (!id) {
    document.getElementById('detailContent').innerHTML = '<p style="text-align:center;padding:60px;color:#9ca3af;">文章未找到</p>';
    return;
  }

  try {
    const res = await fetch('data/articles.json');
    articles = await res.json();
    const article = articles.find(a => a.id === id);

    if (!article) {
      document.getElementById('detailContent').innerHTML = '<p style="text-align:center;padding:60px;color:#9ca3af;">文章未找到</p>';
      return;
    }

    document.title = article.title + ' - 皮斯分享';
    renderDetail(article);
  } catch (err) {
    console.error('加载文章详情失败:', err);
  }
}

function renderDetail(a) {
  const container = document.getElementById('detailContent');
  container.innerHTML = `
    <a href="index.html" class="back-link">← 返回首页</a>
    <div class="article-hero">
      <img src="${a.image}" alt="${a.title}" class="article-hero-image" loading="lazy">
      <div class="article-hero-body">
        <h1>${a.title}</h1>
        <div class="article-tags">
          <span class="article-tag">${a.category}</span>
          <span class="article-tag">${a.tag}</span>
          ${a.badge ? `<span class="article-tag" style="background:#fef2f2;color:#ef4444;">${a.badge}</span>` : ''}
        </div>
        <div class="article-info-bar">
          <span>📅 ${a.date}</span>
          <span>👁 ${formatViews(a.views)} 次阅读</span>
          <span>📱 ${a.category}平台</span>
        </div>
      </div>
    </div>

    <div class="article-content">
      <h2>软件简介</h2>
      <p>${a.summary}</p>
      <p>此版本为去广告/解锁/绿化特别版，去除所有不必要的权限和广告组件，让你享受纯净的使用体验。软件已通过安全检测，请放心下载使用。</p>

      <h2>软件信息</h2>
      <table class="info-table">
        <tr><td>软件名称</td><td>${a.title.split(' v')[0] || a.title}</td></tr>
        <tr><td>软件版本</td><td>${extractVersion(a.title)}</td></tr>
        <tr><td>适用平台</td><td>${a.category}</td></tr>
        <tr><td>软件分类</td><td>${a.tag}</td></tr>
        <tr><td>更新时间</td><td>${a.date}</td></tr>
      </table>

      <h2>使用说明</h2>
      <p>1. 下载安装包后直接安装即可使用</p>
      <p>2. 如遇安装提示安全风险，请选择「仍要安装」或「信任此应用」</p>
      <p>3. 部分机型首次打开可能会闪退，重新打开即可正常使用</p>
      <p>4. 建议关闭应用的自动更新，避免被官方版本覆盖</p>

      <div class="download-box">
        <h3>下载地址</h3>
        <p>${a.download ? '点击下方按钮进入网盘下载' : '暂无下载链接，请联系作者补充'}</p>
        ${a.download
          ? renderDownloadButtons(a.download)
          : `<button class="btn-download" disabled style="background:#9ca3af;cursor:not-allowed">⛓ 暂无链接</button>`
        }
      </div>
    </div>
  `;
}

function renderDownloadButtons(download) {
  var links = download.split('\n').filter(function(l){return l.trim()});
  if(links.length === 0) return '';

  var serviceIcons = {baidu:'☁', quark:'🚀', uc:'🐿', xunlei:'⚡', lanzou:'📁', aliyun:'☁', '139':'📱', weiyun:'☁'};

  return '<div style="display:flex;flex-wrap:wrap;gap:10px">' +
    links.map(function(link){
      var label = '下载';
      link = link.trim();
      if(/baidu/i.test(link)) label = '百度网盘';
      else if(/quark/i.test(link)) label = '夸克网盘';
      else if(/uc\.cn|drive\.uc/i.test(link)) label = 'UC网盘';
      else if(/xunlei/i.test(link)) label = '迅雷网盘';
      else if(/lanzou/i.test(link)) label = '蓝奏云';
      else if(/aliyun/i.test(link)) label = '阿里云盘';
      else if(/139\.com/i.test(link)) label = '移动云盘';
      else if(/weiyun/i.test(link)) label = '微云';
      return '<a href="'+link+'" target="_blank" rel="noopener noreferrer" class="btn-download" style="font-size:14px">📥 '+label+'</a>';
    }).join('') + '</div>';
}

function extractVersion(title) {
  const match = title.match(/v[\d.]+/);
  return match ? match[0] : '最新版';
}
