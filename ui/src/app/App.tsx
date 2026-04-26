import { lazy, Suspense, useState } from "react";
import { ProfileSetup } from "./components/ProfileSetup";
import { ScenarioList } from "./components/ScenarioList";
import { BasicInfoForm } from "./components/BasicInfoForm";
import { HouseholdForm } from "./components/HouseholdForm";
import { ChildCostForm } from "./components/ChildCostForm";
import { LifeEventForm } from "./components/LifeEventForm";
import { InvestmentForm } from "./components/InvestmentForm";
import {
  loadActiveScenarioId,
  loadProfile,
  loadScenarios,
  saveActiveScenarioId,
  saveProfile,
  saveScenarios
} from "./lib/storage";
import {
  createDefaultScenarioInputs,
  createScenarioInputsFromTemplate,
  createScenarioSummaryFromInputs
} from "./lib/scenario";
import { estimateTakeHome, parseAmount } from "./lib/calculations";
import { calculateSimulation } from "./lib/simulation";
import type {
  BasicInfoInput,
  ChildCostInput,
  HouseholdInput,
  InvestmentInput,
  LifeEvent,
  Profile,
  ScenarioInputs,
  ScenarioSummary,
  YearAdjustment
} from "./types";
import { SCENARIO_TEMPLATES } from "./config/referenceData";

/**
 * グラフライブラリを含む重い画面は遅延読み込みし、初回表示バンドルを抑える。
 *
 * シナリオ入力中は結果画面や比較画面をまだ使わないため、必要になるまでダウンロードしない。
 */
const ResultsScreen = lazy(() =>
  import("./components/ResultsScreen").then((module) => ({
    default: module.ResultsScreen
  }))
);

/**
 * 比較画面も結果画面と同様にグラフ依存が大きいため、別チャンクとして分離する。
 */
const ComparisonScreen = lazy(() =>
  import("./components/ComparisonScreen").then((module) => ({
    default: module.ComparisonScreen
  }))
);

type Screen =
  | "profile"
  | "list"
  | "basic"
  | "household"
  | "childcost"
  | "lifeevent"
  | "investment"
  | "results"
  | "comparison";

/**
 * ライフプランシミュレーション全体の画面遷移と保存状態を管理するルートコンポーネント。
 *
 * APIなしMVPのため、プロフィール・シナリオ一覧・編集中シナリオIDはlocalStorageへ保存する。
 * 入力フォームの値はScenarioInputsとして集約し、結果画面では同じ入力値からシミュレーションを再計算する。
 */
