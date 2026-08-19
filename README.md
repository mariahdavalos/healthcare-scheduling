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


## Sizing the problem before the solver sees it

### First parameter of attack

Days. Staffing (providers and shifts) and sites are non negotiables in the real world. While mathematically shifts and shifts per day is the most impactful to the result, we aren't able to dictate to a client how to organize their business structure. 

### Shrinking proposals

#### Solve by batching

Solve in batches, a week and a couple days or a week and a half at a time. While a week is a shorter batch, the overlap of +- 2 days is critical to allow for cushioning night shifts and rest periods. It's important that each batch builds on the context of the next to avoid falling into the shortcut trap. This is actually a common solution in optimization of MCPs for large data LLMs called a "rolling horizon" and has been proven to improve efficiency. 

##### Cost

As with any batching, context is limited and future looking analysis is non functional. The fix for the batched schedule may be the best given the current week (and change), but with the context of following weeks the schedule may have been more optimal if a day or shift had been switched out. Once the first batch has passed, its context isn't easily modified, if it can be at all.  

##### Metrics

The audit tool is able to verify that schedules are compatible with each batch as we iterate. 

#### Immutables and human-in-the-loop ideology

Rather than having the solver tackle the entire month from nothing, humans can define immutables and have the solver fill in the gaps. Things like hardship requests are non negotiable, and should not need to be moved around by the solver. Instead, solve around the immutables. 

Humans can also make calls that are obvious to us, but not the solver, such as physican credentials being identical, and thus allowing the solver to treat them interchangeably in scheduling as one unit. 

This is similar to prompt optimization. Generic requests to LLMs will always return less accurate, less meaningful results that consume more tokens than structured prompts with clear definitions that help the LLM define parameters and fill in the blanks as needed.

##### Cost 

Human review and time costs money and requires context. The extra staffing and funding may not be practical, or require more time on the company's side to manage as part of the product suite (and thus time and money being offloaded onto the company rather than the client). 

##### Metrics

This would likely require some A/B testing to verify performance. We could set up a test against some pre defined goals, like how many iterations or how much time it takes to correctly resolve the schedule with and without human intervention, and another with immutables, and a third with both, then compare the results across the board. 

### UI Offloading

Human review specifically, not immutables, should be moved to the UI. These are judgement calls based on context and experience; while we can leverage them in the solver and formulas, it's more measurably more reliable and less expensive to handle them on a case by case audit to catch all edge cases. Reliability is typically a client's top 5 priority, and can make or break a reputation; getting it right is critical and passing it off to the solver is a hit or miss in results. 

### Shortcut trap

Asking the solver to just handle one week at a time would be fast and similar to our batching approach for optimization, but without the context reconciliation of each week, nights and rest periods go unresolved and any rules that require month-long context (like needing 10 shifts over the 1 month period) are impossible to keep track of on an isolated per-week basis context. It will just bring us back to our original problem.
