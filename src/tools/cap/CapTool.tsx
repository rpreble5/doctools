"use client";

import { useMemo, useState } from "react";

import { CompareBars } from "@/components/modules/CompareBars";
import { CriteriaList } from "@/components/modules/CriteriaList";
import { Figure } from "@/components/modules/Figure";
import { IconArray, IconArrayKey } from "@/components/modules/IconArray";
import { PointsBreakdown } from "@/components/modules/PointsBreakdown";
import { ProbabilityBand } from "@/components/modules/ProbabilityBand";
import { SeamNote } from "@/components/modules/SeamNote";
import { Trajectory } from "@/components/modules/Trajectory";
import {
  FieldGroup,
  NumberField,
  OptionalNumberField,
  Segmented,
  ToggleChip,
} from "@/components/modules/controls";
import { Panel, PanelRow } from "@/components/shell/Panel";
import { ToolFrame } from "@/components/shell/ToolFrame";

import { asPercent, canChangeManagement, revise } from "@/lib/probability";
import { classOneBlockers, psi, psiCompleteness } from "@/lib/scores/psi";

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
  // ---- demographics ----
  const [ageYears, setAgeYears] = useState(68);
  const [sex, setSex] = useState<"male" | "female">("male");
  const [nursingHomeResident, setNursingHomeResident] = useState(false);

  // ---- comorbidity ----
  const [neoplasticDisease, setNeoplasticDisease] = useState(false);
  const [liverDisease, setLiverDisease] = useState(false);
  const [heartFailure, setHeartFailure] = useState(false);
  const [cerebrovascularDisease, setCerebrovascularDisease] = useState(false);
  const [renalDisease, setRenalDisease] = useState(false);

  // ---- examination ----
  const [alteredMentalStatus, setAlteredMentalStatus] = useState(false);
  const [respiratoryRate, setRespiratoryRate] = useState(22);
  const [systolicBp, setSystolicBp] = useState(128);
  const [temperatureC, setTemperatureC] = useState(38.4);
  const [pulse, setPulse] = useState(96);
  const [pleuralEffusion, setPleuralEffusion] = useState(false);

  // ---- investigations, undefined until measured ----
  const [arterialPh, setArterialPh] = useState<number | undefined>();
  const [bunMgDl, setBunMgDl] = useState<number | undefined>();
  const [sodiumMmolL, setSodiumMmolL] = useState<number | undefined>();
  const [glucoseMgDl, setGlucoseMgDl] = useState<number | undefined>();
  const [haematocritPct, setHaematocritPct] = useState<number | undefined>();
  const [oxygenSaturationPct, setOxygenSaturationPct] = useState<
    number | undefined
  >(93);

  // ---- other panels ----
  const [comorbidTherapy, setComorbidTherapy] = useState(true);
  const [recentAntibiotics, setRecentAntibiotics] = useState(false);
  const [viralPanelPositive, setViralPanelPositive] = useState(true);
  const [pretest, setPretest] = useState(0.2);
  const [testId, setTestId] = useState(diagnosticTests[0].id);
  const [testResult, setTestResult] = useState<TestResult>("positive");
  const [days, setDays] = useState(5);

  const input = useMemo(
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
      respiratoryRate,
      systolicBp,
      temperatureC,
      pulse,
      arterialPh,
      bunMgDl,
      sodiumMmolL,
      glucoseMgDl,
      haematocritPct,
      oxygenSaturationPct,
      pleuralEffusion,
    }),
    [
      ageYears, sex, nursingHomeResident,
      neoplasticDisease, liverDisease, heartFailure,
      cerebrovascularDisease, renalDisease,
      alteredMentalStatus, respiratoryRate, systolicBp, temperatureC, pulse,
      arterialPh, bunMgDl, sodiumMmolL, glucoseMgDl, haematocritPct,
      oxygenSaturationPct, pleuralEffusion,
    ],
  );

  const port = psi(input);
  const blockers = classOneBlockers(input);
  const completeness = psiCompleteness(input);
  const inClassOne = blockers.length === 0;
  const understated = !completeness.complete && completeness.worstCaseClass !== port.riskClass;

  const test = diagnosticTests.find((t) => t.id === testId) ?? diagnosticTests[0];
  const lr = useMemo(() => testLikelihoodRatios(test), [test]);
  const posttest = revise(pretest, testResult === "positive" ? lr.positive : lr.negative);
  const informative = canChangeManagement(pretest, lr, diagnosticThresholds);

  const regimens = regimensFor({ comorbidities: comorbidTherapy, recentAntibiotics });
  const extraDays = Math.max(0, days - durationGuidance.maxGuidelineDays);
  const withinGuideline = days <= durationGuidance.maxGuidelineDays;

  const caseFields = [
    { label: "Age", value: ageYears },
    { label: "RR", value: respiratoryRate },
    { label: "Systolic", value: systolicBp },
    { label: "Temp", value: temperatureC.toFixed(1) },
    { label: "SpO₂", value: oxygenSaturationPct ?? "—" },
    { label: "PSI", value: port.riskClass },
  ];

  return (
    <ToolFrame meta={meta} caseFields={caseFields}>
      {/* ===================== SEVERITY ===================== */}
      <PanelRow>
        <Panel title="How sick — Pneumonia Severity Index" span={3}>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[220px_minmax(0,1.1fr)_minmax(0,1fr)]">
            {/* --- verdict --- */}
            <div className="flex flex-col gap-5">
              <Figure
                label="Risk class"
                value={port.riskClass}
                size="focal"
                caption={
                  inClassOne
                    ? "by step one, no scoring needed"
                    : `${port.points} points`
                }
              />

              <dl className="m-0 flex flex-col gap-2">
                <div className="flex items-baseline justify-between gap-3 border-b border-hair pb-2">
                  <dt className="text-[12.5px] text-soft">30-day mortality</dt>
                  <dd className="tnum m-0 font-mono text-[14px]">
                    {port.mortalityBand}
                  </dd>
                </div>
                <div className="flex flex-col gap-1 border-b border-hair pb-2">
                  <dt className="text-[12.5px] text-soft">Site of care</dt>
                  <dd className="m-0 text-[15px] font-medium tracking-[-0.015em]">
                    {port.siteOfCare}
                  </dd>
                </div>
              </dl>

              <p className="m-0 max-w-[42ch] text-[12px] leading-relaxed text-faint">
                This is a thirty-day mortality estimate, not a level-of-care
                decision. Oxygen, an inability to keep orals down, or nobody at
                home outrank it, and none of them are in the score.
              </p>
            </div>

            {/* --- step one / completeness --- */}
            <div className="flex flex-col gap-6">
              <div className="flex flex-col gap-3">
                <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
                  Step one
                </p>
                {inClassOne ? (
                  <p className="m-0 max-w-[52ch] text-[13.5px] leading-relaxed text-ink">
                    Class I on the step-one algorithm. No point count, and no
                    bloods needed to say so — 50 or under, no listed
                    comorbidity, mental status and vitals intact.
                  </p>
                ) : (
                  <>
                    <p className="m-0 max-w-[52ch] text-[13px] leading-relaxed text-soft">
                      Out of class I, so the points below apply. What excludes
                      this patient:
                    </p>
                    <CriteriaList
                      items={blockers.map((label) => ({ label, met: true }))}
                    />
                  </>
                )}
              </div>

              {!inClassOne ? (
                <div className="flex flex-col gap-3 border-t border-hair pt-5">
                  <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
                    What you have not measured
                  </p>

                  {completeness.complete ? (
                    <p className="m-0 text-[13px] leading-relaxed text-soft">
                      Every scored investigation is entered. The class stands on
                      complete data.
                    </p>
                  ) : (
                    <>
                      <p className="m-0 max-w-[52ch] text-[13.5px] leading-relaxed text-ink">
                        Class {port.riskClass} on what you have entered.
                        {understated ? (
                          <>
                            {" "}
                            With the missing values abnormal it would be class{" "}
                            <b className="font-semibold">
                              {completeness.worstCaseClass}
                            </b>
                            .
                          </>
                        ) : null}
                      </p>
                      <CriteriaList
                        items={completeness.missing.map((m) => ({
                          label: m.label,
                          met: false,
                          value: `${m.maxPoints}`,
                        }))}
                      />
                      <p className="m-0 max-w-[52ch] text-[11.5px] leading-relaxed text-faint">
                        An unmeasured value scores nothing, so a patient nobody
                        worked up reads low. The figures on the right are the
                        most each could add.
                      </p>
                    </>
                  )}
                </div>
              ) : null}
            </div>

            {/* --- breakdown --- */}
            <div className="flex flex-col gap-3">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
                What is driving it
              </p>
              {port.contributions.length ? (
                <PointsBreakdown
                  items={port.contributions}
                  total={port.points}
                />
              ) : (
                <p className="m-0 text-[13px] text-faint">
                  Nothing scores. Class I by step one.
                </p>
              )}
              {!inClassOne && port.contributions.length ? (
                <p className="m-0 max-w-[46ch] text-[11.5px] leading-relaxed text-faint">
                  Age is usually the longest bar, which is why this score
                  under-reads a young patient who is physiologically unwell.
                </p>
              ) : null}
            </div>
          </div>

          {/* --- inputs --- */}
          <div className="grid grid-cols-1 gap-8 border-t border-hair pt-8 lg:grid-cols-4">
            <div className="flex flex-col gap-4">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
                Demographics
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-4">
                <NumberField label="Age" value={ageYears} onChange={setAgeYears} min={16} max={110} />
                <div className="flex flex-col gap-1.5">
                  <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-faint">
                    Sex
                  </span>
                  <Segmented
                    value={sex}
                    onChange={setSex}
                    options={[
                      { value: "male", label: "Male" },
                      { value: "female", label: "Female" },
                    ]}
                  />
                </div>
              </div>
              <ToggleChip label="Nursing home resident" active={nursingHomeResident} onChange={setNursingHomeResident} />
            </div>

            <FieldGroup label="Comorbidity">
              <ToggleChip label="Neoplastic" active={neoplasticDisease} onChange={setNeoplasticDisease} />
              <ToggleChip label="Liver" active={liverDisease} onChange={setLiverDisease} />
              <ToggleChip label="Heart failure" active={heartFailure} onChange={setHeartFailure} />
              <ToggleChip label="Cerebrovascular" active={cerebrovascularDisease} onChange={setCerebrovascularDisease} />
              <ToggleChip label="Renal" active={renalDisease} onChange={setRenalDisease} />
            </FieldGroup>

            <div className="flex flex-col gap-4">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
                Examination
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-4">
                <NumberField label="Resp rate" value={respiratoryRate} onChange={setRespiratoryRate} min={6} max={60} />
                <NumberField label="Systolic" value={systolicBp} onChange={setSystolicBp} min={50} max={250} />
                <NumberField label="Pulse" value={pulse} onChange={setPulse} min={30} max={220} />
                <NumberField label="Temp" value={temperatureC} onChange={setTemperatureC} min={32} max={43} step={0.1} suffix="°C" />
              </div>
              <div className="flex flex-wrap gap-2">
                <ToggleChip label="Altered mental status" active={alteredMentalStatus} onChange={setAlteredMentalStatus} />
                <ToggleChip label="Pleural effusion" active={pleuralEffusion} onChange={setPleuralEffusion} />
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
                Investigations <span className="normal-case tracking-normal opacity-70">— leave blank if not measured</span>
              </p>
              <div className="flex flex-wrap gap-x-6 gap-y-4">
                <OptionalNumberField label="pH" value={arterialPh} onChange={setArterialPh} min={6.5} max={7.8} step={0.01} />
                <OptionalNumberField label="BUN" value={bunMgDl} onChange={setBunMgDl} min={1} max={200} suffix="mg/dL" />
                <OptionalNumberField label="Sodium" value={sodiumMmolL} onChange={setSodiumMmolL} min={100} max={180} />
                <OptionalNumberField label="Glucose" value={glucoseMgDl} onChange={setGlucoseMgDl} min={20} max={900} suffix="mg/dL" />
                <OptionalNumberField label="Haematocrit" value={haematocritPct} onChange={setHaematocritPct} min={10} max={70} suffix="%" />
                <OptionalNumberField label="SpO₂" value={oxygenSaturationPct} onChange={setOxygenSaturationPct} min={50} max={100} suffix="%" />
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
