# Schedule Audit: 2026-09-01 to 2026-09-30

**Status: NOT PUBLISHABLE. 19 hard-rule violations must be fixed first.**

10 providers · 2 sites · 142 shifts · 1404h scheduled · 10 provider(s) touched by at least one finding.

## Hard-rule violations: must fix before publishing (19)

### H1: Every shift covered by exactly one provider (1)
- **RBM-E on Tue, Sep 29 is unfilled**
  - This required shift appears in the draft schedule with no provider assigned.
  - Action: Assign a credentialed, eligible provider to this shift before publishing.

### H2: Site credentialing (1)
- **Wei Chen (P-003) is scheduled at PHC but is only credentialed for RBM**
  - PHC-D on Thu, Sep 10.
  - Action: Reassign this shift to a provider credentialed for this site.

### H3: Night eligibility / PA restriction (2)
- **Delgado, Rosa (P-004) is scheduled for a night shift (PHC-N) on Tue, Sep 15: not marked night_eligible on the roster**
  - Role: Physician, night_eligible: N.
  - Action: Reassign this night shift to an eligible physician.
- **Halvorsen, Kai (P-008) is scheduled for a night shift (RBM-N) on Fri, Sep 25: not marked night_eligible on the roster; PAs do not work nights, regardless of the night_eligible flag**
  - Role: PA, night_eligible: N.
  - Action: Reassign this night shift to an eligible physician.

### H4: No overlapping or same-day double-booking (1)
- **beth iverson (P-009) is double-booked: PHC-D on Mon, Sep 14 and RBM-E on Mon, Sep 14 (both begin on the same calendar day and their times overlap)**
  - PHC-D runs 8 AM to 8 PM on Mon, Sep 14, and RBM-E runs 3 PM to 11 PM on Mon, Sep 14.
  - Action: Remove one of these two assignments and find coverage for whichever shift is dropped.

### H5: Minimum 10 hours off between shifts (6)
- **beth iverson (P-009) only gets 9.0 hours of rest between shifts on Tue, Sep 1 and Wed, Sep 2**
  - RBM-E ends at 11 PM on Tue, Sep 1, and PHC-D starts at 8 AM on Wed, Sep 2. That leaves 9.0 hours of rest; the minimum is 10.
  - Action: Push the second shift later or reassign it to give this provider a full rest period.
- **Jansen, Luis (P-010) only gets 8.0 hours of rest between shifts on Tue, Sep 29 and Wed, Sep 30**
  - RBM-N ends at 7 AM on Tue, Sep 29, and RBM-E starts at 3 PM on Wed, Sep 30. That leaves 8.0 hours of rest; the minimum is 10.
  - Action: Push the second shift later or reassign it to give this provider a full rest period.
- **Wei Chen (P-003) only gets 1.0 hours of rest between shifts on Wed, Sep 9 and Thu, Sep 10**
  - RBM-N ends at 7 AM on Wed, Sep 9, and PHC-D starts at 8 AM on Thu, Sep 10. That leaves 1.0 hours of rest; the minimum is 10.
  - Action: Push the second shift later or reassign it to give this provider a full rest period.
- **Ellison, Tom (P-005) only gets 0.0 hours of rest between shifts on Fri, Sep 11 and Sat, Sep 12**
  - RBM-N ends at 7 AM on Fri, Sep 11, and RBM-D starts at 7 AM on Sat, Sep 12. That leaves 0.0 hours of rest; the minimum is 10.
  - Action: Push the second shift later or reassign it to give this provider a full rest period.
- **Ellison, Tom (P-005) only gets 9.0 hours of rest between shifts on Wed, Sep 16 and Thu, Sep 17**
  - RBM-E ends at 11 PM on Wed, Sep 16, and PHC-D starts at 8 AM on Thu, Sep 17. That leaves 9.0 hours of rest; the minimum is 10.
  - Action: Push the second shift later or reassign it to give this provider a full rest period.
- **Gupta, Anil (P-007) only gets 0.0 hours of rest between shifts on Mon, Sep 21 and Tue, Sep 22**
  - RBM-N ends at 7 AM on Mon, Sep 21, and RBM-D starts at 7 AM on Tue, Sep 22. That leaves 0.0 hours of rest; the minimum is 10.
  - Action: Push the second shift later or reassign it to give this provider a full rest period.

### H6: Max 3 consecutive night shifts (1)
- **Gupta, Anil (P-007) works 5 nights in a row, from Thu, Sep 17 through Mon, Sep 21**
  - Nights: Thu, Sep 17 (PHC-N), Fri, Sep 18 (RBM-N), Sat, Sep 19 (RBM-N), Sun, Sep 20 (RBM-N), Mon, Sep 21 (RBM-N). The cap is 3 nights in a row.
  - Action: Break this run after 3 nights; reassign the remaining 2 night shift(s) to someone else.

