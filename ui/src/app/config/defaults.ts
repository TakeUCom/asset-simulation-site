// プロフィール設定画面の初期値。
// ここで定義する値は、共通プロフィール入力フォームの初期表示に使う。
// 計算結果ではないため、ユーザーが一度保存した後はlocalStorageなどの保存値で上書きする想定。
export const DEFAULT_PROFILE = {
  // 本人の表示名。任意入力のため、計算には直接使わない。
  userName: "太郎",
  // 本人の現在年齢。フォーム入力値に合わせて文字列で保持する。
  userAge: "35",
  // 配偶者の表示名。任意入力のため、計算には直接使わない。
  spouseName: "花子",
  // 配偶者の現在年齢。
  spouseAge: "33",
  // 配偶者有無。"yes"なら配偶者入力欄を表示し、"no"なら単身世帯として扱う。
  hasSpouse: "yes",
  // プロフィール設定時点で既にいる子どもの人数。
  // 将来の子ども人数はシナリオごとの差分なので、ここではなくシナリオ側で持つ。
  currentChildren: "0",
  // 第1子の表示名。currentChildrenが1以上のときだけ入力欄を表示する。
  child1Name: "",
  // 第1子の現在年齢。currentChildrenが1以上のときだけ入力欄を表示する。
  child1Age: "",
  // 第2子の表示名。currentChildrenが2以上のときだけ入力欄を表示する。
  child2Name: "",
  // 第2子の現在年齢。currentChildrenが2以上のときだけ入力欄を表示する。
  child2Age: "",
  // 本人の額面年収。手取り概算コンポーネントの入力値として使う。
  userIncome: "6000000",
  // 配偶者の額面年収。手取り概算コンポーネントの入力値として使う。
  spouseIncome: "3000000",
  // 本人の額面ボーナス年額。手取り概算では年収に加算して扱う。
  userBonus: "1200000",
  // 配偶者の額面ボーナス年額。手取り概算では年収に加算して扱う。
  spouseBonus: "600000"
} as const;

// 子ども費用設定画面の初期値。
// 子どもに関する費用シミュレーションの出発点として使う。
// 実際にはシナリオごとにユーザーが編集できる想定。
export const DEFAULT_CHILD_COSTS = {
  // 第1子のデフォルト進学パターン。
  // referenceData.tsのEDUCATION_PATTERNSに存在するキーを指定する。
  child1Pattern: "public-private-univ",
  // 第2子のデフォルト進学パターン。
  child2Pattern: "public-private-univ",
  // 第1子によって増える年間生活費。食費、衣服、医療、日用品などを想定。
  child1Living: "600000",
  // 第1子にかかる年間イベント・レジャー費。誕生日、旅行、季節イベントなどを想定。
  child1Events: "120000",
  // 第2子の生活費増加率。第1子の生活費増加分に対する割合で指定する。
  // 60の場合、第2子は第1子の生活費増加分の60%を追加費用として扱う。
  child2LivingRate: "60",
  // 第2子のイベント・レジャー費増加率。第1子のイベント費に対する割合で指定する。
  child2EventsRate: "50"
} as const;

// 年額で入力された子ども費用を、総額に換算するための年数。
// 画面表示だけでなく計算結果に直接影響するため、ここに集約して管理する。
export const CHILD_COST_YEARS = {
  // 保育・幼児教育費を計上する年数。
  preschool: 6,
  // 小学校の年数。
  elementary: 6,
  // 中学校の年数。
  juniorHigh: 3,
  // 高校の年数。
  highSchool: 3,
  // 大学の年数。
  university: 4,
  // 塾・習い事を計上する年数。
  // 現時点では小学校から高校までを想定。
  cram: 12,
  // 生活費増加分を計上する年数。
  // 現時点では0歳から大学卒業までを想定。
  living: 22,
  // イベント・レジャー費を計上する年数。
  events: 22
} as const;

// 投資・貯蓄配分画面の初期値。
// ユーザーが編集する前の、余剰資金の配分ルールとして使う。
export const DEFAULT_INVESTMENT = {
  // 投資額の決め方。
  // "fixed"は毎月固定額、"percentage"は月次余剰に対する割合で投資額を決める。
  mode: "fixed",
  // modeが"fixed"のときに使う毎月の投資額。
  fixedAmount: "50000",
  // modeが"percentage"のときに使う、月次余剰に対する投資割合。
  percentage: "40",
  // 長期投資見込みに使う想定年利。
  // シミュレーション上の仮定であり、将来の運用成果を保証するものではない。
  expectedReturn: "5"
} as const;

// アプリ全体で共通利用するシミュレーション設定。
// 画面をまたいで同じ前提を使うため、共通ルールはここに集約する。
export const SIMULATION_SETTINGS = {
  // シミュレーション開始年。
  // 将来的には現在日付、またはシナリオ開始年から自動算出する想定。
  baseYear: 2026,
  // メインシミュレーションで表示・計算する年数。
  projectionYears: 20,
  // 比較画面で同時に選択できるシナリオ数の上限。
  compareMaxScenarios: 3,
  // 旧実装で投資画面のダミー表示に使っていた月次余剰額。
  // 現在は家計入力から算出した実値を使っているため、段階的に廃止予定。
  currentMonthlySurplus: 120000
} as const;
