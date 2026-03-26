---
name: recognize-fund
description: 识别基金持仓截图并导入到应用
allowed-tools: Read, Write, Bash, Glob, WebFetch, WebSearch, Agent
---

# 识别基金持仓截图

## 使用方式

```
/recognize-fund /path/to/screenshot.png
```

## 执行步骤

### 第一步：读取截图并识别

使用 Read 工具读取用户提供的截图图片文件（支持 PNG、JPG、WEBP 格式），仔细观察截图中的基金持仓信息。

需要提取的字段：
- `fundName`：基金名称
- `marketValue`：持有金额/市值（数字，去掉逗号）
- `holdingProfit`：持仓收益（数字，注意正负号）

### 第二步：查找基金代码

根据基金名称，通过 WebSearch 搜索每只基金的6位基金代码（如 005827、110011）。
搜索格式：`"基金名称" 基金代码 site:eastmoney.com`

### 第三步：查询最新净值并计算

对每只基金，用 WebFetch 查询最新单位净值。推荐数据源：
- `https://fund.eastmoney.com/{code}.html` — 天天基金网基金页面

然后按以下公式计算份额和成本净值：
```
总成本 = 持有金额 - 持仓收益
份额 = 持有金额 / 最新净值
成本净值 = 总成本 / 份额
```

所有数值保留2位小数（成本净值保留4位小数）。

### 第四步：写入 JSON 文件

将识别结果写入项目中的 `client/public/imported-funds.json`（使用 Glob 工具确认项目根目录），格式如下：

```json
{
  "funds": [
    {
      "fundCode": "005827",
      "fundName": "易方达蓝筹精选混合",
      "shares": 1000.00,
      "costNav": 1.5000,
      "marketValue": 1500.00,
      "confirmed": false
    }
  ],
  "importedAt": "2024-01-01T12:00:00.000Z"
}
```

### 第五步：输出结果

向用户展示识别结果表格（包含基金代码、名称、份额、成本净值、持有金额），并提示：
> ✅ 已识别 N 只基金，结果已写入 imported-funds.json
> 请在浏览器打开导入页面（/import），查看并确认后导入到持仓。

## 注意事项

- 基金代码必须是6位数字，不足6位前面补0
- 金额和份额中的逗号（千位分隔符）要去掉，转为纯数字
- 截图可能来自理财通、支付宝、天天基金等不同平台，注意适配不同排版
- 理财通截图通常显示：基金名称、持有金额、持仓收益、今日收益
- 支付宝截图可能直接显示份额和成本净值
- 如果截图中已有份额和成本净值，直接使用，无需计算
- 如果只有持有金额和持仓收益，必须查询最新净值来反算份额和成本净值
- 如果某个字段实在无法获取或计算，设为 `null`
- 写入 JSON 前先用 Glob 确认 `client/public/` 目录存在