### H7: No shift during approved leave (1)
- **Bhatt, Priya (P-002) is scheduled for RBM-D on Thu, Sep 24, inside their approved PTO (Tue, Sep 22 to Sat, Sep 26)**
  - Approved leave window: Tue, Sep 22 to Sat, Sep 26 (PTO).
  - Action: Remove this shift from the provider and reassign coverage.

### H8: Assigned load within target band (5)
- **Arnold, Marcus (P-001) is under target: 13 shifts assigned, band is 15 ± 1 shift**
  - Target type: SHIFTS. Allowed range: 14 to 16.
  - Action: Add shifts for this provider, or confirm the target is still correct.
- **Delgado, Rosa (P-004) is under target: 8 shifts assigned, band is 10 ± 1 shift**
  - Target type: SHIFTS. Allowed range: 9 to 11.
  - Action: Add shifts for this provider, or confirm the target is still correct.
- **Farouk, Nadia (P-006) is over target: 168h assigned, band is 132h ± 8h**
  - Target type: HOURS. Allowed range: 124 to 140.
  - Action: Move some of this provider’s shifts to someone under target.
- **beth iverson (P-009) is over target: 146h assigned, band is 120h ± 8h**
  - Target type: HOURS. Allowed range: 112 to 128.
  - Action: Move some of this provider’s shifts to someone under target.
- **Jansen, Luis (P-010) is over target: 18 shifts assigned, band is 14 ± 1 shift**
  - Target type: SHIFTS. Allowed range: 13 to 15.
  - Action: Move some of this provider’s shifts to someone under target.

### H9: Minimum 12 shifts per period (1)
- **Delgado, Rosa (P-004) has only 8 shifts this period; floor is 12**
  - This is a benefits eligibility floor and applies regardless of this provider's target type.
  - Action: Add shifts to bring this provider up to at least 12.

## Soft-goal issues: should fix, in priority order (27)

### S1: Honor stated preferences (8)
- [RED] Wei Chen (P-003) asked for Tue, Sep 15 off but is scheduled RBM-D
  - Action: RED is a hardship request: only break it if nothing else works. Re-check whether another provider can cover.
- [RED] Arnold, Marcus (P-001) asked for Sat, Sep 12 off but is scheduled PHC-D
  - Action: RED is a hardship request: only break it if nothing else works. Re-check whether another provider can cover.
- [RED] Delgado, Rosa (P-004) has a standing "no overnight shifts" agreement but is scheduled for 1 night shift(s): Tue, Sep 15
  - Action: RED is a hardship request: only break it if nothing else works. Re-check whether another provider can cover.
- [YELLOW] Jansen, Luis (P-010) asked for no more than 2 nights in a row but has 3 in a row (Mon, Sep 21 to Wed, Sep 23)
  - Action: Swap this shift with another provider if the schedule allows it.
- [YELLOW] Halvorsen, Kai (P-008) asked for no nights between Sun, Sep 20 and Sat, Sep 26 but is scheduled RBM-N on Fri, Sep 25
  - Action: Swap this shift with another provider if the schedule allows it.
- [YELLOW] Gupta, Anil (P-007) asked for the Sat, Sep 19/Sun, Sep 20 weekend off but is scheduled RBM-N on Sat, Sep 19, RBM-N on Sun, Sep 20
  - Action: Swap this shift with another provider if the schedule allows it.
- [GREEN] Bhatt, Priya (P-002) prefers day shifts between Sun, Sep 6 and Sat, Sep 12 but has RBM-E on Sat, Sep 12
  - Action: Swap this shift with another provider if the schedule allows it.
