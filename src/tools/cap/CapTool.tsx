"use client";

import { useMemo, useState } from "react";

import { CompareBars } from "@/components/modules/CompareBars";
import { CriteriaList } from "@/components/modules/CriteriaList";
import { Figure } from "@/components/modules/Figure";
import { IconArray, IconArrayKey } from "@/components/modules/IconArray";
import { ProbabilityBand } from "@/components/modules/ProbabilityBand";
import { SeamNote } from "@/components/modules/SeamNote";
import { Trajectory } from "@/components/modules/Trajectory";
import {
  FieldGroup,
  NumberField,
  Segmented,
  ToggleChip,
} from "@/components/modules/controls";
import { Panel, PanelRow } from "@/components/shell/Panel";
import { ToolFrame } from "@/components/shell/ToolFrame";

import { asPercent, canChangeManagement, revise } from "@/lib/probability";
import { curb65, siteOfCareLabel } from "@/lib/scores/curb65";
import { psi } from "@/lib/scores/psi";

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
  // ---- case ----
  const [ageYears, setAgeYears] = useState(68);
  const [sex, setSex] = useState<"male" | "female">("male");
  const [respiratoryRate, setRespiratoryRate] = useState(22);
  const [systolicBp, setSystolicBp] = useState(128);
  const [diastolicBp, setDiastolicBp] = useState(74);
  const [pulse, setPulse] = useState(96);
  const [temperatureC, setTemperatureC] = useState(38.4);
  const [oxygenSaturationPct, setOxygenSaturationPct] = useState(93);

  const [confusion, setConfusion] = useState(false);
  const [ureaOver7, setUreaOver7] = useState(false);
  const [comorbidities, setComorbidities] = useState(true);
  const [heartFailure, setHeartFailure] = useState(false);
  const [renalDisease, setRenalDisease] = useState(false);
  const [neoplasticDisease, setNeoplasticDisease] = useState(false);
  const [nursingHomeResident, setNursingHomeResident] = useState(false);
  const [recentAntibiotics, setRecentAntibiotics] = useState(false);
  const [viralPanelPositive, setViralPanelPositive] = useState(true);

  // ---- diagnosis ----
  const [pretest, setPretest] = useState(0.2);
  const [testId, setTestId] = useState(diagnosticTests[0].id);
  const [testResult, setTestResult] = useState<TestResult>("positive");

  // ---- duration ----
  const [days, setDays] = useState(5);

  const test = diagnosticTests.find((t) => t.id === testId) ?? diagnosticTests[0];
  const lr = useMemo(() => testLikelihoodRatios(test), [test]);
  const posttest = revise(
    pretest,
    testResult === "positive" ? lr.positive : lr.negative,
  );
  const informative = canChangeManagement(pretest, lr, diagnosticThresholds);

  const severity = curb65({
    confusion,
    ureaOver7,
    respiratoryRate,
    systolicBp,
    diastolicBp,
    ageYears,
  });

  const port = psi({
    ageYears,
    sex,
    nursingHomeResident,
    neoplasticDisease,
    liverDisease: false,
    heartFailure,
    cerebrovascularDisease: false,
    renalDisease,
    alteredMentalStatus: confusion,
    respiratoryRate,
    systolicBp,
    temperatureC,
    pulse,
    oxygenSaturationPct,
    pleuralEffusion: false,
  });

  const regimens = regimensFor({ comorbidities, recentAntibiotics });
  const extraDays = Math.max(0, days - durationGuidance.maxGuidelineDays);
  const withinGuideline = days <= durationGuidance.maxGuidelineDays;

  const caseFields = [
    { label: "Age", value: ageYears },
    { label: "RR", value: respiratoryRate },
    { label: "BP", value: `${systolicBp}/${diastolicBp}` },
    { label: "Temp", value: temperatureC.toFixed(1) },
    { label: "SpO₂", value: oxygenSaturationPct },
    ...(viralPanelPositive
      ? [{ label: "Viral panel", value: "Positive" }]
      : []),
  ];

  return (
    <ToolFrame meta={meta} caseFields={caseFields}>
      {/* ---------------- case ---------------- */}
      <PanelRow>
        <Panel title="Case" span={3}>
          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap gap-x-8 gap-y-4">
              <NumberField label="Age" value={ageYears} onChange={setAgeYears} min={16} max={110} />
              <NumberField label="Resp rate" value={respiratoryRate} onChange={setRespiratoryRate} min={6} max={60} />
              <NumberField label="Systolic" value={systolicBp} onChange={setSystolicBp} min={50} max={250} />
              <NumberField label="Diastolic" value={diastolicBp} onChange={setDiastolicBp} min={20} max={150} />
              <NumberField label="Pulse" value={pulse} onChange={setPulse} min={30} max={200} />
              <NumberField label="Temp" value={temperatureC} onChange={setTemperatureC} min={33} max={42} step={0.1} suffix="°C" />
              <NumberField label="SpO₂" value={oxygenSaturationPct} onChange={setOxygenSaturationPct} min={50} max={100} suffix="%" />
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

            <FieldGroup label="History and findings">
              <ToggleChip label="Confusion" active={confusion} onChange={setConfusion} />
              <ToggleChip label="Urea over 7" active={ureaOver7} onChange={setUreaOver7} />
              <ToggleChip label="Comorbidity" active={comorbidities} onChange={setComorbidities} />
              <ToggleChip label="Heart failure" active={heartFailure} onChange={setHeartFailure} />
              <ToggleChip label="Renal disease" active={renalDisease} onChange={setRenalDisease} />
              <ToggleChip label="Neoplastic disease" active={neoplasticDisease} onChange={setNeoplasticDisease} />
              <ToggleChip label="Nursing home" active={nursingHomeResident} onChange={setNursingHomeResident} />
              <ToggleChip label="Recent antibiotics" active={recentAntibiotics} onChange={setRecentAntibiotics} />
              <ToggleChip label="Viral panel positive" active={viralPanelPositive} onChange={setViralPanelPositive} />
            </FieldGroup>
          </div>
        </Panel>
      </PanelRow>

      {/* ---------------- reasoning ---------------- */}
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
              options={diagnosticTests.map((t) => ({
                value: t.id,
                label: t.name,
              }))}
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
              : "Both results land in the same zone. This test cannot change what you do — the commonest reason a test should not have been ordered."}
          </p>

          {test.id === "cxr" && testResult === "positive" ? (
            <dl className="m-0 flex flex-col gap-2">
              <div className="flex items-baseline justify-between gap-3.5 border-b border-hair pb-2">
                <dt className="text-[12.5px] text-soft">Clinicians estimated</dt>
                <dd className="tnum m-0 font-mono text-[15px] text-harm">
                  {calibrationGap.clinicianEstimate}
                </dd>
              </div>
              <div className="flex items-baseline justify-between gap-3.5 border-b border-hair pb-2">
                <dt className="text-[12.5px] text-soft">Evidence</dt>
                <dd className="tnum m-0 font-mono text-[15px]">
                  {calibrationGap.evidenceDisplay}
                </dd>
              </div>
              <p className="m-0 text-[11.5px] text-faint">
                {calibrationGap.source}
              </p>
            </dl>
          ) : null}
        </Panel>

        <Panel title="How sick">
          <Figure
            value={severity.score}
            caption={`CURB-65 · PSI class ${port.riskClass}, ${port.points} points`}
          />

          <CriteriaList
            items={severity.criteria.map((c) => ({
              label: c.label,
              met: c.met,
            }))}
          />

          <p className="m-0 text-[17px] font-medium tracking-[-0.015em]">
            {siteOfCareLabel[severity.siteOfCare]}
          </p>

          <dl className="m-0 flex flex-col gap-2">
            <div className="flex items-baseline justify-between gap-3.5 border-b border-hair pb-2">
              <dt className="text-[12.5px] text-soft">CURB-65 mortality</dt>
              <dd className="tnum m-0 font-mono text-[13px]">
                {severity.mortalityBand}
              </dd>
            </div>
            <div className="flex items-baseline justify-between gap-3.5 border-b border-hair pb-2">
              <dt className="text-[12.5px] text-soft">PSI site of care</dt>
              <dd className="m-0 text-[13px]">{port.siteOfCare}</dd>
            </div>
          </dl>

          <p className="m-0 max-w-[56ch] text-[13px] leading-relaxed text-soft">
            The scores disagree more often than you would like. PSI is better at
            finding the patient who is genuinely safe to go home; CURB-65 is
            better at being remembered at three in the morning.
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
                <b
                  className={`text-[13.5px] ${
                    regimen.preferred
                      ? "font-semibold text-ink"
                      : "font-medium text-faint"
                  }`}
                >
                  {regimen.name}
                </b>
                <span className="text-[11.5px] text-faint">{regimen.when}</span>
              </li>
            ))}
          </ul>

          <p className="m-0 max-w-[56ch] text-[13px] leading-relaxed text-faint">
            {hcapNote}
          </p>
        </Panel>
      </PanelRow>

      {/* ---------------- duration and seam ---------------- */}
      <PanelRow>
        <Panel title="How long" span={2}>
          <div className="grid grid-cols-1 gap-10 lg:grid-cols-[200px_minmax(0,1fr)]">
            <div className="flex flex-col gap-2">
              <Figure
                value={days}
                unit="days"
                size="focal"
                tone="accent"
                caption={
                  withinGuideline ? "within guideline" : "beyond guideline"
                }
              />
            </div>

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
                  met: label !== "Saturations 90% or more" || oxygenSaturationPct >= 90,
                  borderline:
                    label === "Saturations 90% or more" &&
                    oxygenSaturationPct < 95,
                  value:
                    label === "Saturations 90% or more"
                      ? String(oxygenSaturationPct)
                      : undefined,
                }))}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-10 border-t border-hair pt-8 lg:grid-cols-[minmax(0,1.35fr)_minmax(0,1fr)]">
            <div className="flex flex-col gap-4">
              <p className="m-0 text-[10px] font-semibold uppercase tracking-[0.15em] text-faint">
                Per 100 treated{" "}
                <b className="tnum font-mono text-ink">{extraDays}</b> days
                beyond stability{" "}
                <em className="not-italic opacity-70">placeholder</em>
              </p>
              <IconArray harm={extraDays * harmPerExtraDay} />
              <IconArrayKey
                harmLabel="added adverse events"
                benefitLabel="added cures"
              />
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

        <Panel title="Where it is unsettled">
          {viralPanelPositive ? (
            <SeamNote seam={viralAssaySeam} />
          ) : (
            <p className="m-0 max-w-[56ch] text-[13px] leading-relaxed text-faint">
              Nothing contested applies to this case as entered. Turn on a
              positive viral panel to see the one live disagreement in the 2025
              guidance.
            </p>
          )}
        </Panel>
      </PanelRow>

      {/* ---------------- trajectory ---------------- */}
      <PanelRow>
        <Panel title="What happens next" span={3}>
          <Trajectory steps={trajectory} />
        </Panel>
      </PanelRow>
    </ToolFrame>
  );
}
