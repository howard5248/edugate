# EduGate - 校園學生放學接送記錄系統

**EduGate** 是一個現代化的校園學生放學接送記錄系統，結合 Cloudflare Pages 與 Cloudflare Workers，提供即時、安全的學生離校記錄服務。學生家長可於校門口掃描學生條碼快速確認，系統將自動記錄時間並支援後台統計與資料管理。

## ✨ 功能特色

- 🔍 **學生資訊查詢** - 快速掃描或輸入學生 ID 查詢學生資訊
- 📝 **接送記錄管理** - 自動記錄接送時間和接送者資訊
- 📊 **後台管理系統** - 完整的接送記錄查詢和篩選功能
- 🕒 **台灣時區支援** - 所有時間顯示為台灣當地時間 (UTC+8)
- 📱 **響應式設計** - 支援各種裝置和螢幕尺寸
- ⚡ **即時更新** - 基於 Cloudflare 的高效能架構
- 🎨 **現代化UI** - 使用統一的色彩主題和現代化設計

## 🎨 設計系統

### 色彩主題
- **主色調深藍綠** (#074f57) - 主要背景色
- **深藍色** (#077187) - 按鈕和重要元素
- **綠色** (#74a57f) - 成功狀態和次要按鈕
- **淺綠色** (#9ece9a) - 高亮和懸停效果
- **米色** (#e4c5af) - 卡片背景和輸入框

### 設計特色
- 漸層背景
- 玻璃擬態效果
- 現代化圓角設計
- 統一的視覺語言
- 直覺的用戶體驗

## 🏗️ 技術架構

### 前端
- **React 18** + **TypeScript** - 現代化的 UI 框架
- **Vite** - 快速的開發構建工具
- **React Router** - 單頁應用路由管理
- **Axios** - HTTP 客戶端
- **現代化 CSS** - 響應式設計與動畫效果

### 後端
- **Cloudflare Workers** - 無伺服器運算平台
- **Hono** - 輕量級 Web 框架
- **Cloudflare D1** - SQLite 兼容的無伺服器數據庫

### 部署
- **Cloudflare Pages** - 前端靜態網站託管
- **Cloudflare Workers** - 後端 API 服務

## 🚀 快速開始

### 環境需求

- Node.js 18+ 
- npm 或 yarn
- Cloudflare 帳號

### 安裝步驟

1. **克隆專案**
   ```bash
   git clone <repository-url>
   cd edugate
   ```

2. **安裝相依套件**
   ```bash
   npm install
   ```

3. **設定 Cloudflare**
   - 登入 Cloudflare 並取得 API Token
   - 設定環境變數 `CLOUDFLARE_API_TOKEN`

4. **初始化資料庫**
   ```bash
   # 創建 D1 資料庫
   npx wrangler d1 create edugate-db
   
   # 應用 migrations
   npx wrangler d1 migrations apply edugate-db --local   # 本地開發
   npx wrangler d1 migrations apply edugate-db --remote  # 生產環境
   ```

5. **啟動開發伺服器**
   ```bash
   npm run dev
   ```

   應用程式將運行在：
   - 前端：http://localhost:5173
   - 後端 API：http://localhost:8787

## 📁 專案結構

```
edugate/
├── frontend/                 # React 前端應用
│   ├── src/
│   │   ├── pages/            # 頁面組件
│   │   │   ├── HomePage.tsx          # 首頁 - 學生ID輸入
│   │   │   ├── StudentInfoPage.tsx   # 學生資訊頁面
│   │   │   └── AdminDashboardPage.tsx # 管理後台
│   │   ├── App.tsx           # 主應用組件
│   │   ├── App.css           # 應用樣式
│   │   ├── index.css         # 全域樣式和色彩主題
│   │   └── main.tsx          # 應用入口點
│   ├── vite.config.ts        # Vite 配置
│   └── package.json
├── worker/                   # Cloudflare Workers 後端
│   ├── src/
│   │   └── index.ts          # API 路由和業務邏輯
│   ├── migrations/           # 資料庫 migrations
│   │   ├── 0001_initial_schema.sql
│   │   └── 0002_add_timezone_support.sql
│   ├── wrangler.toml         # Cloudflare Workers 配置
│   └── tsconfig.json
├── package.json              # 專案根配置
└── README.md
```

## 🛠️ 可用指令

### 開發
```bash
npm run dev              # 同時啟動前後端開發伺服器
npm run dev:frontend     # 僅啟動前端開發伺服器
npm run dev:worker       # 僅啟動後端開發伺服器
```

### 資料庫管理
```bash
# 本地資料庫
npx wrangler d1 migrations apply edugate-db --local
npx wrangler d1 execute edugate-db --local --command "SQL查詢"

# 遠端資料庫  
npx wrangler d1 migrations apply edugate-db --remote
npx wrangler d1 execute edugate-db --remote --command "SQL查詢"
```

### 部署
```bash
npm run deploy          # 部署前後端到 Cloudflare
npm run deploy:frontend # 部署前端到 Cloudflare Pages
npm run deploy:worker   # 部署後端到 Cloudflare Workers
```

## 📊 資料庫結構

### students 表
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | TEXT | 學生證/條碼編號 (主鍵) |
| name | TEXT | 學生姓名 |
| class_name | TEXT | 班級名稱 |
| created_at | TEXT | 建立時間 |

### pickup_records 表
| 欄位 | 類型 | 說明 |
|------|------|------|
| id | INTEGER | 記錄流水號 (主鍵) |
| student_id | TEXT | 學生 ID (外鍵) |
| picked_up_by | TEXT | 接送者 |
| picked_up_at | TEXT | 接送時間 |

## 🔗 API 文檔

### 學生相關
- `GET /api/students/:id` - 查詢學生資訊
- `GET /api/admin/students` - 取得所有學生列表

### 接送記錄
- `POST /api/records` - 創建接送記錄
- `GET /api/records` - 查詢接送記錄
- `GET /api/admin/records` - 管理員查詢接送記錄 (支援篩選)

### 管理功能
- `GET /api/admin/classes` - 取得班級列表
- `GET /api/stats` - 取得接送統計

## 🎯 使用方式

### 一般使用流程
1. 在首頁輸入或掃描學生 ID
2. 確認學生資訊無誤
3. 點擊「確認接送」按鈕
4. 系統自動記錄接送時間

### 管理後台功能
1. 訪問 `/admin` 路由進入管理後台
2. 使用篩選功能查詢特定記錄：
   - 依班級篩選
   - 依學生篩選
   - 依時間區間篩選
3. 查看完整的接送記錄列表

## 🎨 UI/UX 特色

### 現代化設計
- 漸層背景設計
- 卡片式佈局
- 玻璃擬態效果
- 統一的圓角設計

### 用戶體驗
- 直覺的導航系統
- 響應式設計
- 加載狀態提示
- 錯誤處理機制
- 觸覺反饋動畫

### 可訪問性
- 語義化 HTML
- 適當的顏色對比
- 鍵盤導航支援
- 螢幕閱讀器友好

## 📱 響應式設計

系統支援多種裝置：
- 桌面電腦 (>1200px)
- 平板電腦 (768px - 1200px)
- 手機 (<768px)

## 🤝 貢獻指南

1. Fork 本專案
2. 創建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交變更 (`git commit -m 'Add some AmazingFeature'`)
4. 推送分支 (`git push origin feature/AmazingFeature`)
5. 開啟 Pull Request

## 📝 授權條款

本專案採用 ISC 授權條款。詳情請參閱 [LICENSE](LICENSE) 檔案。

## 📞 聯絡資訊

如有任何問題或建議，請透過以下方式聯絡：

- 建立 [Issue](../../issues)
- 發送 Pull Request

---

⭐ 如果這個專案對您有幫助，請給我們一個星星！ 