"use client";

import { useMemo, useState } from "react";

import { CompareBars } from "@/components/modules/CompareBars";
import { CriteriaList } from "@/components/modules/CriteriaList";
import { BandBar } from "@/components/modules/BandBar";
import { Figure } from "@/components/modules/Figure";
import { ScoreStrip } from "@/components/modules/ScoreStrip";
import { Proportion } from "@/components/modules/Proportion";
import { IconArray, IconArrayKey } from "@/components/modules/IconArray";
import { ProbabilityBand } from "@/components/modules/ProbabilityBand";
import { SeamNote } from "@/components/modules/SeamNote";
import { Trajectory } from "@/components/modules/Trajectory";
import { Segmented, ToggleChip } from "@/components/modules/controls";
import { Factor, FactorGroup } from "@/components/modules/FactorList";
import { Panel, PanelRow } from "@/components/shell/Panel";
import { ToolFrame } from "@/components/shell/ToolFrame";

import { asPercent, canChangeManagement, revise } from "@/lib/probability";
import { drip } from "@/lib/scores/drip";
import {
  severeCap,
  SEVERE_CAP_PERFORMANCE,
  steroidGuidance,
  STEROID_EFFECT,
} from "@/lib/scores/severeCap";
import {
  classOneBlockers,
  investigationHeadroom,
  psi,
} from "@/lib/scores/psi";

import {
  CATEGORIES,
  CATEGORY_LABEL,
  emptyCase,
  factsIn,
  isFactLive,
  toDrip,
  toPsi,
  toSevereCap,
  type CaseState,
  type Focus,
} from "./facts";

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
  resistanceSeam,
  steroidSeam,
  stabilityCriteria,
  testLikelihoodRatios,
  trajectory,
  viralAssaySeam,
} from "./content";

type TestResult = "positive" | "negative";

/** DRIP: one cut point at 4, so two bands. */
const DRIP_BANDS = [
  { upTo: 3, label: "Standard" },
  { upTo: 14, label: "Broad" },
];

/** PSI risk classes by point total. Class I is decided before points. */
const PSI_BANDS = [
  { upTo: 70, label: "II" },
  { upTo: 90, label: "III" },
  { upTo: 130, label: "IV" },
  { upTo: 180, label: "V" },
];

