import { DEFAULT_PROFILE } from "../config/defaults";
import { MOCK_SCENARIOS } from "../config/referenceData";
import type { Profile, ScenarioSummary } from "../types";

const STORAGE_SCHEMA_VERSION = 2;

const STORAGE_KEYS = {
  profile: "lifeplan.profile",
  scenarios: "lifeplan.scenarios",
  activeScenarioId: "lifeplan.activeScenarioId"
} as const;

/**
 * ブラウザ環境でlocalStorageを利用できるか判定する。
 *
 * Viteのビルド時や将来的なSSR対応時には`window`が存在しない可能性があるため、
 * localStorageへ直接アクセスする前に必ずこの関数を通す。
 */
function canUseLocalStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

/**
 * localStorageからJSONを読み込む共通関数。
 *
 * 保存データが存在しない場合やJSON parseに失敗した場合は、画面を壊さないように
 * 指定されたfallbackを返す。ユーザーが古い保存データを持っているケースもここで吸収する。
 */
function readJson<T>(key: string, fallback: T): T {
  if (!canUseLocalStorage()) return fallback;

  try {
    const rawValue = window.localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) as T : fallback;
  } catch {
    return fallback;
  }
}

/**
 * localStorageへJSON形式で値を書き込む共通関数。
 *
 * APIなしMVPでは、この関数がプロフィールやシナリオの永続化レイヤーになる。
 */
function writeJson<T>(key: string, value: T) {
  if (!canUseLocalStorage()) return;
  window.localStorage.setItem(key, JSON.stringify(value));
}

/**
 * 保存済みの共通プロフィールを読み込む。
 *
 * 未保存の場合は`null`を返し、アプリ側で初回プロフィール設定画面へ誘導する。
 */
export function loadProfile(): Profile | null {
  const rawProfile = readJson<Profile | null>(STORAGE_KEYS.profile, null);
  return rawProfile ? migrateProfile(rawProfile) : null;
}

/**
 * 共通プロフィールをこの端末のブラウザに保存する。
 *
 * 保存後は全シナリオの固定前提として使われる。
 */
export function saveProfile(profile: Profile) {
  writeJson(STORAGE_KEYS.profile, {
    ...migrateProfile(profile),
    version: STORAGE_SCHEMA_VERSION
  });
}

/**
 * プロフィールの初期値を返す。
 *
 * 設定オブジェクトを直接返すと編集時に参照共有の余地があるため、浅いコピーにして返す。
 */
export function getDefaultProfile(): Profile {
  return { ...DEFAULT_PROFILE };
}

/**
 * 保存済みシナリオ一覧を読み込む。
 *
 * 初回起動時は操作イメージを掴みやすいように、デモ用シナリオをfallbackとして返す。
 */
export function loadScenarios(): ScenarioSummary[] {
  const fallbackProfile = loadProfile() ?? getDefaultProfile();
  const rawScenarios = readJson<ScenarioSummary[]>(
    STORAGE_KEYS.scenarios,
    MOCK_SCENARIOS.map((scenario) => ({ ...scenario }))
  );
  return rawScenarios.map((scenario) => migrateScenarioSummary(scenario, fallbackProfile));
}

/**
 * シナリオ一覧をこの端末のブラウザに保存する。
 *
 * 新規保存、編集保存、複製のいずれも最終的にはこの関数を通す。
 */
export function saveScenarios(scenarios: ScenarioSummary[]) {
  const fallbackProfile = loadProfile() ?? getDefaultProfile();
  writeJson(
    STORAGE_KEYS.scenarios,
    scenarios.map((scenario) => ({
      ...migrateScenarioSummary(scenario, fallbackProfile),
      version: STORAGE_SCHEMA_VERSION
    }))
  );
}

/**
 * 最後に編集・保存したシナリオIDを読み込む。
 *
 * 編集途中のシナリオを判別し、結果保存時に新規作成か上書きかを判断するために使う。
 */
export function loadActiveScenarioId(): number | null {
  return readJson<number | null>(STORAGE_KEYS.activeScenarioId, null);
}

/**
 * 編集中シナリオIDを保存する。
 *
 * `null`を渡した場合は、新規作成状態として扱うため保存済みIDを削除する。
 */
export function saveActiveScenarioId(id: number | null) {
  if (!canUseLocalStorage()) return;

  if (id === null) {
    window.localStorage.removeItem(STORAGE_KEYS.activeScenarioId);
    return;
  }

  writeJson(STORAGE_KEYS.activeScenarioId, id);
}

/**
 * 古いプロフィール保存形式を現行スキーマへ補完する。
 *
 * 将来項目が増えても最低限の初期値で読み込めるようにし、localStorage の古いデータで
 * 画面や計算が壊れないようにする。
 */
function migrateProfile(profile: Partial<Profile>): Profile {
  return {
    ...DEFAULT_PROFILE,
    ...profile,
    version: STORAGE_SCHEMA_VERSION,
    child2Name: profile.child2Name ?? DEFAULT_PROFILE.child2Name,
    child2Age: profile.child2Age ?? DEFAULT_PROFILE.child2Age
  };
}

/**
 * 保存済みシナリオを現行スキーマへ補完する。
 *
 * `profileSnapshot` 追加前の古いシナリオでも、読み込み時に現在のプロフィール初期値を補って
 * 結果画面や比較画面の再計算を継続できるようにする。
 */
function migrateScenarioSummary(scenario: ScenarioSummary, fallbackProfile: Profile): ScenarioSummary {
  if (!scenario.inputs) {
    return {
      ...scenario,
      version: STORAGE_SCHEMA_VERSION
    };
  }

  return {
    ...scenario,
    version: STORAGE_SCHEMA_VERSION,
    inputs: {
      ...scenario.inputs,
      profileSnapshot: migrateProfile(scenario.inputs.profileSnapshot ?? fallbackProfile)
    }
  };
}
