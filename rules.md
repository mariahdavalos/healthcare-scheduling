Group Scheduling Rules — September 2026
These are the group's rules as we received them. We have not cleaned them up.

Scheduling period: 2026-09-01 through 2026-09-30.
Sites and shifts
Code
Site
Shifts
RBM
Riverbend Medical Center
RBM-D 07:00–17:00 · RBM-E 15:00–23:00 · RBM-N 23:00–07:00 — daily
PHC
Prairie Hills Community
PHC-D 08:00–20:00 — daily · PHC-N 20:00–08:00 — Mon–Fri


Roles: Physician and PA.
Targets
Every provider carries a load target for the scheduling period. Targets are set two ways depending on how the provider's contract is written:

target_type = SHIFTS — a count of shifts, regardless of length.
target_type = HOURS — total scheduled hours, derived from shift start and end times.

Both types appear on the same roster, and the schedule has to satisfy both.
Hard rules
Violations make a schedule unpublishable.

H1 — Every shift in coverage_requirements.csv is covered by exactly one provider.
H2 — A provider may only work at a site they are credentialed for.
H3 — Night shifts are worked only by providers with night_eligible = Y. PAs do not work nights.
H4 — No provider works two shifts that overlap or that begin on the same calendar day.
H5 — Minimum 10 hours off between the end of one shift and the start of the next.
H6 — No more than 3 consecutive night shifts.
H7 — No shift may fall inside an approved leave window, inclusive of both endpoints.
H8 — A provider's assigned load must land inside their target band: within ±1 shift of a SHIFTS target, or within ±8 hours of an HOURS target.
H9 — Every provider works a minimum of 12 shifts per scheduling period. This is a benefits eligibility floor and applies to everyone.
Soft goals
In descending priority.

S1 — Honor stated preferences. RED is a hardship request and should only be broken if nothing else works. YELLOW is a real preference. GREEN is nice to have.
S2 — Distribute night shifts equitably across night-eligible providers, scaled to target load.
S3 — Avoid island nights: a single night shift not adjacent to another night shift. Physicians strongly prefer nights in blocks.
S4 — Distribute weekend shifts (Saturday and Sunday) equitably.
Notes from the group
Night blocks of 2–3 are the norm and are considered good scheduling.
The day immediately following a night block is treated as a recovery day; providers expect not to be scheduled on it.
Preference notes are entered free-form by providers. The RED / YELLOW / GREEN tag is applied by the scheduler afterward.
Targets are renegotiated annually. Mid-period changes are rare but do happen.

