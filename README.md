# PingTest

分布式网络连通性检测工具。输入 IP 或域名，通过全球和中国的分布式探针测量延迟，在世界地图和中国地图上按区域着色展示。

## 功能

- **全球延迟地图** — 通过 Globalping 探针从 13+ 个国家/地区 ping 目标，按国家着色
- **中国省份延迟地图** — 通过 Boce 探针从 30+ 个中国省份 ping 目标，按省份着色
- **延迟列表** — 所有探针的延迟、丢包率详情
- **探针架构可扩展** — 支持部署自定义 RemoteProbe 到任意 VPS

## 截图

输入目标 IP → 点击 Start Test → 世界地图和中国地图按延迟从绿到红着色，悬停显示延迟数值。

## 技术栈

| 层 | 技术 |
|----|------|
| 前端 | React 18 + TypeScript + Vite + Tailwind CSS |
| 地图 | ECharts 5（世界地图 + 中国省份地图） |
| 后端 | Node.js + Express + TypeScript |
| 分布式探针 | Globalping API（全球）+ Boce API（中国） |
| 本地探针 | 系统 `ping` 命令，支持 Windows/Linux，中文/英文输出 |

## 快速开始

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量
cp .env.example .env
# 编辑 .env，可选填入 BOCE_API_KEY

# 3. 启动后端
npx tsx server/src/index.ts

# 4. 启动前端（新终端）
npx vite client --host

# 5. 打开浏览器
# http://localhost:5173
```

## 环境变量

| 变量 | 必填 | 说明 |
|------|------|------|
| `PORT` | 否 | 后端端口，默认 3001 |
| `SERVER_NAME` | 否 | 本地探针名称 |
| `SERVER_COUNTRY` | 否 | 本地探针所在国家代码 |
| `SERVER_REGION` | 否 | 本地探针所在省份 |
| `SERVER_LAT` / `SERVER_LNG` | 否 | 本地探针经纬度 |
| `BOCE_API_KEY` | 推荐 | Boce API Key，用于中国省份级延迟检测 |

### 获取 Boce API Key（免费）

1. 注册 [boce.com](https://www.boce.com)
2. 完成实名认证（+5000 波点）、绑定邮箱（+1000 波点）、绑定微信（+1000 波点）
3. 在控制台获取 API Key，填入 `.env`

免费波点约 7000+，每次中国全境检测消耗约 30 波点，可测 200+ 次。

## API 端点

| 方法 | 路径 | 说明 |
|------|------|------|
| POST | `/api/ping` | 执行分布式 ping 测试 |
| GET | `/api/probes` | 列出已注册探针 |
| GET | `/api/config` | 服务器配置信息 |
| GET | `/api/health` | 健康检查 |

### POST /api/ping

```json
// 请求
{ "target": "8.8.8.8", "count": 4, "timeout": 3000 }

// 可选：跳过远程探针
{ "target": "8.8.8.8", "noGlobalping": true, "noBoce": true }
```

## 添加自定义 RemoteProbe

在任意 VPS 上运行探针代理，然后在主服务器 `.env` 中配置：

```
REMOTE_PROBES=jp-tokyo;http://your-vps:3001;139.65;35.68;JP;Tokyo;AWS
```

探针会自动注册并参与每次 ping 测试。

## 项目结构

```
PingTest/
├── shared/src/          # 共享类型和常量
│   ├── types.ts
│   ├── constants.ts
│   └── utils.ts
├── server/src/          # Express 后端
│   ├── index.ts
│   ├── config.ts
│   ├── routes/          # API 路由
│   ├── services/        # Ping 执行器、Globalping、Boce 集成
│   ├── probes/          # 探针抽象（本地/远程）
│   └── utils/           # Ping 输出解析器
└── client/src/          # React 前端
    ├── App.tsx
    ├── api/client.ts    # API 客户端
    ├── pages/           # 页面组件
    ├── components/      # UI 组件（地图、结果列表等）
    └── hooks/           # React Hooks
```

## License

MIT