export function CapTool() {
  /*
   * One case, two scores. Facts are grouped by where the information
   * comes from rather than by which score wants it — see facts.ts for
   * why. Everything except age and sex is a single bit at a published
   * cut point, so it is a toggle that starts off.
   */
  const [caseState, setCaseState] = useState<CaseState>(emptyCase);
  const [focus, setFocus] = useState<Focus>("all");

  function setFact<K extends keyof CaseState>(key: K, next: CaseState[K]) {
    setCaseState((prev) => ({ ...prev, [key]: next }));
  }

  // ---- other panels ----
  const [comorbidTherapy, setComorbidTherapy] = useState(true);
  const [recentAntibiotics, setRecentAntibiotics] = useState(false);
  const [viralPanelPositive, setViralPanelPositive] = useState(true);
  const [pretest, setPretest] = useState(0.2);
  const [testId, setTestId] = useState(diagnosticTests[0].id);
  const [testResult, setTestResult] = useState<TestResult>("positive");
  const [days, setDays] = useState(5);

  const findings = useMemo(() => toPsi(caseState), [caseState]);
  const resistance = drip(toDrip(caseState));
  const severity = severeCap(toSevereCap(caseState));
  const steroids = steroidGuidance({
    severe: severity.severe,
    influenza: caseState.influenza,
    septicShock: caseState.septicShock,
  });

  const port = psi(findings);
  const blockers = classOneBlockers(findings);
  const headroom = investigationHeadroom(findings);
  const inClassOne = blockers.length === 0;
  const understated =
    !headroom.exhausted && headroom.worstCaseClass !== port.riskClass;

  const test = diagnosticTests.find((t) => t.id === testId) ?? diagnosticTests[0];
  const lr = useMemo(() => testLikelihoodRatios(test), [test]);
  const posttest = revise(pretest, testResult === "positive" ? lr.positive : lr.negative);
  const informative = canChangeManagement(pretest, lr, diagnosticThresholds);

  const regimens = regimensFor({ comorbidities: comorbidTherapy, recentAntibiotics });
  const extraDays = Math.max(0, days - durationGuidance.maxGuidelineDays);
  const withinGuideline = days <= durationGuidance.maxGuidelineDays;

  return (
    <ToolFrame meta={meta}>
      {/* ===================== LIVE SCORES =====================
          Directly above the inputs, so a toggle and its consequence
          are on screen together. Detail lives below; this is the part
          you watch while entering. */}
      <PanelRow>
        <Panel title="Scores" span={3}>
          <div className="grid grid-cols-1 gap-x-12 gap-y-6 sm:grid-cols-3">
            <ScoreStrip
              label="PSI — how sick"
              value={port.riskClass}
              detail={inClassOne ? "no points" : `${port.points} pts`}
              verdict={`${port.siteOfCare} · ${port.mortalityBand} at 30 days`}
              progress={port.points / 180}
              thresholds={[70 / 180, 90 / 180, 130 / 180]}
              bypassed={inClassOne}
              flashOn={`${port.riskClass}:${port.points}`}
            />

            <ScoreStrip
              label="DRIP — broad cover"
              value={resistance.points}
              detail={resistance.highRisk ? "broaden" : "standard"}
              verdict={
                resistance.highRisk
                  ? "Add MRSA and antipseudomonal cover"
                  : `${resistance.distanceToThreshold} more would cross`
              }
              progress={resistance.points / 14}
              thresholds={[4 / 14]}
              flashOn={resistance.points}
            />

            <ScoreStrip
              label="Severe CAP — steroids"
              value={severity.severe ? "Severe" : "Not severe"}
              detail={
                severity.metBy === "major"
                  ? "major criterion"
                  : `${severity.minorCount} of 3 minor`
              }
              verdict={
                steroids.verdict === "indicated"
                  ? "Hydrocortisone 200 mg/day, days 1–4"
                  : steroids.verdict === "outside-trial"
                    ? "Outside the trial evidence"
                    : "Steroids not indicated"
              }
              progress={severity.severe ? 1 : severity.minorCount / 3}
              segments={3}
              filled={severity.metBy === "major" ? 3 : severity.minorCount}
              flashOn={`${severity.severe}:${severity.minorCount}:${steroids.verdict}`}
            />
          </div>
        </Panel>
      </PanelRow>

      {/* ===================== THE CASE ===================== */}
      <PanelRow>
        <Panel
          title="The case"
          span={3}
          aside={
            <span className="flex items-center gap-3">
              <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">
                Show
              </span>
              <Segmented
                value={focus}
                onChange={setFocus}
                options={[
                  { value: "all", label: "All" },
                  { value: "psi", label: "PSI" },
                  { value: "drip", label: "DRIP" },
                  { value: "severe", label: "Severe" },
                ]}
              />
            </span>
          }
        >
          <div className="grid grid-cols-1 gap-x-9 gap-y-5 sm:grid-cols-2 xl:grid-cols-4">
            {CATEGORIES.map((category) => (
              <div key={category} className="flex min-w-0 flex-col gap-4">
                {category === "comorbidity" ? (
                  <div className="flex flex-col gap-1.5 border-b border-hair pb-3.5">
                    <span className="flex items-baseline justify-between gap-3">
                      <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-soft">
                        Age
                      </span>
                      <span className="tnum font-mono text-[10.5px] text-faint">
                        PSI {caseState.sex === "male" ? caseState.ageYears : caseState.ageYears - 10}
                      </span>
                    </span>
                    <span className="flex items-center gap-3">
                      <b className="tnum w-7 font-mono text-[17px] font-normal leading-none tracking-[-0.02em]">
                        {caseState.ageYears}
                      </b>
                      <input
                        type="range"
                        aria-label="Age in years"
                        className="range flex-1"
                        min={18}
                        max={100}
                        value={caseState.ageYears}
                        onChange={(e) => setFact("ageYears", e.target.valueAsNumber)}
                      />
                      <Segmented
                        value={caseState.sex}
                        onChange={(next) => setFact("sex", next)}
                        options={[
                          { value: "male", label: "M" },
                          { value: "female", label: "F" },
                        ]}
                      />
                    </span>
                  </div>
                ) : null}
              <FactorGroup label={CATEGORY_LABEL[category]}>
                {factsIn(category).map((fact) => (
                  <Factor
                    key={fact.key}
                    label={fact.label}
                    active={caseState[fact.key]}
                    onToggle={(next) => setFact(fact.key, next)}
                    inert={!isFactLive(fact, { focus, psiInClassOne: inClassOne })}
                    contributions={[
                      ...(fact.psi !== undefined ? [{ score: "PSI", points: fact.psi }] : []),
                      ...(fact.drip !== undefined ? [{ score: "DRIP", points: fact.drip }] : []),
                    ]}
                  />
                ))}
              </FactorGroup>
              </div>
            ))}
          </div>

          <p className="m-0 text-[11px] text-faint">
            Grouped by where the information comes from. Each row says which
            score it feeds; <b>Show</b> hides the others.
          </p>
        </Panel>
      </PanelRow>

      {/* ===================== ANSWERS ===================== */}
      <PanelRow>
        <Panel title="PSI in detail" span={2}>
          <BandBar
            value={port.points}
            bands={PSI_BANDS}
            bypassed={inClassOne}
            bypassNote="Not scored yet. Any factor still in black would change that."
          />

          <div className="flex flex-col gap-2">
            <p className="m-0 max-w-[70ch] text-[12.5px] leading-relaxed text-soft">
              {inClassOne ? (
                <>
                  <b className="font-semibold text-ink">Class I — lowest risk.</b>{" "}
                  Only the factors still in black can change this: the five
                  comorbidities, the four vital signs and mental status.
                </>
              ) : (
                <>
                  <b className="font-semibold text-ink">Counting points because of:</b>{" "}
                  {blockers.join(", ").toLowerCase()}.
                </>
              )}
            </p>

            {!inClassOne && understated ? (
              <p className="m-0 max-w-[70ch] text-[12.5px] leading-relaxed text-soft">
                <b className="font-semibold text-ink">
                  Class {port.riskClass} now. Could reach {headroom.worstCaseClass}.
                </b>{" "}
                {headroom.points} points sit in results you have not marked
                ({headroom.unscored.map((u) => u.label).join(", ")}). A normal
                result and a missing one score the same.
              </p>
            ) : null}

            <p className="m-0 max-w-[70ch] text-[11.5px] leading-relaxed text-faint">
              This predicts death at 30 days, not whether to admit. Oxygen, oral
              intake and who is at home are not in it.
            </p>
          </div>
        </Panel>

        <Panel title="DRIP in detail">
          <BandBar value={resistance.points} bands={DRIP_BANDS} bandNoun="" />

          {resistance.highRisk ? (
            <div className="flex flex-col gap-2">
              <p className="m-0 max-w-[52ch] text-[12.5px] leading-relaxed text-soft">
                <b className="font-semibold text-ink">
                  Add MRSA and antipseudomonal cover.
                </b>{" "}
                At this threshold, of 10 patients who really are resistant:
              </p>
              <Proportion
                total={10}
                marks={[
                  { count: 8, tone: "accent" },
                  { count: 2, tone: "harm" },
                ]}
                label="8 caught, 2 missed"
              />
              <Proportion
                total={10}
                marks={[
                  { count: 8, tone: "benefit" },
                  { count: 2, tone: "harm" },
                ]}
                label="of 10 who are not, 2 called anyway"
              />
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              <p className="m-0 max-w-[52ch] text-[12.5px] leading-relaxed text-soft">
                <b className="font-semibold text-ink">Standard CAP cover.</b>{" "}
                {resistance.distanceToThreshold} more would cross. A negative is
                the stronger result here:
              </p>
              <Proportion
                total={10}
                marks={[
                  { count: 9, tone: "benefit" },
                  { count: 1, tone: "harm" },
                ]}
                label="9 of 10 negatives are genuinely not resistant"
              />
            </div>
          )}

          <SeamNote seam={resistanceSeam} />
        </Panel>
      </PanelRow>

      {/* ===================== SEVERE CAP + STEROIDS ===================== */}
      <PanelRow>
        <Panel title="Severe CAP and steroids in detail" span={2}>
          <p className="m-0 max-w-[70ch] text-[12.5px] leading-relaxed text-soft">
            {steroids.regimen ? (
              <b className="font-semibold text-ink">{steroids.regimen}. </b>
            ) : null}
            {steroids.reason}
          </p>

          {steroids.verdict === "indicated" ? (
            <div className="flex flex-col gap-2">
              <span className="text-[10px] font-semibold uppercase tracking-[0.13em] text-faint">
                Per 100 treated · {STEROID_EFFECT.trial}
              </span>
              <div className="flex flex-col gap-1.5">
                <span className="flex flex-wrap items-center gap-3">
                  <Proportion
                    total={20}
                    marks={[{ count: STEROID_EFFECT.controlDeathsPerHundred / 5, tone: "harm" }]}
                    label={`${STEROID_EFFECT.controlDeathsPerHundred} die without`}
                  />
                </span>
                <span className="flex flex-wrap items-center gap-3">
                  <Proportion
                    total={20}
                    marks={[
                      { count: STEROID_EFFECT.treatedDeathsPerHundred / 5, tone: "harm" },
                      { count: STEROID_EFFECT.deathsAvertedPerHundred / 5, tone: "benefit" },
                    ]}
                    label={`${STEROID_EFFECT.treatedDeathsPerHundred} die with — ${STEROID_EFFECT.deathsAvertedPerHundred} averted`}
                  />
                </span>
              </div>
              <p className="m-0 text-[11.5px] text-faint">
                Number needed to treat {STEROID_EFFECT.nnt}. Each square is five
                patients.
              </p>
            </div>
          ) : null}

          <div className="flex flex-col gap-2 border-t border-hair pt-4">
            <span className="flex flex-wrap items-center gap-3 text-[12.5px] text-soft">
              <Proportion
                total={10}
                marks={[
                  { count: SEVERE_CAP_PERFORMANCE.caughtPerTen, tone: "accent" },
                  { count: SEVERE_CAP_PERFORMANCE.missedPerTen, tone: "harm" },
                ]}
              />
              <span>
                Catches about {SEVERE_CAP_PERFORMANCE.caughtPerTen} in 10 with
                severe CAP. <b className="font-semibold text-ink">Not meeting
                the criteria is not reassurance</b> — it rules in, it does not
                rule out.
              </span>
            </span>
          </div>
        </Panel>

        <Panel title="Where it is unsettled">
          <SeamNote seam={steroidSeam} />
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
                  met: label !== "Saturations 90% or more" || !caseState.hypoxaemia,
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
