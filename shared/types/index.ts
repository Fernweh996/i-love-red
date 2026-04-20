// 基金基本信息
export interface FundInfo {
  code: string;        // 基金代码，如 "005827"
  name: string;        // 基金名称
  type: string;        // 基金类型
  pinyin: string;      // 拼音缩写
}

// 基金实时估值
export interface FundEstimate {
  code: string;
  name: string;
  estimateNav: number;     // 估算净值
  estimateChange: number;  // 估算涨跌幅 %
  estimateTime: string;    // 估算时间
  lastNav: number;         // 上一日净值
  lastNavDate: string;     // 上一日日期
  navSource: 'estimate' | 'confirmed';  // 数据来源：估算 or 已确认净值
  confirmedNav?: number;   // 官方确认净值
  confirmedChange?: number; // 官方确认涨跌幅 %
  confirmedDate?: string;  // 确认净值日期
}

// 历史净值记录
export interface NavRecord {
  date: string;
  nav: number;             // 单位净值
  accNav: number;          // 累计净值
  changeRate: number;      // 日涨跌幅 %
}

// 持仓股票
export interface HoldingStock {
  code: string;
  name: string;
  proportion: number;      // 持仓占比 %
  shares: number;          // 持有股数(万股)
  marketValue: number;     // 持仓市值(万元)
}

// 实时股价
export interface StockQuote {
  code: string;
  name: string;
  price: number;
  change: number;          // 涨跌额
  changeRate: number;      // 涨跌幅 %
  open: number;
  prevClose: number;
  high: number;
  low: number;
  volume: number;
  amount: number;
}

// 持仓分组
export interface Group {
  id: string;           // 预设用固定 id，自定义用 UUID
  name: string;         // "支付宝基金"
  icon: string;         // emoji "💰"
  order: number;        // 排序序号
  isPreset: boolean;    // 预设分组不可删除
}

// 用户持仓
export interface Position {
  fundCode: string;
  fundName: string;
  fundType?: string;       // 基金类型（混合型、指数型等）
  shares: number;          // 持有份额
  costNav: number;         // 成本净值
  totalCost: number;       // 总投入金额
  createTime: number;      // 创建时间戳
  updateTime: number;      // 最后更新时间戳
  groupId: string;         // 所属分组 ID
}

// 持仓盈亏计算结果
export interface PositionPnL {
  position: Position;
  currentNav: number;        // 当前净值/估值
  marketValue: number;       // 持仓市值
  profit: number;            // 盈亏金额
  profitRate: number;        // 盈亏比例 %
  todayChange: number;       // 今日涨跌额
  todayChangeRate: number;   // 今日涨跌幅 %
  estimate?: FundEstimate;   // 实时估值数据
  weekProfit?: number;       // 本周收益
}

// 截图识别的基金信息
export interface ParsedFund {
  fundCode: string;
  fundName: string;
  shares?: number;
  costNav?: number;
  marketValue?: number;
  confirmed: boolean;        // 用户是否已确认
}

// 自选基金
export interface WatchItem {
  fundCode: string;
  fundName: string;
  fundType?: string;
  addTime: number;
  groupId: string;         // 所属分组 ID
}
