import type { SellPutReport } from "@/server/report/types";

export function getFallbackReport(symbol: string): SellPutReport {
  return {
    symbol,
    generatedAtLabel: "2026年3月13日 15:51",
    regionLabel: "广东",
    header: {
      kicker: "本策略仅作为期权量化思路，不作为投资建议。",
      title: `${symbol} 卖出看跌期权 每日报告`,
      dateLine: "2026-03-13 Friday",
      starLine: "★★★★☆"
    },
    summary: {
      actionLabel: "回避",
      lead: "经常会有朋友问，今天适不适合开仓“收租”？",
      context: "尤其是刚接触卖 Put 的朋友，会不小心“上瘾”，而此时风险常常被低估。",
      method: "这个页面把方向、波动率、支撑位和事件风险压缩成一个可重复决策框架。",
      scope: "下面示例以 TQQQ 作为重点研究对象，同时参考 QQQ 的中期趋势。"
    },
    score: {
      total: 25.9,
      starScore: 1,
      vci: 0.247,
      trend: 0,
      support: 16,
      event: 0
    },
    vciItems: [
      { label: "IVR", value: "35.6", progress: 36, weight: 0.36 },
      { label: "VIX", value: "27.3", progress: 39, weight: 0.39 },
      { label: "VVIX", value: "130.2", progress: 17, weight: 0.17 },
      { label: "TS", value: "-0.3", progress: 8, weight: 0.08 }
    ],
    vciConclusion: "0.4-0.6 观望区间",
    market: {
      symbolLabel: symbol,
      symbolLast: 597.26,
      ma120: 612.2,
      distanceToMa120: -2.44,
      trendLabel: "均线下方"
    },
    support: {
      underlyingLast: 46.83,
      keySupport: 43.21,
      keySupportDistance: 7.7,
      commentary: "离支撑仍有缓冲，但趋势偏弱，提前量不宜过大。",
      windows: [
        { label: "20d", low: 45.5, distancePercent: -2.8, fibReference: 56.95 },
        { label: "60d", low: 54.5, distancePercent: -2.8, fibReference: 54.93 },
        { label: "120d", low: 45.17, distancePercent: -3.5, fibReference: 53.29 }
      ],
      fibLevels: [
        { label: "23.6%", price: 56.95, distancePercent: -21.4 },
        { label: "38.2%", price: 54.93, distancePercent: -17.3 },
        { label: "50.0%", price: 53.29, distancePercent: -13.8 },
        { label: "61.8%", price: 51.66, distancePercent: -10.3 }
      ]
    },
    event: {
      name: "FOMC Meeting",
      dateLabel: "03/17",
      countdownLabel: "4 days",
      severity: "事件窗口"
    },
    gradeGuide: [
      { range: ">=80", grade: "5星", meaning: "条件极佳", action: "标准仓位，行权价靠近关键支撑" },
      { range: "65-79", grade: "4星", meaning: "条件良好", action: "标准仓位，行权价适当下移" },
      { range: "50-64", grade: "3星", meaning: "条件一般", action: "缩小仓位或选择更深虚值" },
      { range: "35-49", grade: "2星", meaning: "条件较差", action: "不建议新开仓" },
      { range: "<35", grade: "1星", meaning: "条件恶劣", action: "严格回避" }
    ],
    snapshotRows: [
      {
        dimension: "VCI",
        rawValue: "0.247",
        score: "9.9 / 40",
        status: "IVR 35.6%，期限结构倒挂"
      },
      {
        dimension: "趋势",
        rawValue: "QQQ 低于 MA120 -2.44%",
        score: "0 / 20",
        status: "触发硬性否决"
      },
      {
        dimension: "支撑位",
        rawValue: "更支撑 7.7%",
        score: "16 / 20",
        status: "支撑位 $43.21，缓冲尚可"
      },
      {
        dimension: "宏观",
        rawValue: "FOMC 4 天后",
        score: "0 / 20",
        status: "黑窗日期"
      }
    ],
    documentation: {
      why: [
        "期权卖方策略的收益曲线天然具有高胜率、低赔率的特征，大多数时候赚的是时间价值的衰减，但一旦遇到尾部风险，单笔亏损可能吞没数月利润。",
        "真正的难点不在于判断方向，而在于把开仓时机记录成一套可重复的纪律，让仓位与风险始终在同一框架内。"
      ],
      dimensions: [
        {
          title: "维度一：波动率综合指数 VCI",
          body: "VCI 把 IVR、VIX、VVIX 与期限结构压缩成一个分数，核心问题是：当下的波动率环境，对卖方是否友好？",
          bullets: [
            "IVR 偏高代表隐含波动率在过去一年分位更高，权利金更厚。",
            "VIX 在 15-25 常见为更友好的区间，过低或过高都不理想。",
            "VVIX 反映波动率的波动率，越低说明环境更稳定。",
            "VIX3M 与 VIX 的差值为正更接近平稳结构，倒挂则提示市场在抢近月保护。"
          ]
        },
        {
          title: "维度二：趋势过滤",
          body: "这里使用 QQQ 120 日均线作为中期趋势代理。卖 Put 是做多波动卖方策略的变体，在下行趋势中要先解决方向风险。",
          bullets: [
            "QQQ 收盘在均线上方时，判定为上升趋势。",
            "跌破均线时，系统降低评分，极端情况下直接否决开仓。"
          ]
        },
        {
          title: "维度三：支撑位分析",
          body: "行权价距离支撑越近，意味着被行权后更贴近真实支撑区域，溢价与风险的交换更均衡。",
          bullets: [
            "近 20、60、120 日低点用于识别已经验证的需求区间。",
            "配合回撤位和整数关口，得到更稳健的关键支撑。"
          ]
        },
        {
          title: "维度四：宏观事件日历",
          body: "FOMC、CPI/PPI、科技股财报等事件，会打破原本稳定的波动率假设，卖方不适合在不确定性密集时段冒进。",
          bullets: [
            "重大事件前后若干交易日可视为黑窗。",
            "一旦进入黑窗，评分会自动下调甚至触发回避。"
          ]
        }
      ],
      limitations: [
        "数据层面上，完整版本会接入实时波动率与期权链；当前模板优先演示页面结构和 LongPort 接口接法。",
        "模型权重来自经验规则，适合做日常过滤，不应替代仓位管理和止损纪律。"
      ],
      usage: [
        "把系统输出看成一次开仓前的第一道过滤，而不是唯一依据。",
        "关注趋势和事件两项硬条件，单一指标改善不代表系统性风险消失。",
        "如果结论是“不值得”，空仓等待通常比强行收租更有优势。"
      ]
    }
  };
}
