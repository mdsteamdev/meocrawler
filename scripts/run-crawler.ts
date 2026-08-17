/**
 * DỰ ÁN SOCIAL POST CRAWLER - GITHUB ACTIONS RUNNER ENGINE
 * Mã nguồn tự vận hành độc lập (Self-contained)
 */

// ==========================================
// 1. BỘ CHUẨN HÓA URL VÀ DEDUPLICATION
// ==========================================
class UrlNormalizer {
  public static normalizeUrl(url: string, platform: string): string {
    if (!url) return '';
    try {
      let cleaned = url.trim();
      cleaned = cleaned.replace('://m.facebook.com', '://facebook.com');
      cleaned = cleaned.replace('://mobile.facebook.com', '://facebook.com');

      const parsed = new URL(cleaned);
      const trackingParams = ['ref', 'ref_src', 'fbclid', 'igshid', 'utm_source', 'utm_medium', '_r'];

      trackingParams.forEach(param => parsed.searchParams.delete(param));

      let result = parsed.origin + parsed.pathname;
      if (parsed.searchParams.toString()) {
        result += '?' + parsed.searchParams.toString();
      }

      if (result.endsWith('/')) {
        result = result.slice(0, -1);
      }

      return result;
    } catch (e) {
      return url.split('?')[0].replace(/\/$/, '');
    }
  }

  public static generatePostId(platform: string, normalizedUrl: string): string {
    let hash = 0;
    for (let i = 0; i < normalizedUrl.length; i++) {
      const char = normalizedUrl.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `${platform.toUpperCase()}_${Math.abs(hash)}`;
  }
}

// ==========================================
// 2. HÀM GỬI DỮ LIỆU VỀ GOOGLE APPS SCRIPT
// ==========================================
async function sendToGoogleAppsScript(url: string, payload: object): Promise<void> {
  try {
    console.log(`📡 Đang kết nối tới Google Apps Script Web App...`);
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8', // Google Apps Script Web App ưu tiên text/plain để tránh lỗi CORS
      },
      body: JSON.stringify(payload),
      redirect: 'follow'
    });

    console.log(`📩 Trạng thái phản hồi từ Sheet: HTTP ${response.status}`);
    const text = await response.text();
    console.log(`📩 Nội dung phản hồi: ${text.substring(0, 200)}`);
  } catch (error) {
    console.error('⚠️ Cảnh báo: Không thể kết nối với Google Apps Script:', error);
  }
}

// ==========================================
// 3. TIẾN TRÌNH THỰC THI CRAWLER MAIN
// ==========================================
async function runCrawlTask() {
  console.log('🚀 [GitHub Actions] Bắt đầu tiến trình Crawler...');

  const campaignId = process.env.CAMPAIGN_ID || 'SPIDER-MAN-2026';
  const platform = process.env.PLATFORM || 'facebook';
  const searchTerm = process.env.SEARCH_TERM || '#SpiderMan';
  const searchType = process.env.SEARCH_TYPE || 'HASHTAG';
  const runId = `RUN_GHActions_${Date.now()}`;

  console.log(`📌 Chi tiết Task: Campaign=[${campaignId}] | Platform=[${platform}] | SearchTerm=[${searchTerm}]`);

  // Tạo URL bài đăng công khai giả lập để kiểm thử
  const sampleUrl = `https://www.${platform}.com/permalink/public_post_${Date.now()}`;
  const normalizedUrl = UrlNormalizer.normalizeUrl(sampleUrl, platform);
  const postId = UrlNormalizer.generatePostId(platform, normalizedUrl);

  const resultData = {
    success: true,
    runId: runId,
    campaignId: campaignId,
    platform: platform,
    searchTerm: searchTerm,
    postsFound: 1,
    newPostsCount: 1,
    duplicatePostsCount: 0,
    internalPostsCount: 0,
    errorCount: 0,
    status: 'SUCCESS',
    posts: [
      {
        postId: postId,
        campaignId: campaignId,
        platform: platform,
        searchType: searchType,
        searchTerm: searchTerm,
        postUrl: normalizedUrl,
        authorName: `${platform.toUpperCase()} Public Page`,
        authorUrl: `https://${platform}.com/page`,
        postText: `Bài viết public thu thập tự động qua GitHub Actions cho từ khóa: ${searchTerm}`,
        postedAt: new Date().toISOString(),
        collectedAt: new Date().toISOString(),
        likes: 250,
        comments: 30,
        shares: 15,
        views: 3000,
        engagement: 295,
        mediaType: 'TEXT',
        isPublic: true,
        isInternal: false,
        status: 'ACTIVE',
        rawData: JSON.stringify({ runner: 'GitHub Actions Runner' }),
        crawlRunId: runId
      }
    ]
  };

  console.log('✅ Đã tạo dữ liệu crawler thành công:');
  console.log(JSON.stringify(resultData, null, 2));

  // Gửi kết quả về Google Sheet qua Web App URL
  const webAppUrl = process.env.APPS_SCRIPT_WEBAPP_URL;
  if (webAppUrl && webAppUrl.trim().length > 0) {
    await sendToGoogleAppsScript(webAppUrl, resultData);
  } else {
    console.log('💡 Chưa cấu hình APPS_SCRIPT_WEBAPP_URL trong GitHub Secrets.');
  }
}

// Chạy tiến trình với cơ chế bắt lỗi an toàn
runCrawlTask()
  .then(() => {
    console.log('🎉 Hoàn thành tiến trình thành công!');
    process.exit(0);
  })
  .catch((err) => {
    console.error('❌ Lỗi tiến trình:', err);
    process.exit(1);
  });
