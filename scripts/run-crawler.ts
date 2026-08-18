import { chromium } from 'playwright';

async function sendToGoogleAppsScript(url: string, payload: object): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    console.log(`📩 Phản hồi từ Google Sheet: HTTP ${response.status}`);
  } catch (error) {
    console.error('⚠️ Không thể gửi dữ liệu:', error);
  }
}

async function scrapeRealPosts() {
  const platform = process.env.PLATFORM || 'tiktok';
  const searchTerm = process.env.SEARCH_TERM || '#QuyQuyetCoiVoDinh';
  const campaignId = process.env.CAMPAIGN_ID || 'CAMPAIGN-01';
  
  console.log(`🚀 Bắt đầu cào THẬT nền tảng ${platform} cho từ khóa ${searchTerm}`);
  
  // Khởi động trình duyệt ẩn
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox'] });
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let realPostUrls: string[] = [];
  
  try {
    if (platform === 'tiktok') {
      const tag = searchTerm.replace('#', '');
      await page.goto(`https://www.tiktok.com/tag/${tag}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000); // Đợi load video
      
      // Lấy tất cả link chứa chữ /video/ (link bài post thật)
      const links = await page.$$eval('a', anchors => anchors.map(a => a.href).filter(href => href.includes('/video/')));
      realPostUrls = Array.from(new Set(links)).slice(0, 10);
      
    } else if (platform === 'threads') {
      const query = encodeURIComponent(searchTerm);
      await page.goto(`https://www.threads.net/search?q=${query}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);
      
      // Lấy tất cả link chứa chữ /post/
      const links = await page.$$eval('a', anchors => anchors.map(a => a.href).filter(href => href.includes('/post/')));
      realPostUrls = Array.from(new Set(links)).slice(0, 10);
      
    } else if (platform === 'facebook') {
      const tag = searchTerm.replace('#', '');
      await page.goto(`https://www.facebook.com/hashtag/${tag}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(4000);
      
      // Lấy link chứa /posts/ hoặc /permalink/
      const links = await page.$$eval('a', anchors => anchors.map(a => a.href).filter(href => href.includes('/posts/') || href.includes('/permalink/')));
      realPostUrls = Array.from(new Set(links)).slice(0, 10);
    }
  } catch (err) {
    console.error(`❌ Lỗi khi mở trình duyệt:`, err);
  } finally {
    await browser.close();
  }

  console.log(`✅ Tìm thấy ${realPostUrls.length} bài viết THẬT:`, realPostUrls);

  // Đóng gói dữ liệu gửi về Sheet
  const posts = realPostUrls.map((url, index) => ({
    postId: `${platform.toUpperCase()}_POST_${Date.now()}_${index}`,
    postUrl: url,
  }));

  const resultData = {
    runId: `RUN_${Date.now()}`,
    campaignId,
    platform,
    searchTerm,
    postsFound: posts.length,
    posts: posts
  };

  const webAppUrl = process.env.APPS_SCRIPT_WEBAPP_URL;
  if (webAppUrl && posts.length > 0) {
    await sendToGoogleAppsScript(webAppUrl, resultData);
  }
}

scrapeRealPosts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
