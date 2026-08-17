import os
import zipfile

# Define project file structure and raw contents
files = {
    # ------------------------------------------------------------------------
    # CONFIG & ROOT FILES
    # ------------------------------------------------------------------------
    ".env.example": """# Server & API Security Token
CRAWLER_API_TOKEN=your_secure_random_api_token_here
PORT=3000

# Google Sheets API (Optional: If Crawler directly updates Sheet, otherwise Apps Script pulls/receives data)
GOOGLE_SERVICE_ACCOUNT_EMAIL=
GOOGLE_PRIVATE_KEY=

# Crawler Settings
HEADLESS=true
MAX_POSTS_PER_SEARCH=50
MAX_PAGES_PER_SEARCH=5
REQUEST_DELAY_MIN_MS=2000
REQUEST_DELAY_MAX_MS=5000
MAX_RETRIES=3
""",

    "package.json": """{
  "name": "social-post-crawler",
  "version": "1.0.0",
  "description": "Modular social media post crawler for Facebook, TikTok, and Threads using Playwright and Google Apps Script",
  "main": "dist/index.js",
  "scripts": {
    "build": "tsc",
    "start": "node dist/index.js",
    "dev": "ts-node src/index.ts",
    "test": "jest",
    "test:watch": "jest --watch"
  },
  "dependencies": {
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "playwright": "^1.42.1"
  },
  "devDependencies": {
    "@types/express": "^4.17.21",
    "@types/jest": "^29.5.12",
    "@types/node": "^20.11.24",
    "jest": "^29.7.0",
    "ts-jest": "^29.1.2",
    "ts-node": "^10.9.2",
    "typescript": "^5.3.3"
  }
}
""",

    "tsconfig.json": """{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "**/*.test.ts"]
}
""",

    "README.md": """# Social Post Crawler (Facebook, TikTok, Threads)

Hệ thống Social Post Crawler thiết kế theo kiến trúc Modular, kết hợp giữa **Google Apps Script (Google Sheets)** và **Playwright Node.js / TypeScript Crawler**.

---

## 🌟 Kiến trúc Tổng thể

1. **Google Sheets + Apps Script**:
   - Quản lý Campaigns, Keywords, Internal Sources.
   - Quản lý Crawl Queue, Scheduler Trigger.
   - Đóng vai trò làm Database lưu trữ `SOCIAL_POSTS` và `CRAWL_LOGS`.
   - Custom Menu điều khiển trực tiếp trên UI Google Sheets.

2. **Node.js + Playwright Service**:
   - Nhận Job từ Apps Script qua REST API Endpoint (`POST /crawl`).
   - Sử dụng Playwright (Chromium) để tìm kiếm và bóc tách dữ liệu Public.
   - Xử lý Data Normalization, URL Deduplication, Internal Source Filtering.
   - Trả về JSON cho Apps Script hoặc chạy qua GitHub Actions.

---

## 🛠️ Hướng dẫn Thiết lập Google Sheets

### Bước 1: Tạo các Sheet bắt buộc
Tạo một Google Sheet mới và tạo đúng 7 Sheet với tên chính xác sau (hoặc dùng Custom Menu **SOCIAL CRAWLER > Init Spreadsheet Setup**):

1. `CAMPAIGNS`: `Campaign ID | Campaign Name | Start Date | End Date | Status | Crawl Frequency | Platforms | Created At | Last Run | Next Run`
2. `KEYWORDS`: `Keyword ID | Campaign ID | Type | Keyword | Active | Created At`
3. `SOCIAL_POSTS`: `Post ID | Campaign ID | Platform | Search Type | Search Term | Post URL | Author Name | Author URL | Post Text | Posted At | Collected At | Likes | Comments | Shares | Views | Engagement | Media Type | Is Public | Is Internal | Status | Raw Data | Crawl Run ID`
4. `INTERNAL_SOURCES`: `Platform | Author Name | Author URL | Keyword | URL Pattern | Active`
5. `CRAWL_QUEUE`: `Job ID | Campaign ID | Platform | Search Type | Search Term | Status | Created At | Started At | Finished At | Retry Count | Error`
6. `CRAWL_LOGS`: `Run ID | Campaign ID | Platform | Search Term | Started At | Finished At | Found URLs | New Posts | Duplicate Posts | Internal Posts | Error Count | Status | Error Message`
7. `DASHBOARD`: Nơi xem tổng quan metric.

### Bước 2: Cài đặt Apps Script
1. Trông Google Sheets, chọn **Extensions > Apps Script**.
2. Dán mã nguồn từ file `apps-script/Code.gs` vào `Code.gs`.
3. Cập nhật biến `CRAWLER_SERVER_URL` và `API_SECRET_TOKEN` trong script để trỏ tới Crawler Server của bạn.

---

## 🚀 Hướng dẫn Chạy Node.js Crawler (Local / Cloud Server)

### 1. Cài đặt dependencies
```bash
npm install
npx playwright install chromium