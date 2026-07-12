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
    const list = document.getElementById('articleList');
    if (list) {
      list.innerHTML = '<div class="empty-state"><div class="empty-icon">📭</div><p>暂无内容</p></div>';
    }
  }
}

// --- Render ---
function renderAll() {
  renderFeatured();
  renderArticles();
  renderSidebar();
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

// --- All Articles (blog style) ---
function renderArticles() {
  const list = document.getElementById('articleList');
  const noResults = document.getElementById('noResults');
  if (!list) return;

  let filtered = articles.slice().sort(function(a, b){ return b.date.localeCompare(a.date); });

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
    list.innerHTML = '';
    if (noResults) noResults.classList.add('show');
  } else {
    if (noResults) noResults.classList.remove('show');
    list.innerHTML = filtered.map(a => createBlogCard(a)).join('');
  }

  bindBlogCardClicks();
}

function createBlogCard(a) {
  var catClass = a.category === '安卓' ? 'blog-cat-android' : a.category === '电脑' ? 'blog-cat-pc' : 'blog-cat-tv';
  return `
    <div class="blog-card" data-id="${a.id}">
      <img class="blog-thumb" src="${a.image}" alt="${a.title}" loading="lazy" onerror="this.src='data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 width=%22200%22 height=%22130%22><rect fill=%22%23f3f4f6%22 width=%22200%22 height=%22130%22/></svg>'">
      <div class="blog-body">
        <div>
          <h3 class="blog-title">${a.title}</h3>
          <p class="blog-summary">${a.summary}</p>
        </div>
        <div class="blog-meta">
          <span class="blog-cat ${catClass}">${a.category}</span>
          ${a.badge ? `<span class="blog-badge" style="background:#fef2f2;color:#ef4444">${a.badge}</span>` : ''}
          <span>📅 ${a.date}</span>
          <span>👁 ${formatViews(a.views)}</span>
        </div>
      </div>
    </div>
  `;
}

function bindBlogCardClicks() {
  document.querySelectorAll('.blog-card').forEach(el => {
    el.addEventListener('click', function() {
      window.location.href = 'article.html?id=' + this.dataset.id;
    });
  });
}

// --- 右侧边栏 ---
function renderSidebar() {
  // 热门文章（按阅读量排序 top 8）
  var hot = articles.slice().sort(function(a, b){ return (b.views||0) - (a.views||0); }).slice(0, 8);
  var hotDiv = document.getElementById('hotArticles');
  if (hotDiv && hot.length > 0) {
    hotDiv.innerHTML = hot.map(function(a, i){
      var rankClass = i === 0 ? 'r1' : i === 1 ? 'r2' : i === 2 ? 'r3' : 'rn';
      return '<div class="hot-item" onclick="window.location.href=\'article.html?id='+a.id+'\'">'
        +'<span class="hot-rank '+rankClass+'">'+(i+1)+'</span>'
        +'<div class="hot-info">'
        +'<div class="hot-title">'+a.title+'</div>'
        +'<div class="hot-meta">👁 '+formatViews(a.views)+' · '+a.category+'</div>'
        +'</div>'
        +'</div>';
    }).join('');
  }

  // 标签云
  var tagCloud = document.getElementById('tagCloud');
  if (tagCloud) {
    var tags = {};
    articles.forEach(function(a){
      if(a.tag){ tags[a.tag] = (tags[a.tag]||0) + 1; }
    });
    var tagArr = Object.keys(tags).sort(function(a, b){ return tags[b] - tags[a]; });
    tagCloud.innerHTML = '<div class="tag-cloud">'
      + tagArr.map(function(t){
        return '<span class="tag-item" onclick="searchByTag(\''+t.replace(/'/g, "\\'")+'\')">'+t+' ('+tags[t]+')</span>';
      }).join('')
      + '</div>';
  }
}

// --- Featured Card Click ---
function bindCardClicks() {
  document.querySelectorAll('.featured-card').forEach(el => {
    el.addEventListener('click', function(e) {
      window.location.href = 'article.html?id=' + this.dataset.id;
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

// --- Search by Tag (from sidebar) ---
function searchByTag(tag) {
  var input = document.getElementById('searchInput');
  if (input) {
    input.value = tag;
    doSearch();
  }
  window.scrollTo(0, 0);
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

      <h2>软件信息</h2>
      <table class="info-table">
        <tr><td>软件名称</td><td>${a.title.split(' v')[0] || a.title}</td></tr>
        <tr><td>软件版本</td><td>${extractVersion(a.title)}</td></tr>
        <tr><td>适用平台</td><td>${a.category}</td></tr>
        <tr><td>软件分类</td><td>${a.tag}</td></tr>
        <tr><td>更新时间</td><td>${a.date}</td></tr>
      </table>

      <div class="download-box">
        <h3>📥 下载方式</h3>
        <p style="font-size:12px;color:var(--t2);margin-bottom:12px">${a.download ? '复制下方链接到浏览器打开，或直接点击按钮跳转' : '暂无下载链接'}</p>
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
