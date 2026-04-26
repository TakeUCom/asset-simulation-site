import { EDUCATION_PATTERN_DEFAULTS } from "./educationCostDefaults";

/**
 * 教育費パターンの年額マスタ。
 *
 * 値そのものは `educationCostDefaults.ts` に分離し、
 * UIやシミュレーションはこの定数を参照する。
 */
export const EDUCATION_PATTERNS = EDUCATION_PATTERN_DEFAULTS;

export const MOCK_SCENARIOS = [
  {
    id: 1,
    name: "子ども2人_投資あり",
    createdAt: "2026-04-15",
    updatedAt: "2026-04-22",
    children: 2,
    investment: true,
    finalAsset: 52000000,
    educationPeak: 2400000,
    status: "attention",
    hasDeficit: false
  },
  {
    id: 2,
    name: "子ども2人_貯蓄のみ",
    createdAt: "2026-04-18",
    updatedAt: "2026-04-21",
    children: 2,
    investment: false,
    finalAsset: 30000000,
    educationPeak: 2400000,
    status: "review",
    hasDeficit: false
  },
  {
    id: 3,
    name: "子ども3人_投資あり",
    createdAt: "2026-04-20",
    updatedAt: "2026-04-22",
    children: 3,
    investment: true,
    finalAsset: 38000000,
    educationPeak: 3600000,
    status: "review",
    hasDeficit: true
  },
  {
    id: 4,
    name: "子ども1人_積極投資",
    createdAt: "2026-04-10",
    updatedAt: "2026-04-12",
    children: 1,
    investment: true,
    finalAsset: 68000000,
    educationPeak: 1200000,
    status: "safe",
    hasDeficit: false
  }
] as const;

export const SCENARIO_TEMPLATES = [
  {
    name: "子ども1人 + 投資",
    children: 1,
    investment: true,
    desc: "教育費負担が軽く、投資で資産形成",
    finalAsset: "約6,800万円"
  },
  {
    name: "子ども2人 + 投資",
    children: 2,
    investment: true,
    desc: "標準的な家族構成で投資を活用",
    finalAsset: "約5,200万円"
  },
  {
    name: "子ども2人（貯蓄のみ）",
    children: 2,
    investment: false,
    desc: "投資リスクを避けて堅実に貯蓄",
    finalAsset: "約3,000万円"
  },
  {
    name: "子ども3人 + 投資",
    children: 3,
    investment: true,
    desc: "教育費負担大、計画的な資金管理",
    finalAsset: "約3,800万円"
  }
] as const;

export const ANNUAL_INCOME_CATEGORIES = [
  { value: "housing-tax-credit", label: "住宅ローン減税" },
  { value: "tax-refund", label: "確定申告還付" },
  { value: "tax-saving", label: "節税効果" },
  { value: "dividend", label: "配当金" },
  { value: "subsidy", label: "補助金/給付金" },
  { value: "other", label: "その他" }
] as const;
