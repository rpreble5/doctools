"use client";

import { useMemo, useState } from "react";

import { CompareBars } from "@/components/modules/CompareBars";
import { CriteriaList } from "@/components/modules/CriteriaList";
import { BandBar } from "@/components/modules/BandBar";
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
  investigationHeadroom,
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

/** PSI risk classes by point total. Class I is decided before points. */
const PSI_BANDS = [
  { upTo: 70, label: "II" },
  { upTo: 90, label: "III" },
  { upTo: 130, label: "IV" },
  { upTo: 180, label: "V" },
];

export function CapTool() {
  /*
   * Everything except age and saturations is a single bit at a
   * published cut point, so it is a toggle that starts off. A well
   * patient needs no interaction at all; you tap only what is wrong.
   */

  // ---- continuous ----
  const [ageYears, setAgeYears] = useState(65);
  const [hypoxaemia, setHypoxaemia] = useState(false);
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

  // ---- results ----
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
      hypoxaemia,
      uraemia,
      hyponatraemia,
      hyperglycaemia,
      anaemia,
      acidosis,
    }),
    [
      ageYears, sex, nursingHomeResident,
      neoplasticDisease, liverDisease, heartFailure,
      cerebrovascularDisease, renalDisease,
      alteredMentalStatus, tachypnoea, hypotension, temperatureExtreme,
      tachycardia, pleuralEffusion, hypoxaemia,
      uraemia, hyponatraemia, hyperglycaemia, anaemia, acidosis,
    ],
  );

  const port = psi(findings);
  const blockers = classOneBlockers(findings);
  const headroom = investigationHeadroom(findings);
  const inClassOne = blockers.length === 0;
  const understated = !headroom.exhausted && headroom.worstCaseClass !== port.riskClass;

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
    { label: "Abnormal", value: abnormalFindings },
    { label: "PSI", value: port.riskClass },
    { label: "Points", value: port.points },
  ];

  return (
    <ToolFrame meta={meta} caseFields={caseFields}>
      {/* ===================== SEVERITY ===================== */}
      <PanelRow>
        <Panel title="How sick — Pneumonia Severity Index" span={3}>
          {/* --- verdict ---
              The summary sits on its own row. Sharing a row with the
              line meant a longer site-of-care string widened the column
              and shoved the line sideways, so it appeared to move for
              reasons that had nothing to do with the score. --- */}
          <div className="flex flex-wrap items-end gap-x-10 gap-y-4">
            <Figure
              label="Risk class"
              value={port.riskClass}
              size="focal"
              caption={inClassOne ? "no points needed" : `${port.points} points`}
            />
            <dl className="m-0 flex flex-wrap gap-x-10 gap-y-3 pb-1">
              <div className="flex flex-col">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">
                  Mortality
                </dt>
                <dd className="tnum m-0 font-mono text-[13px]">
                  {port.mortalityBand}
                </dd>
              </div>
              <div className="flex flex-col">
                <dt className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">
                  Site of care
                </dt>
                <dd className="m-0 text-[13px] font-medium">{port.siteOfCare}</dd>
              </div>
            </dl>
          </div>

          <BandBar
            value={port.points}
            bands={PSI_BANDS}
            bypassed={inClassOne}
            bypassNote="Not scored. Nothing below changes this."
          />

          {/* --- factors: the list is both the input and the breakdown --- */}
          <div className="grid grid-cols-1 gap-x-10 gap-y-6 border-t border-hair pt-6 sm:grid-cols-2 xl:grid-cols-4">
            <div className="flex flex-col gap-4">
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
              <p className="m-0 text-[11px] leading-relaxed text-faint">
                Every year is a point. Usually the biggest single factor.
              </p>
            </div>

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
              <Factor label="SpO₂ < 90 or PaO₂ < 60" points={10} active={hypoxaemia} onToggle={setHypoxaemia} />
              <Factor label="Pleural effusion" points={10} active={pleuralEffusion} onToggle={setPleuralEffusion} />
            </FactorGroup>

            <FactorGroup label="Results">
              <Factor label="pH < 7.35" points={30} active={acidosis} onToggle={setAcidosis} />
              <Factor label="BUN ≥ 30" points={20} active={uraemia} onToggle={setUraemia} />
              <Factor label="Sodium < 130" points={20} active={hyponatraemia} onToggle={setHyponatraemia} />
              <Factor label="Glucose ≥ 250" points={10} active={hyperglycaemia} onToggle={setHyperglycaemia} />
              <Factor label="Haematocrit < 30" points={10} active={anaemia} onToggle={setAnaemia} />
            </FactorGroup>
          </div>

          {/* --- what the number will not tell you --- */}
          <div className="flex flex-col gap-2 border-t border-hair pt-4">
            <p className="m-0 max-w-[80ch] text-[12.5px] leading-relaxed text-soft">
              {inClassOne ? (
                <>
                  <b className="font-semibold text-ink">Lowest risk. Stop here.</b>{" "}
                  Under 50, no listed comorbidity, vitals and mental status
                  normal. PSI does not count points for this patient, and no
                  bloods are needed.
                </>
              ) : (
                <>
                  <b className="font-semibold text-ink">Counting points because of:</b>{" "}
                  {blockers.join(", ").toLowerCase()}.
                </>
              )}
            </p>

            {!inClassOne && understated ? (
              <p className="m-0 max-w-[80ch] text-[12.5px] leading-relaxed text-soft">
                <b className="font-semibold text-ink">
                  Class {port.riskClass} now. Could reach {headroom.worstCaseClass}.
                </b>{" "}
                {headroom.points} points sit in labs you have not marked
                ({headroom.unscored.map((u) => u.label).join(", ")}). A normal
                result and a missing one score the same.
              </p>
            ) : null}

            <p className="m-0 max-w-[80ch] text-[11.5px] leading-relaxed text-faint">
              This predicts death at 30 days, not whether to admit. Oxygen,
              oral intake and who is at home are not in it.
            </p>
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
                  met: label !== "Saturations 90% or more" || !hypoxaemia,
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
