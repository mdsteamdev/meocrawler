import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import { CrawlRequest } from './models/types';
import { UrlNormalizer } from './utils/urlNormalizer';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const API_TOKEN = process.env.CRAWLER_API_TOKEN || 'MY_SECURE_TOKEN_2026';

app.post('/crawl', async (req: Request, res: Response) => {
  const token = req.headers['x-api-token'];
  if (token !== API_TOKEN) {
    return res.status(401).json({ success: false, errorMessage: 'Unauthorized: Invalid API Token' });
  }

  const crawlReq: CrawlRequest = req.body;
  const runId = `RUN_${Date.now()}`;

  // Giả lập kết quả crawler thu thập bài viết public thành công
  const sampleNormalizedUrl = UrlNormalizer.normalizeUrl(`https://www.${crawlReq.platform}.com/permalink/sample_post_123`, crawlReq.platform);
  const postId = UrlNormalizer.generatePostId(crawlReq.platform, sampleNormalizedUrl);

  const responseData = {
    success: true,
    runId,
    campaignId: crawlReq.campaignId,
    platform: crawlReq.platform,
    searchTerm: crawlReq.searchTerm,
    postsFound: 1,
    newPostsCount: 1,
    duplicatePostsCount: 0,
    internalPostsCount: 0,
    errorCount: 0,
    status: 'SUCCESS',
    posts: [
      {
        postId: postId,
        campaignId: crawlReq.campaignId,
        platform: crawlReq.platform,
        searchType: crawlReq.searchType,
        searchTerm: crawlReq.searchTerm,
        postUrl: sampleNormalizedUrl,
        authorName: `${crawlReq.platform.toUpperCase()} Public Author`,
        authorUrl: `https://${crawlReq.platform}.com/user`,
        postText: `Nội dung bài viết public thu thập cho keyword: ${crawlReq.searchTerm}`,
        postedAt: new Date().toISOString(),
        collectedAt: new Date().toISOString(),
        likes: 150,
        comments: 45,
        shares: 12,
        views: 1200,
        engagement: 207,
        mediaType: 'TEXT',
        isPublic: true,
        isInternal: false,
        status: 'ACTIVE',
        rawData: JSON.stringify({ source: 'Playwright Engine' }),
        crawlRunId: runId
      }
    ]
  };

  return res.json(responseData);
});

app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 Crawler Service running on port ${PORT}`);
});
