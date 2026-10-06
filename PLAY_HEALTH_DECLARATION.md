# Google Play — Health Apps Declaration (Cuore)

Copy-paste source for the Play Console form. **Play Console → Policy → App content → Health apps.**

**Before you submit, the privacy policy must already be live** at the URL below with Section 4 present. Reviewers open it and check that it names Health Connect explicitly. If it isn't live, the declaration is rejected and the clock restarts.

| | |
|---|---|
| App | Cuore (`com.cuore`) |
| Privacy policy URL | `https://cuore.health/privacy` — **verify this resolves before submitting** |
| Access | Read only. No write permissions are declared. |
| Permissions declared | 9 (see table) |

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

**Deliberately NOT declared:**

- **Height** — BMI is derived server-side from the height captured at onboarding. Declaring a permission with no corresponding feature is itself a rejection reason.
- **All write permissions** — Cuore never writes to Health Connect.
- **Background reads** — sync happens on app foreground only.

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
| Exactly these 9 types, no more | `AndroidManifest.xml`, this form, privacy policy Section 4 |
| Read-only | Manifest has zero `WRITE_*` health permissions |
| Never for ads | Privacy policy Section 4, this form |
| Revocable | In-app disconnect exists and works |

```bash
grep -oE 'android\.permission\.health\.[A-Z_]+' /Users/apple/Desktop/CuoreApp/android/app/src/main/AndroidManifest.xml | sort
```

That should print exactly 9 lines, all beginning `READ_`. If it prints a `WRITE_` or a tenth type, the declaration and the manifest have drifted apart — fix before submitting.

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

## 6. Known gap at time of writing

The in-app disconnect described in the policy and attested above is **implemented on the backend** (`DELETE /api/v1/health-metrics`, with an optional purge) and in the service facade, but the **Profile screen UI for it is Phase 6 and not built yet**.

Do not submit the declaration until that screen exists and works. Attesting that users can revoke in-app, when the app has no such control, is a false attestation — and a reviewer following the policy's own instructions ("Profile → Connected Health Sources → Disconnect") would find nothing there.
