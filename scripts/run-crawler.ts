import { chromium } from 'playwright';

// Hàm gửi dữ liệu về Google Sheets
async function sendToGoogleAppsScript(url: string, payload: object): Promise<void> {
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'text/plain;charset=utf-8' },
      body: JSON.stringify(payload),
    });
    console.log(`📩 Phản hồi từ Google Sheet: HTTP ${response.status}`);
  } catch (error) {
    console.error('⚠️ Lỗi kết nối Google Sheet:', error);
  }
}

// Hàm làm sạch URL & Nối URL tuyệt đối cho Threads
function cleanUrl(rawUrl: string, platform: string): string {
  try {
    let fullUrl = rawUrl;
    if (platform === 'threads' && rawUrl.startsWith('/')) {
      fullUrl = `https://www.threads.net${rawUrl}`;
    }

    const urlObj = new URL(fullUrl);
    urlObj.searchParams.delete('__cft__[0]');
    urlObj.searchParams.delete('__tn__');
    urlObj.searchParams.delete('fbclid');
    urlObj.searchParams.delete('e');
    return urlObj.href;
  } catch {
    return rawUrl.split('?')[0];
  }
}

async function scrapeRealPosts() {
  // Lấy chuỗi nền tảng từ GitHub Actions và cắt thành mảng (Array)
  const rawPlatform = process.env.PLATFORM || 'tiktok';
  const platforms = rawPlatform.split(',').map(p => p.trim().toLowerCase());
  
  const searchTerm = process.env.SEARCH_TERM || '#QuyQuyetCoiVoDinh';
  const campaignId = process.env.CAMPAIGN_ID || 'CAMPAIGN-01';
  
  console.log(`🚀 Bắt đầu cào cho từ khóa ${searchTerm} trên các nền tảng: ${platforms.join(', ')}`);
  
  // Khởi động Chromium giả lập
  const browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-setuid-sandbox'] });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    viewport: { width: 1366, height: 768 }
  });
  
  const page = await context.newPage();
  let allPosts: any[] = [];
  
  // Vòng lặp duyệt qua từng nền tảng bạn nhập
  for (const platform of platforms) {
    console.log(`\n👉 ĐANG XỬ LÝ NỀN TẢNG: ${platform.toUpperCase()}`);
    let realPostUrls: string[] = [];

    try {
      if (platform === 'facebook') {
        const tag = searchTerm.replace('#', '');
        await page.goto(`https://www.facebook.com/hashtag/${tag}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        for (let i = 0; i < 3; i++) {
          await page.evaluate(() => window.scrollBy(0, 2000));
          await page.waitForTimeout(3000);
        }
        const links = await page.$$eval('a', anchors => anchors.map(a => a.href));
        const validLinks = links.filter(href => href.includes('/posts/') || href.includes('/photo/') || href.includes('/permalink') || href.includes('/watch/'));
        realPostUrls = Array.from(new Set(validLinks.map(link => cleanUrl(link, 'facebook'))));

      } else if (platform === 'tiktok') {
        const tag = searchTerm.replace('#', '');
        await page.goto(`https://www.tiktok.com/tag/${tag}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('⏳ Đang chờ TikTok load video...');
        await page.waitForTimeout(5000);
        await page.evaluate(() => window.scrollBy(0, 1500));
        await page.waitForTimeout(3000);
        const links = await page.$$eval('a', anchors => anchors.map(a => a.href));
        const validLinks = links.filter(href => href.includes('/video/'));
        realPostUrls = Array.from(new Set(validLinks.map(link => cleanUrl(link, 'tiktok'))));
        
      } else if (platform === 'threads') {
        const query = encodeURIComponent(searchTerm);
        await page.goto(`https://www.threads.net/search?q=${query}`, { waitUntil: 'domcontentloaded', timeout: 60000 });
        console.log('⏳ Đang chờ Threads load bài viết...');
        await page.waitForTimeout(5000);
        await page.evaluate(() => window.scrollBy(0, 1500));
        await page.waitForTimeout(3000);
        const links = await page.$$eval('a', anchors => anchors.map(a => a.getAttribute('href') || a.href));
        const validLinks = links.filter(href => href.includes('/post/'));
        realPostUrls = Array.from(new Set(validLinks.map(link => cleanUrl(link, 'threads'))));
      } else {
        console.log(`⚠️ Bỏ qua nền tảng không hợp lệ: ${platform}`);
      }
    } catch (err) {
      console.error(`❌ Lỗi khi cào ${platform}:`, err);
    }

    // Lấy 20 bài mới nhất mỗi nền tảng
    realPostUrls = realPostUrls.slice(0, 20);
    console.log(`✅ Tìm thấy ${realPostUrls.length} bài viết trên ${platform}:`);
    realPostUrls.forEach((url, i) => console.log(`   ${i + 1}. ${url}`));

    // Đóng gói dữ liệu của nền tảng hiện tại
    const formattedPosts = realPostUrls.map((url, index) => ({
      postId: `${platform.toUpperCase()}_POST_${Date.now()}_${index}`,
      postUrl: url,
      platform: platform, // Bổ sung thông tin platform để phân loại
      authorName: `Tác giả Public trên ${platform}`,
      postText: `Bài viết lấy từ từ khóa: ${searchTerm}`
    }));

    // Gộp vào mảng tổng
    allPosts = allPosts.concat(formattedPosts);
  }

  await browser.close();

  console.log(`\n🎉 TỔNG KẾT: Đã tìm thấy ${allPosts.length} bài viết THẬT từ tất cả các nền tảng.`);

  // Gửi toàn bộ dữ liệu về Sheet trong 1 lần duy nhất
  const resultData = {
    runId: `RUN_${Date.now()}`,
    campaignId,
    platform: rawPlatform, // Lưu lại chuỗi input gốc
    searchTerm,
    postsFound: allPosts.length,
    posts: allPosts
  };

  const webAppUrl = process.env.APPS_SCRIPT_WEBAPP_URL;
  if (webAppUrl && allPosts.length > 0) {
    await sendToGoogleAppsScript(webAppUrl, resultData);
  }
}

// Thực thi tiến trình
scrapeRealPosts()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('❌ Lỗi hệ thống Runner:', err);
    process.exit(1);
  });