export default function App() {
  // 初期表示時にlocalStorageから前回保存した状態を復元する。
  const [profile, setProfile] = useState<Profile | null>(() => loadProfile());
  const [scenarios, setScenarios] = useState<ScenarioSummary[]>(() => loadScenarios());
  const [activeScenarioId, setActiveScenarioId] = useState<number | null>(() => loadActiveScenarioId());
  const [compareScenarioIds, setCompareScenarioIds] = useState<number[]>([]);
  const [draftInputs, setDraftInputs] = useState<ScenarioInputs>(() => {
    const savedScenarios = loadScenarios();
    const savedActiveScenarioId = loadActiveScenarioId();
    return savedScenarios.find((scenario) => scenario.id === savedActiveScenarioId)?.inputs
      ?? createDefaultScenarioInputs(loadProfile());
  });
  const [currentScreen, setCurrentScreen] = useState<Screen>(() => loadProfile() ? "list" : "profile");

  /**
   * プロフィール設定完了時の処理。
   *
   * 共通プロフィールをlocalStorageへ保存し、以降のシナリオ作成の固定前提として使う。
   */
  const handleProfileComplete = (nextProfile: Profile) => {
    saveProfile(nextProfile);
    setProfile(nextProfile);
    if (activeScenarioId === null) {
      setDraftInputs((current) => ({
        ...current,
        profileSnapshot: { ...nextProfile },
        basic: {
          ...current.basic,
          userAge: nextProfile.userAge,
          spouseAge: nextProfile.spouseAge
        },
        household: {
          ...current.household,
          userIncome: nextProfile.userIncome,
          spouseIncome: nextProfile.spouseIncome,
          userBonus: nextProfile.userBonus,
          spouseBonus: nextProfile.spouseBonus
        }
      }));
    }
    setCurrentScreen("list");
  };

  /**
   * 新規シナリオ作成を開始する。
   *
   * 編集中シナリオIDをクリアし、結果保存時に新規作成として扱えるようにする。
   */
  const handleCreateNew = () => {
    setDraftInputs(createDefaultScenarioInputs(profile));
    setActiveScenarioId(null);
    saveActiveScenarioId(null);
    setCurrentScreen("basic");
  };

  /**
   * テンプレートを反映した新規シナリオ作成を開始する。
   *
   * 一覧モーダル上のテンプレート選択が見た目だけにならないよう、
   * 初期シナリオ名・子ども人数・投資有無をドラフトへ反映してから入力画面へ遷移する。
   */
  const handleCreateFromTemplate = (template: (typeof SCENARIO_TEMPLATES)[number]) => {
    setDraftInputs(createScenarioInputsFromTemplate(template, profile));
    setActiveScenarioId(null);
    saveActiveScenarioId(null);
    setCurrentScreen("basic");
  };

  /**
   * 既存シナリオの編集を開始する。
   *
   * 現在はサマリーIDのみ保持しており、将来的にはこのIDを使って詳細入力値を復元する。
   */
  const handleEdit = (id: number) => {
    const targetScenario = scenarios.find((scenario) => scenario.id === id);
    setDraftInputs(targetScenario?.inputs ?? createDefaultScenarioInputs(profile));
    setActiveScenarioId(id);
    saveActiveScenarioId(id);
    setCurrentScreen("basic");
  };

  /**
   * シナリオ比較画面へ遷移する。
   *
   * 比較対象の選択状態はScenarioList内で管理しているため、ここでは画面遷移のみ行う。
   */
  const handleCompare = (ids: number[]) => {
    setCompareScenarioIds(ids);
    setCurrentScreen("comparison");
  };

  /**
   * 指定されたシナリオを複製する。
   *
   * データはlocalStorage上のシナリオ一覧に即時反映し、一覧画面で確認できるようにする。
   */
  const handleDuplicate = (id: number) => {
    const source = scenarios.find((scenario) => scenario.id === id);
    if (!source) return;

    const now = new Date().toISOString().slice(0, 10);
    const duplicatedScenario: ScenarioSummary = {
      ...source,
      id: Date.now(),
      name: `${source.name}_コピー`,
      createdAt: now,
      updatedAt: now
    };
    const nextScenarios = [duplicatedScenario, ...scenarios];
    setScenarios(nextScenarios);
    saveScenarios(nextScenarios);
  };

  /**
   * 現在編集中のシナリオを、その場で複製して一覧へ保存する。
   *
   * 結果画面から複製したい導線に対応するため、現在のドラフト入力値を新規IDで保存する。
   */
  const handleDuplicateCurrentScenario = () => {
    const duplicatedInputs: ScenarioInputs = {
      ...draftInputs,
      basic: {
        ...draftInputs.basic,
        scenarioName: `${draftInputs.basic.scenarioName || "シナリオ"}_コピー`
      }
    };
    const duplicatedScenario = createScenarioSummaryFromInputs(duplicatedInputs);
    const nextScenarios = [duplicatedScenario, ...scenarios];
    // 複製後にそのまま保存しても複製名が維持されるよう、編集中ドラフトも複製内容へ切り替える。
    setDraftInputs(duplicatedInputs);
    setScenarios(nextScenarios);
    setActiveScenarioId(duplicatedScenario.id);
    saveScenarios(nextScenarios);
    saveActiveScenarioId(duplicatedScenario.id);
    window.alert("シナリオを複製して保存しました。");
  };

  /**
   * 基本情報ステップの入力値を一時シナリオへ反映する。
   */
  const handleBasicNext = (basic: BasicInfoInput) => {
    setDraftInputs((current) => ({ ...current, basic }));
    setCurrentScreen("household");
  };

  /**
   * 基本情報ステップから戻る際も、入力途中の内容をドラフトへ保存する。
   */
  const handleBasicBack = (basic: BasicInfoInput) => {
    setDraftInputs((current) => ({ ...current, basic }));
    setCurrentScreen("list");
  };

  /**
   * 基本情報入力中にプロフィール編集へ進む前に、現在のシナリオ条件をドラフトへ保存する。
   *
   * プロフィール画面から戻ったあとも、シナリオ名や子ども人数の入力途中データが消えないようにする。
   */
  const handleBasicEditProfile = (basic: BasicInfoInput) => {
    setDraftInputs((current) => ({ ...current, basic }));
    setCurrentScreen("profile");
  };

  /**
   * 家計ステップの入力値を一時シナリオへ反映する。
   */
  const handleHouseholdNext = (household: HouseholdInput) => {
    setDraftInputs((current) => ({ ...current, household }));
    setCurrentScreen("childcost");
  };

  /**
   * 家計ステップから戻る際も、入力途中の内容をドラフトへ保存する。
   */
  const handleHouseholdBack = (household: HouseholdInput) => {
    setDraftInputs((current) => ({ ...current, household }));
    setCurrentScreen("basic");
  };

  /**
   * 子ども費用ステップの入力値を一時シナリオへ反映する。
   */
  const handleChildCostNext = (childCost: ChildCostInput) => {
    setDraftInputs((current) => ({ ...current, childCost }));
    setCurrentScreen("lifeevent");
  };

  /**
   * 子ども費用ステップから戻る際も、入力途中の内容をドラフトへ保存する。
   */
  const handleChildCostBack = (childCost: ChildCostInput) => {
    setDraftInputs((current) => ({ ...current, childCost }));
    setCurrentScreen("household");
  };

  /**
   * ライフイベントステップの入力値を一時シナリオへ反映する。
   */
  const handleLifeEventNext = (lifeEvents: LifeEvent[]) => {
    setDraftInputs((current) => ({ ...current, lifeEvents }));
    setCurrentScreen("investment");
  };

  /**
   * ライフイベントステップから戻る際も、入力途中の内容をドラフトへ保存する。
   */
  const handleLifeEventBack = (lifeEvents: LifeEvent[]) => {
    setDraftInputs((current) => ({ ...current, lifeEvents }));
    setCurrentScreen("childcost");
  };

  /**
   * 投資設定ステップの入力値を一時シナリオへ反映し、結果画面へ進む。
   */
  const handleInvestmentNext = (investment: InvestmentInput) => {
    setDraftInputs((current) => ({ ...current, investment }));
    setCurrentScreen("results");
  };

  /**
   * 投資設定ステップから戻る際も、入力途中の内容をドラフトへ保存する。
   */
  const handleInvestmentBack = (investment: InvestmentInput) => {
    setDraftInputs((current) => ({ ...current, investment }));
    setCurrentScreen("lifeevent");
  };

  /**
   * 年次表で編集した単年の収入・支出調整を、現在のシナリオ入力へ反映する。
   */
  const handleYearAdjustmentSave = (adjustment: YearAdjustment) => {
    setDraftInputs((current) => ({
      ...current,
      yearAdjustments: [
        ...(current.yearAdjustments ?? []).filter((item) => item.year !== adjustment.year),
        adjustment
      ].sort((a, b) => a.year - b.year)
    }));
  };

  /**
   * 結果画面からシナリオを保存する。
   *
   * 現在の入力条件からシミュレーション結果を再計算し、一覧表示用サマリーと入力条件をまとめて保存する。
   */
  const handleSaveScenario = () => {
    const existingScenario = activeScenarioId
      ? scenarios.find((scenario) => scenario.id === activeScenarioId)
      : undefined;
    const savedScenario = createScenarioSummaryFromInputs(draftInputs, existingScenario);

    const nextScenarios = existingScenario
      ? scenarios.map((scenario) => scenario.id === savedScenario.id ? savedScenario : scenario)
      : [savedScenario, ...scenarios];

    setScenarios(nextScenarios);
    setActiveScenarioId(savedScenario.id);
    saveScenarios(nextScenarios);
    saveActiveScenarioId(savedScenario.id);
    window.alert("シナリオをこの端末に保存しました。");
  };

  /**
   * 家計入力から、投資設定画面で使う現在の月次余剰を算出する。
   *
   * 投資設定画面の概算表示と本体シミュレーションの前提をできるだけ揃えるため、
   * 手取り年収を12で割った月次手取りから、基本支出を差し引いた値を使う。
   */
  const currentMonthlySurplus =
    Math.floor(
      (
        estimateTakeHome(parseAmount(draftInputs.household.userIncome) + parseAmount(draftInputs.household.userBonus)) +
        estimateTakeHome(parseAmount(draftInputs.household.spouseIncome) + parseAmount(draftInputs.household.spouseBonus))
      ) / 12
    ) -
    (
      parseAmount(draftInputs.household.livingExpenses) +
      parseAmount(draftInputs.household.housingCost) +
      parseAmount(draftInputs.household.fixedCosts)
    );

  /**
   * 現在の画面状態に応じて表示する画面コンポーネントを切り替える。
   *
   * 各画面には次へ/戻る/保存などのイベントハンドラだけを渡し、画面遷移の責務をAppに集約する。
   */
  const renderScreen = () => {
    switch (currentScreen) {
      case "profile":
        return <ProfileSetup initialProfile={profile} onComplete={handleProfileComplete} />;
      case "list":
        return (
          <ScenarioList
            scenarios={scenarios}
            profile={profile}
            onCreateNew={handleCreateNew}
            onCreateFromTemplate={handleCreateFromTemplate}
            onEdit={handleEdit}
            onCompare={handleCompare}
            onEditProfile={() => setCurrentScreen("profile")}
            onDuplicate={handleDuplicate}
          />
        );
      case "basic":
        return (
          <BasicInfoForm
            initialData={draftInputs.basic}
            profileSnapshot={draftInputs.profileSnapshot ?? profile}
            onNext={handleBasicNext}
            onBack={handleBasicBack}
            onEditProfile={handleBasicEditProfile}
          />
        );
      case "household":
        return (
          <HouseholdForm
            initialData={draftInputs.household}
            onNext={handleHouseholdNext}
            onBack={handleHouseholdBack}
          />
        );
      case "childcost":
        return (
          <ChildCostForm
            initialData={draftInputs.childCost}
            childrenCount={Number.parseInt(draftInputs.basic.childrenCount || "0", 10) || 0}
            onNext={handleChildCostNext}
            onBack={handleChildCostBack}
          />
        );
      case "lifeevent":
        return (
          <LifeEventForm
            initialData={draftInputs.lifeEvents}
            onNext={handleLifeEventNext}
            onBack={handleLifeEventBack}
          />
        );
      case "investment":
        return (
          <InvestmentForm
            initialData={draftInputs.investment}
            currentMonthlySurplus={currentMonthlySurplus}
            onNext={handleInvestmentNext}
            onBack={handleInvestmentBack}
          />
        );
      case "results":
        return (
          <ResultsScreen
            result={calculateSimulation(draftInputs)}
            yearAdjustments={draftInputs.yearAdjustments}
            onEdit={() => setCurrentScreen("basic")}
            onDuplicate={handleDuplicateCurrentScenario}
            onSave={handleSaveScenario}
            onYearAdjustmentSave={handleYearAdjustmentSave}
          />
        );
      case "comparison":
        return (
          <ComparisonScreen
            scenarios={scenarios.filter((scenario) => compareScenarioIds.includes(scenario.id))}
            onBack={() => setCurrentScreen("list")}
          />
        );
      default:
        return (
          <ScenarioList
            scenarios={scenarios}
            profile={profile}
            onCreateNew={handleCreateNew}
            onCreateFromTemplate={handleCreateFromTemplate}
            onEdit={handleEdit}
            onCompare={handleCompare}
            onEditProfile={() => setCurrentScreen("profile")}
            onDuplicate={handleDuplicate}
          />
        );
    }
  };

  return (
    <div className="w-full min-h-screen">
      <Suspense
        fallback={
          <div className="flex min-h-screen items-center justify-center bg-[#fcf8f2] px-6">
            <div className="rounded-3xl border border-[#eadfce] bg-white px-6 py-4 text-sm text-[#6b5f52] shadow-sm">
              画面を読み込んでいます...
            </div>
          </div>
        }
      >
        {renderScreen()}
      </Suspense>
    </div>
  );
}
