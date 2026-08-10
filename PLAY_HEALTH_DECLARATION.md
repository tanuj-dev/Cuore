# Google Play — Health Apps Declaration (Cuore)

Copy-paste source for the Play Console form. **Play Console → Policy → App content → Health apps.**

**Before you submit, the privacy policy must already be live** at the URL below with Section 4 present. Reviewers open it and check that it names Health Connect explicitly. If it isn't live, the declaration is rejected and the clock restarts.

| | |
|---|---|
| App | Cuore (`com.cuore`) |
| Privacy policy URL | `https://cuore.health/privacy` — **verify this resolves before submitting** |
| Access | Read only. No write permissions are declared. |
| Permissions declared | 10 (see table) |

> The form's exact field labels change from time to time. Treat the headings below as *content to supply*, and map them onto whatever the console actually asks for.

---

## 1. Core use case

Health Connect requires you to pick a use case from Google's fixed list. The honest fit for Cuore is **fitness and wellness tracking** — not medical care, not patient monitoring, and not health research.

This matters: Cuore's own Terms describe the Platform as "strictly non-clinical", and claiming a medical use case here would contradict that and invite scrutiny the app is not positioned for.

**Suggested description:**

> Cuore is a preventive wellness app. It reads health and fitness data the user already keeps in Health Connect so that their in-app health dashboard and their Cuore Score — a lifestyle score covering fitness, sleep, nutrition and stress — reflect real measurements instead of relying on manual entry and recall.

---

## 2. Per-permission justification

Every justification must name a **specific, user-visible feature**. Vague purposes ("to improve your experience", "for analytics") are a standard rejection reason.

| Health Connect data type | Permission | Justification to give |
|---|---|---|
| Heart rate | `READ_HEART_RATE` | Displayed as a vital on the user's My Health screen, alongside the values they enter manually. |
| Resting heart rate | `READ_RESTING_HEART_RATE` | Displayed as a vital on the user's My Health screen. |
| Blood pressure | `READ_BLOOD_PRESSURE` | Displayed as a vital on the user's My Health screen, with the same normal/borderline/high banding applied to manually entered readings. |
| Blood glucose | `READ_BLOOD_GLUCOSE` | Displayed as a vital on the user's My Health screen. |
| Oxygen saturation | `READ_OXYGEN_SATURATION` | Displayed as a vital on the user's My Health screen. |
| Weight | `READ_WEIGHT` | Maintains the user's weight and BMI history chart. |
| Steps | `READ_STEPS` | Used to calculate the fitness component of the user's Cuore Score, which previously relied on the user estimating their own weekly activity. |
| Exercise | `READ_EXERCISE` | Used to calculate the fitness component of the user's Cuore Score. |
| Sleep | `READ_SLEEP` | Used to calculate the sleep component of the user's Cuore Score, which previously relied on the user estimating their own nightly sleep hours. |
| Height | `READ_HEIGHT` | Read once during account setup to pre-fill the user's height, which the app uses to derive BMI. |

**Deliberately NOT declared:**

- **All write permissions** — Cuore never writes to Health Connect.
- **Background reads** — sync happens on app foreground only.

> **Height was added later.** It was originally excluded because nothing used it, and declaring a permission with no corresponding feature is itself a rejection reason. Onboarding pre-fill gave it a feature, so it went back in. If you have already submitted the declaration without it, this needs resubmitting — a permission present in the manifest but absent from the declaration is a mismatch reviewers check for.

**iOS reads four types Android cannot:** date of birth, biological sex, waist circumference and height are used to pre-fill account setup. Health Connect has no date-of-birth or biological-sex record at all, so Android users always enter age and gender by hand. Nothing to declare here — this section is Health Connect only — but expect the two platforms' setup flows to differ.

---

## 3. Required confirmations

The form asks you to attest to these. All are true of the implementation:

- [x] Health Connect data is **not** used for advertising or marketing
- [x] Health Connect data is **not** sold, rented, or leased
- [x] Health Connect data is **not** shared with data brokers or with third parties for their own purposes
- [x] The app requests **only** permissions it actively uses
- [x] The user can revoke access at any time (in-app disconnect, plus Health Connect settings)
- [x] The privacy policy discloses Health Connect access explicitly

One nuance worth being ready for: Cuore **does** share health data with the user's referring doctor, with their consent. That is disclosed in Section 5 of the privacy policy and is a first-party feature of the product, not third-party sharing for the recipient's own purposes. If the form or a reviewer asks about onward sharing, describe it that way rather than answering a flat "no sharing".

---

## 4. Consistency check — do this before submitting

Rejections most often come from the declaration, the policy, and the app disagreeing. All three must match:

| Claim | Where it must hold |
|---|---|
| Exactly these 10 types, no more | `AndroidManifest.xml`, this form, privacy policy Section 4 |
| Read-only | Manifest has zero `WRITE_*` health permissions |
| Never for ads | Privacy policy Section 4, this form |
| Revocable | In-app disconnect exists and works |

```bash
grep -oE 'android\.permission\.health\.[A-Z_]+' /Users/apple/Desktop/CuoreApp/android/app/src/main/AndroidManifest.xml | sort
```

That should print exactly 10 lines, all beginning `READ_`. If it prints a `WRITE_` or an eleventh type, the declaration and the manifest have drifted apart — fix before submitting.

---

## 5. Sequencing

The declaration gates **production release**, not development. You can build, test on internal testing, and iterate while it sits in review.

Recommended order:

1. Publish the privacy policy (Section 4 live)
2. Submit this declaration
3. Continue development in parallel — do not wait
4. Ship once approved

The one thing that will waste weeks is submitting before the policy is live, getting rejected, and re-queuing.

---

## 6. Status of the attestations

The in-app disconnect the policy points users to now exists: **Profile → Connected Health Sources → Disconnect**, offering "Stop syncing" or "Stop and delete". The backend endpoint (`DELETE /api/v1/health-metrics`, optional `?purge=true`) is live behind the feature flag. That attestation is truthful.

Remaining before submission:

1. **Privacy policy must be published.** It is written and committed but not deployed.
2. **`HEALTH_SYNC_ENABLED` must be true on the production service** for the disconnect to work for real users. It is currently on staging only, which is correct while the feature is dark — but a reviewer testing a production build would find every health route returning 503.
3. **Android has never been tested on a device.** Health Connect is a separate adapter from HealthKit and has not executed once. Declaring behaviour that has never run is a risk worth closing first.
