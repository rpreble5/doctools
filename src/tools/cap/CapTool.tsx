"use client";

import { useMemo, useState } from "react";

import { CompareBars } from "@/components/modules/CompareBars";
import { CriteriaList } from "@/components/modules/CriteriaList";
import { Figure } from "@/components/modules/Figure";
import { IconArray, IconArrayKey } from "@/components/modules/IconArray";
import { ProbabilityBand } from "@/components/modules/ProbabilityBand";
import { SeamNote } from "@/components/modules/SeamNote";
import { Trajectory } from "@/components/modules/Trajectory";
import { Segmented, SliderField, ToggleChip } from "@/components/modules/controls";
import { Factor, FactorGroup } from "@/components/modules/FactorList";
import { Panel, PanelRow } from "@/components/shell/Panel";
import { ToolFrame } from "@/components/shell/ToolFrame";

import { asPercent, canChangeManagement, revise } from "@/lib/probability";
import {
  classOneBlockers,
  psi,
  psiCompleteness,
  type PsiFindings,
} from "@/lib/scores/psi";

import {
  calibrationGap,
  diagnosticTests,
  diagnosticThresholds,
  durationGuidance,
  hcapNote,
  harmPerExtraDay,
  meta,
  practiceGap,
  regimensFor,
  stabilityCriteria,
  testLikelihoodRatios,
  trajectory,
  viralAssaySeam,
} from "./content";

type TestResult = "positive" | "negative";

