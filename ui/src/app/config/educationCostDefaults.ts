/**
 * 教育費デフォルト値の参照元メモ。
 *
 * 1. 文部科学省「令和5年度子供の学習費調査」
 * 2. 日本政策金融公庫「教育資金はいくら必要？かかる目安額をご紹介」
 *
 * 現在のUIは年額入力を前提としているため、
 * 学校区分ごとの総額目安を在学年数で割った年額へ変換して保持する。
 */
export const EDUCATION_DEFAULT_SOURCE_NOTE = {
  mext: "文部科学省 令和5年度子供の学習費調査",
  jfc: "日本政策金融公庫 教育資金はいくら必要？かかる目安額をご紹介"
} as const;

/**
 * 現行アプリで使う教育費パターンの年額マスタ。
 *
 * 幼稚園/小学校/中学校/高校/大学は学校区分の総額目安を年額換算し、
 * 塾・習い事は公立寄り/私立寄りで段階的に調整している。
 */
export const EDUCATION_PATTERN_DEFAULTS = {
  "all-public": {
    name: "すべて公立中心",
    preschool: 158000,
    elementary: 352000,
    juniorHigh: 539000,
    highSchool: 514000,
    university: 620000,
    cram: 120000
  },
  "public-private-univ": {
    name: "公立中心 + 私立大学",
    preschool: 158000,
    elementary: 352000,
    juniorHigh: 539000,
    highSchool: 514000,
    university: 1173000,
    cram: 180000
  },
  "private-from-high": {
    name: "高校から私立",
    preschool: 158000,
    elementary: 352000,
    juniorHigh: 539000,
    highSchool: 1052000,
    university: 1173000,
    cram: 220000
  },
  "all-private": {
    name: "幼少期から私立",
    preschool: 308000,
    elementary: 1667000,
    juniorHigh: 1435000,
    highSchool: 1052000,
    university: 1173000,
    cram: 280000
  }
} as const;
