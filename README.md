# Schedule auditor

Ingests a draft schedule plus its source files and reports every hard-rule
violation (H1–H9) and soft-goal problem (S1–S4) in it, per the `rules.md`.

## Running the audit

```
npm install
npm run audit
```

This reads everything in `data/` and writes:

- `output/audit-result.json`: machine-readable, every finding typed and structured, for anything downstream to consume.
- `output/audit-report.md`: the same findings, formatted for a human to scan.
- `web/src/data/audit-result.json`: the same JSON, copied into the React dashboard's source tree.

## Building the dashboard

```
npm run web:install    # once
npm run audit          # regenerates web/src/data/audit-result.json
npm run web:dev        # dev server with hot reload
# or: npm run web:build && npm run web:preview
```

## The "model" seam

One piece of this calls for an LLM: `preferences.csv` notes are
free text.
Turning that into something a rule engine can check (which dates, what kind of constraint, how confident) is an extraction task a model handles well and pattern-matching doesn't, in general.

`src/modelLayer.ts::interpretPreferences` handles that. It's documented in-file with the prompt this would run per-row in production. I don't have an API key for this project, so the function is a deterministic, hand-verified stand-in: regex-based extraction that reproduces the same structured output a model call would have returned for this dataset's 11 preference rows. Everything downstream (`softGoals.ts`) consumes only the structured `InterpretedPreference` shape, so wiring in a real model call later means replacing this one function's body.

## Adding a rule

A hard rule is a function in `src/rules/hardRules.ts` that takes the
normalized `RawData` and returns `Finding[]`; a soft goal is the same shape in `softGoals.ts`. Both get registered in one line in that file's `checkHardRules` / `checkSoftGoals`. 

## Assessment

### Assumptions and judgment calls

- **The source files are `.xlsx`, not `.csv`.** The brief describes CSVs; what's actually in `data/` is spreadsheets with the same columns.
- **`preferences.xlsx`'s `applies_to` column has three different date formats plus the literal string `"recurring"`** (ISO, US slash, free-text month names). `parseFlexibleDate` handles all four rather than assuming one.
- **Free-text preference notes need interpretation, not just parsing.** "No more than 2 nights in a row" and "week of the 20th, ish" aren't structured data. `modelLayer.ts` is a hand-verified stand-in for what would be a real model call in production (see below); the judgment call was which keyword patterns map to which structured constraint, plus a fallback rule (a RED/YELLOW preference tied to a specific date with no other match becomes a full day-off request).
- **"Week of the 20th, ish"** forced a concrete choice (Sunday-through-Saturday week) where the source data is deliberately fuzzy. 
- **Provider identity is always joined on `provider_id`, never on name.** `preferences.xlsx` lists P-001 as "Dr Arnold Arnold"; the roster has "Arnold, Marcus." Joining on name would have silently mismatched or duplicated providers; joining on ID and separately flagging the name mismatch as a data-quality note keeps the audit correct while still surfacing the discrepancy to a human.
- **A missing load target (P-005) blocks H8 for that provider specifically**, reported as a `DATA_ISSUE`, not skipped silently and not defaulted to some assumed target.
- **H8 and H9 are independent, not nested.** A provider can sit inside their personal target band (H8) while still missing the group-wide 12-shift floor (H9), so both are checked separately rather than treating one as a special case of the other.
- **S2/S4 "equitable" has no numeric threshold in `rules.md`.** The flagging rule (more than 50% relative deviation from the group average, and at least a 2-shift absolute difference) is invented, not derived. 
- **"Island nights" and "recovery days" aren't numbered rules.** They only appear in the group's free-form notes at the bottom of `rules.md`.

### What I'd do with two more weeks

- **Wire a real model into the preference-interpretation seam** and stress-test it against a much larger, messier preference set.
- **Build the rolling-horizon decomposition** this dataset is already brushing up against (30 days at 10 providers/2 sites is inside range for a monolithic solve; Jeff's real 42-provider/5-site group would not be) rather than waiting until it's a production incident.
- **A plain-English rule-adding interface**, so a new rule doesn't require an engineer: a scheduler describes it, a model turns that into a structured constraint, and its plain-English restatement gets confirmed by a human before it's live, the same pattern already used for preference interpretation.
- **An automated test suite over the rule engine.** There isn't one yet.
- **Month-over-month history.** The tool is single-period today. A lot of scheduler value shows up in trends a single audit can't see: is the same provider always under target, are S3 violations clustering on the same people every month.
- **A better UI and branding** Current branding is a little flat and monochromatic. Could use some sparkle.

### Where an LLM earns its place here, and where it would be a mistake

It earns its place at the one genuine natural-language boundary in this system: turning a short, ambiguous, human-authored sentence into a structured, checkable constraint. `modelLayer.ts`'s preference interpretation is the real example already in this repo; a plain-English "add a rule" interface would be the same pattern applied to `rules.md` itself. 

It would be a mistake almost everywhere else in this system, including:

- **The rule checks themselves (H1-H9, S1-S4).**
- **Generating the schedule itself.** That's not a language-generation task.
- **The date and time formatting just added to make finding text readable.** 