export function CapTool() {
  /*
   * Everything except age and saturations is a single bit at a
   * published cut point, so it is a toggle that starts off. A well
   * patient needs no interaction at all; you tap only what is wrong.
   */

  // ---- continuous ----
  const [ageYears, setAgeYears] = useState(65);
  const [oxygenSaturationPct, setOxygenSaturationPct] = useState(96);
  const [sex, setSex] = useState<"male" | "female">("male");

  // ---- history ----
  const [nursingHomeResident, setNursingHomeResident] = useState(false);
  const [neoplasticDisease, setNeoplasticDisease] = useState(false);
  const [liverDisease, setLiverDisease] = useState(false);
  const [heartFailure, setHeartFailure] = useState(false);
  const [cerebrovascularDisease, setCerebrovascularDisease] = useState(false);
  const [renalDisease, setRenalDisease] = useState(false);

  // ---- examination, each at its cut point ----
  const [alteredMentalStatus, setAlteredMentalStatus] = useState(false);
  const [tachypnoea, setTachypnoea] = useState(false);
  const [hypotension, setHypotension] = useState(false);
  const [temperatureExtreme, setTemperatureExtreme] = useState(false);
  const [tachycardia, setTachycardia] = useState(false);
  const [pleuralEffusion, setPleuralEffusion] = useState(false);

  // ---- results, grouped as they are ordered ----
  const [chemistryBack, setChemistryBack] = useState(false);
  const [countBack, setCountBack] = useState(false);
  const [gasBack, setGasBack] = useState(false);
  const [uraemia, setUraemia] = useState(false);
  const [hyponatraemia, setHyponatraemia] = useState(false);
  const [hyperglycaemia, setHyperglycaemia] = useState(false);
  const [anaemia, setAnaemia] = useState(false);
  const [acidosis, setAcidosis] = useState(false);

  // ---- other panels ----
  const [comorbidTherapy, setComorbidTherapy] = useState(true);
  const [recentAntibiotics, setRecentAntibiotics] = useState(false);
  const [viralPanelPositive, setViralPanelPositive] = useState(true);
  const [pretest, setPretest] = useState(0.2);
  const [testId, setTestId] = useState(diagnosticTests[0].id);
  const [testResult, setTestResult] = useState<TestResult>("positive");
  const [days, setDays] = useState(5);

  const findings: PsiFindings = useMemo(
    () => ({
      ageYears,
      sex,
      nursingHomeResident,
      neoplasticDisease,
      liverDisease,
      heartFailure,
      cerebrovascularDisease,
      renalDisease,
      alteredMentalStatus,
      tachypnoea,
      hypotension,
      temperatureExtreme,
      tachycardia,
      pleuralEffusion,
      hypoxaemia: oxygenSaturationPct < 90,
      // A panel that has not come back leaves its items undefined, so
      // they read as unmeasured rather than silently as normal.
      uraemia: chemistryBack ? uraemia : undefined,
      hyponatraemia: chemistryBack ? hyponatraemia : undefined,
      hyperglycaemia: chemistryBack ? hyperglycaemia : undefined,
      anaemia: countBack ? anaemia : undefined,
      acidosis: gasBack ? acidosis : undefined,
    }),
    [
      ageYears, sex, nursingHomeResident,
      neoplasticDisease, liverDisease, heartFailure,
      cerebrovascularDisease, renalDisease,
      alteredMentalStatus, tachypnoea, hypotension, temperatureExtreme,
      tachycardia, pleuralEffusion, oxygenSaturationPct,
      chemistryBack, countBack, gasBack,
      uraemia, hyponatraemia, hyperglycaemia, anaemia, acidosis,
    ],
  );

  const port = psi(findings);
  const blockers = classOneBlockers(findings);
  const completeness = psiCompleteness(findings);
  const inClassOne = blockers.length === 0;
  const understated = !completeness.complete && completeness.worstCaseClass !== port.riskClass;

  const test = diagnosticTests.find((t) => t.id === testId) ?? diagnosticTests[0];
  const lr = useMemo(() => testLikelihoodRatios(test), [test]);
  const posttest = revise(pretest, testResult === "positive" ? lr.positive : lr.negative);
  const informative = canChangeManagement(pretest, lr, diagnosticThresholds);

  const regimens = regimensFor({ comorbidities: comorbidTherapy, recentAntibiotics });
  const extraDays = Math.max(0, days - durationGuidance.maxGuidelineDays);
  const withinGuideline = days <= durationGuidance.maxGuidelineDays;

  const abnormalFindings = port.contributions.filter(
    (c) => !c.label.startsWith("Age"),
  ).length;

  const caseFields = [
    { label: "Age", value: ageYears },
    { label: "SpO₂", value: `${oxygenSaturationPct}%` },
    { label: "Abnormal", value: abnormalFindings },
    { label: "PSI", value: port.riskClass },
    { label: "Points", value: port.points },
  ];

  return (
    <ToolFrame meta={meta} caseFields={caseFields}>
      {/* ===================== SEVERITY ===================== */}
      <PanelRow>
        <Panel title="How sick — Pneumonia Severity Index" span={3}>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[210px_minmax(0,1fr)]">
            {/* --- verdict --- */}
            <div className="flex flex-col gap-4">
              <Figure
                label="Risk class"
                value={port.riskClass}
                size="focal"
                caption={
                  inClassOne ? "class I by step one" : `${port.points} points`
                }
              />

              <dl className="m-0 flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3 border-b border-hair pb-1.5">
                  <dt className="text-[12px] text-soft">30-day mortality</dt>
                  <dd className="tnum m-0 font-mono text-[13px]">
                    {port.mortalityBand}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-3 border-b border-hair pb-1.5">
                  <dt className="text-[12px] text-soft">Site of care</dt>
                  <dd className="m-0 text-[13px] font-medium">
                    {port.siteOfCare}
                  </dd>
                </div>
              </dl>

              <SliderField
                label="Age"
                value={ageYears}
                onChange={setAgeYears}
                min={18}
                max={100}
                suffix="years"
                note={`${sex === "male" ? ageYears : ageYears - 10} pts`}
              />
              <Segmented
                value={sex}
                onChange={setSex}
                options={[
                  { value: "male", label: "Male" },
                  { value: "female", label: "Female" },
                ]}
              />
              <SliderField
                label="Saturations"
                value={oxygenSaturationPct}
                onChange={setOxygenSaturationPct}
                min={70}
                max={100}
                suffix="%"
                note={oxygenSaturationPct < 90 ? "+10" : "—"}
              />
            </div>

            {/* --- factors: the list is both the input and the breakdown --- */}
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 gap-x-10 gap-y-6 sm:grid-cols-2 xl:grid-cols-4">
                <FactorGroup label="History">
                  <Factor label="Nursing home" points={10} active={nursingHomeResident} onToggle={setNursingHomeResident} />
                  <Factor label="Neoplastic" points={30} active={neoplasticDisease} onToggle={setNeoplasticDisease} />
                  <Factor label="Liver" points={20} active={liverDisease} onToggle={setLiverDisease} />
                  <Factor label="Heart failure" points={10} active={heartFailure} onToggle={setHeartFailure} />
                  <Factor label="Cerebrovascular" points={10} active={cerebrovascularDisease} onToggle={setCerebrovascularDisease} />
                  <Factor label="Renal" points={10} active={renalDisease} onToggle={setRenalDisease} />
                </FactorGroup>

                <FactorGroup label="Examination">
                  <Factor label="Altered mental status" points={20} active={alteredMentalStatus} onToggle={setAlteredMentalStatus} />
                  <Factor label="Resp rate ≥ 30" points={20} active={tachypnoea} onToggle={setTachypnoea} />
                  <Factor label="Systolic < 90" points={20} active={hypotension} onToggle={setHypotension} />
                  <Factor label="Temp < 35 or ≥ 40" points={15} active={temperatureExtreme} onToggle={setTemperatureExtreme} />
                  <Factor label="Pulse ≥ 125" points={10} active={tachycardia} onToggle={setTachycardia} />
                  <Factor label="Pleural effusion" points={10} active={pleuralEffusion} onToggle={setPleuralEffusion} />
                </FactorGroup>

                <FactorGroup label="Chemistry" availability={{ available: chemistryBack, onAvailable: setChemistryBack }}>
                  <Factor label="BUN ≥ 30" points={20} active={uraemia} onToggle={setUraemia} disabled={!chemistryBack} />
                  <Factor label="Sodium < 130" points={20} active={hyponatraemia} onToggle={setHyponatraemia} disabled={!chemistryBack} />
                  <Factor label="Glucose ≥ 250" points={10} active={hyperglycaemia} onToggle={setHyperglycaemia} disabled={!chemistryBack} />
                </FactorGroup>

                <div className="flex flex-col gap-6">
                  <FactorGroup label="Blood count" availability={{ available: countBack, onAvailable: setCountBack }}>
                    <Factor label="Haematocrit < 30" points={10} active={anaemia} onToggle={setAnaemia} disabled={!countBack} />
                  </FactorGroup>

                  <FactorGroup label="Blood gas" availability={{ available: gasBack, onAvailable: setGasBack }}>
                    <Factor label="pH < 7.35" points={30} active={acidosis} onToggle={setAcidosis} disabled={!gasBack} />
                  </FactorGroup>
                </div>
              </div>

              {/* --- the two things the number alone will not tell you --- */}
              <div className="flex flex-col gap-2 border-t border-hair pt-4">
                <p className="m-0 max-w-[80ch] text-[12.5px] leading-relaxed text-soft">
                  {inClassOne ? (
                    <>
                      <b className="font-semibold text-ink">Class I by step one.</b>{" "}
                      Fifty or under, no listed comorbidity, mental status and
                      vitals intact — no point count and no bloods needed.
                    </>
                  ) : (
                    <>
                      <b className="font-semibold text-ink">Out of class I:</b>{" "}
                      {blockers.join(", ").toLowerCase()}.
                    </>
                  )}
                </p>

                {!inClassOne && !completeness.complete ? (
                  <p className="m-0 max-w-[80ch] text-[12.5px] leading-relaxed text-soft">
                    <b className="font-semibold text-ink">
                      Class {port.riskClass} on what you have entered
                      {understated ? (
                        <>, and could be {completeness.worstCaseClass}</>
                      ) : null}
                      .
                    </b>{" "}
                    {completeness.missing.map((m) => m.label).join(", ")} not
                    measured — an unmeasured value scores nothing, so a patient
                    nobody worked up reads low.
                  </p>
                ) : null}

                <p className="m-0 max-w-[80ch] text-[11.5px] leading-relaxed text-faint">
                  Thirty-day mortality, not level of care. Oxygen, an inability
                  to keep orals down, or nobody at home outrank it and appear
                  nowhere in the score — and age is usually the largest single
                  contribution, which is why a young patient who is
                  physiologically unwell reads lower than they are.
                </p>
              </div>
            </div>
          </div>
        </Panel>
      </PanelRow>
      {/* ===================== DIAGNOSIS / THERAPY ===================== */}
      <PanelRow>
        <Panel title="Is it pneumonia">
          <Figure
            value={asPercent(posttest)}
            unit="%"
            caption={`after a ${testResult} ${test.name.toLowerCase()}`}
          />

          <ProbabilityBand
            pretest={pretest}
            posttest={posttest}
            thresholds={diagnosticThresholds}
            evidenceRange={
              test.id === "cxr" && testResult === "positive"
                ? calibrationGap.evidenceRange
                : undefined
            }
          />

          <div className="flex flex-col gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                Pretest probability — {asPercent(pretest)}%
              </span>
              <input
                type="range"
                className="range"
                min={1}
                max={95}
                value={Math.round(pretest * 100)}
                onChange={(e) => setPretest(e.target.valueAsNumber / 100)}
              />
            </label>

            <Segmented
              value={testId}
              onChange={setTestId}
              options={diagnosticTests.map((t) => ({ value: t.id, label: t.name }))}
            />
            <Segmented
              value={testResult}
              onChange={setTestResult}
              options={[
                { value: "positive", label: "Positive" },
                { value: "negative", label: "Negative" },
              ]}
            />
          </div>

          <p className="m-0 max-w-[56ch] text-[13.5px] leading-relaxed text-soft">
            {informative
              ? "This result can move him across a threshold, so it is worth having."
              : "Both results land in the same zone. This test cannot change what you do."}
          </p>
        </Panel>

        <Panel title="What and why">
          <ul className="m-0 flex list-none flex-col gap-4 p-0">
            {regimens.map((regimen) => (
              <li
                key={regimen.name}
                className={`flex flex-col gap-[3px] border-l pl-3.5 ${
                  regimen.preferred ? "border-accent" : "border-rule"
                }`}
              >
                <b className={`text-[13.5px] ${regimen.preferred ? "font-semibold text-ink" : "font-medium text-faint"}`}>
                  {regimen.name}
                </b>
                <span className="text-[11.5px] text-faint">{regimen.when}</span>
              </li>
            ))}
          </ul>

          <div className="flex flex-wrap gap-2">
            <ToggleChip label="Comorbidity" active={comorbidTherapy} onChange={setComorbidTherapy} />
            <ToggleChip label="Recent antibiotics" active={recentAntibiotics} onChange={setRecentAntibiotics} />
            <ToggleChip label="Viral panel positive" active={viralPanelPositive} onChange={setViralPanelPositive} />
          </div>

          <p className="m-0 max-w-[56ch] text-[13px] leading-relaxed text-faint">
            {hcapNote}
          </p>
        </Panel>

        <Panel title="Where it is unsettled">
          {viralPanelPositive ? (
            <SeamNote seam={viralAssaySeam} />
          ) : (
            <p className="m-0 max-w-[56ch] text-[13px] leading-relaxed text-faint">
              Nothing contested applies as entered. Turn on a positive viral
              panel to see the one live disagreement in the 2025 guidance.
            </p>
          )}
        </Panel>
      </PanelRow>

      {/* ===================== DURATION ===================== */}
      <PanelRow>
        <Panel title="How long" span={2}>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_minmax(0,1fr)]">
            <Figure
              value={days}
              unit="days"
              size="focal"
              tone="accent"
              caption={withinGuideline ? "within guideline" : "beyond guideline"}
            />

            <div className="flex flex-col gap-4">
              <label className="flex flex-col gap-1">
                <span className="sr-only">Duration in days</span>
                <input
                  type="range"
                  className="range"
                  min={durationGuidance.minDays}
                  max={10}
                  value={days}
                  onChange={(e) => setDays(e.target.valueAsNumber)}
                />
                <span className="tnum flex justify-between font-mono text-[10px] text-faint">
                  {[3, 4, 5, 6, 7, 8, 9, 10].map((d) => (
                    <span key={d}>{d}</span>
                  ))}
                </span>
              </label>

              <p className="m-0 max-w-[62ch] text-[15px] leading-relaxed text-ink">
                <b className="font-semibold">{durationGuidance.lead}</b>{" "}
                <em className="whitespace-nowrap text-[11.5px] uppercase not-italic tracking-[0.09em] text-faint">
                  {durationGuidance.source}
                </em>
              </p>

              <CriteriaList
                columns={2}
                tone="benefit"
                items={stabilityCriteria.map((label) => ({
                  label,
                  met:
                    label !== "Saturations 90% or more" ||
                    (oxygenSaturationPct ?? 0) >= 90,
                  borderline:
                    label === "Saturations 90% or more" &&
                    (oxygenSaturationPct ?? 100) < 95,
                  value:
                    label === "Saturations 90% or more"
                      ? String(oxygenSaturationPct ?? "—")
                      : undefined,
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 border-t border-hair pt-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
                Per 100 treated <b className="tnum font-mono text-ink">{extraDays}</b> days
                beyond stability <em className="not-italic opacity-70">placeholder</em>
              </p>
              <IconArray harm={extraDays * harmPerExtraDay} />
              <IconArrayKey harmLabel="added adverse events" benefitLabel="added cures" />
            </div>

            <div className="flex flex-col gap-4">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
                What actually happens
              </p>
              <CompareBars bars={practiceGap.bars} />
              <p className="m-0 max-w-[56ch] text-[11.5px] leading-relaxed text-faint">
                {practiceGap.note}
              </p>
            </div>
          </div>
        </Panel>

        <Panel title="What happens next">
          <Trajectory steps={trajectory} layout="stack" />
        </Panel>
      </PanelRow>
    </ToolFrame>
  );
}