- [GREEN] beth iverson (P-009) prefers PHC over RBM. Currently 8 PHC vs 6 RBM shifts (informational; can't tell from the data whether RBM assignments were unavoidable for coverage)
  - Action: No action needed. The split already favors the preferred site.

### S2: Equitable night-shift distribution (2)
- Bhatt, Priya (P-002) is scheduled for 3 night shift(s), well below the night-eligible group average of 7.1
  - Action: This provider has room to pick up more night shifts if others are overloaded.
- Gupta, Anil (P-007) is scheduled for 13 night shift(s), well above the night-eligible group average of 7.1
  - Action: Move some of this provider’s night shifts to a night-eligible physician with fewer nights.

### S3: Avoid island nights / honor recovery days (16)
- Delgado, Rosa (P-004) has a single, isolated night shift on Tue, Sep 15 (PHC-N), not adjacent to another night
  - Action: Pair this with an adjacent night shift, or move it to someone already working a night block nearby.
- Farouk, Nadia (P-006) has a single, isolated night shift on Mon, Sep 7 (PHC-N), not adjacent to another night
  - Action: Pair this with an adjacent night shift, or move it to someone already working a night block nearby.
- Farouk, Nadia (P-006) has a single, isolated night shift on Wed, Sep 9 (PHC-N), not adjacent to another night
  - Action: Pair this with an adjacent night shift, or move it to someone already working a night block nearby.
- Farouk, Nadia (P-006) has a single, isolated night shift on Fri, Sep 18 (PHC-N), not adjacent to another night
  - Action: Pair this with an adjacent night shift, or move it to someone already working a night block nearby.
- Halvorsen, Kai (P-008) has a single, isolated night shift on Fri, Sep 25 (RBM-N), not adjacent to another night
  - Action: Pair this with an adjacent night shift, or move it to someone already working a night block nearby.
- Arnold, Marcus (P-001) has a single, isolated night shift on Tue, Sep 8 (PHC-N), not adjacent to another night
  - Action: Pair this with an adjacent night shift, or move it to someone already working a night block nearby.
- Arnold, Marcus (P-001) has a single, isolated night shift on Mon, Sep 14 (PHC-N), not adjacent to another night
  - Action: Pair this with an adjacent night shift, or move it to someone already working a night block nearby.
- Arnold, Marcus (P-001) has a single, isolated night shift on Wed, Sep 16 (PHC-N), not adjacent to another night
  - Action: Pair this with an adjacent night shift, or move it to someone already working a night block nearby.
- Jansen, Luis (P-010) has a single, isolated night shift on Fri, Sep 4 (PHC-N), not adjacent to another night
  - Action: Pair this with an adjacent night shift, or move it to someone already working a night block nearby.
- Jansen, Luis (P-010) has a single, isolated night shift on Sun, Sep 6 (RBM-N), not adjacent to another night
  - Action: Pair this with an adjacent night shift, or move it to someone already working a night block nearby.
- Jansen, Luis (P-010) has a single, isolated night shift on Sat, Sep 12 (RBM-N), not adjacent to another night
  - Action: Pair this with an adjacent night shift, or move it to someone already working a night block nearby.
- Jansen, Luis (P-010) is scheduled on Wed, Sep 30, the day right after a 2-night block (Mon, Sep 28 to Tue, Sep 29)
  - Action: Give this provider the day after the night block off; reassign the recovery-day shift.
- Bhatt, Priya (P-002) has a single, isolated night shift on Wed, Sep 30 (RBM-N), not adjacent to another night
  - Action: Pair this with an adjacent night shift, or move it to someone already working a night block nearby.
- Wei Chen (P-003) is scheduled on Thu, Sep 10, the day right after a 3-night block (Mon, Sep 7 to Wed, Sep 9)
  - Action: Give this provider the day after the night block off; reassign the recovery-day shift.
- Ellison, Tom (P-005) is scheduled on Sat, Sep 12, the day right after a 2-night block (Thu, Sep 10 to Fri, Sep 11)
  - Action: Give this provider the day after the night block off; reassign the recovery-day shift.
- Gupta, Anil (P-007) is scheduled on Tue, Sep 22, the day right after a 5-night block (Thu, Sep 17 to Mon, Sep 21)
  - Action: Give this provider the day after the night block off; reassign the recovery-day shift.

### S4: Equitable weekend distribution (1)
- Delgado, Rosa (P-004) works 1 weekend shift(s), vs. a group average of 3.2
  - Action: This provider has room to take on more weekend coverage if others are overloaded.

## Data quality notes: can't be fully verified (3)

- Ellison, Tom (P-005) has no load target on the roster, so H8 can't be evaluated
  - providers.csv has no target_type/target_value for this provider. They are currently assigned 15 shifts, but there's nothing to compare that against.
- P-005 (Ellison, Tom) is missing a load target (target_type/target_value). Load-band checks cannot run for this provider.
  - Source: providers.xlsx
- P-001 is listed as "Dr Arnold Arnold" here but "Arnold, Marcus" on the roster. Matched by provider_id; please confirm this is the same person.
  - Source: preferences.xlsx

## Totals by rule

| Rule | Count |
| --- | --- |
| Source data quality | 2 |
| H1: Every shift covered by exactly one provider | 1 |
| H2: Site credentialing | 1 |
| H3: Night eligibility / PA restriction | 2 |
| H4: No overlapping or same-day double-booking | 1 |
| H5: Minimum 10 hours off between shifts | 6 |
| H6: Max 3 consecutive night shifts | 1 |
| H7: No shift during approved leave | 1 |
| H8: Assigned load within target band | 6 |
| H9: Minimum 12 shifts per period | 1 |
| S1: Honor stated preferences | 8 |
| S2: Equitable night-shift distribution | 2 |
| S3: Avoid island nights / honor recovery days | 16 |
| S4: Equitable weekend distribution | 1 |
