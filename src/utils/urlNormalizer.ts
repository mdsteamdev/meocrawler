import { PlatformType } from '../models/types';

export class UrlNormalizer {
  /**
   * Loại bỏ tham số theo dõi (tracking params) và chuẩn hóa URL bài viết
   */
  public static normalizeUrl(url: string, platform: PlatformType): string {
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

  /**
   * Tạo Post ID duy nhất phục vụ việc Deduplication
   */
  public static generatePostId(platform: PlatformType, normalizedUrl: string, extractedId?: string | null): string {
    if (extractedId && extractedId.trim().length > 0) {
      return `${platform.toUpperCase()}_${extractedId.trim()}`;
    }
    
    let hash = 0;
    for (let i = 0; i < normalizedUrl.length; i++) {
      const char = normalizedUrl.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash |= 0;
    }
    return `${platform.toUpperCase()}_${Math.abs(hash)}`;
  }
}
