import { formatWhereAmI } from './routeContext';

/**
 * Cuore app knowledge base for the AI assistant.
 * Each entry maps intent keywords to a response + optional navigation action.
 *
 * Keep copy aligned with real navigation (see src/navigation/index.js): five main
 * tabs are Today, Explore, Trend (Predict stack), Notes, and Profile.
 *
 * Optional `id` is used by AIService for context-aware behaviour (e.g. greetings).
 * `response` may be `(userInput, { currentRoute }) => string` for dynamic copy.
 */

export const APP_NAME = 'Cuore';

export const SCREENS = {
  TODAY: 'Today',
  EXPLORE: 'Explore',
  TREND: 'Trend',
  NOTES: 'Notes',
  PROFILE: 'Profile',
  SCORE: 'Score',
  HEALTH: 'Health',
  NUTRITION: 'Nutrition',
  FITNESS: 'Fitness',
  MIND: 'Mind',
  TOBACCO: 'Tobacco',
  HEALTH_RECORDS: 'HealthRecords',
  EDIT_PROFILE: 'EditProfile',
  SUPPORT: 'Support',
  KNOWLEDGE: 'CuoreKnowledge',
  PREDICT: 'Predict',
  CHECKOUT: 'Checkout',
  MEAL_BUILDER: 'MealBuilder',
  RECIPE: 'Recipe',
  SEARCH: 'Search',
  DOCTOR: 'Doctor',
  SCORE_METER: 'ScoreMeter',
  PAYMENT_DETAILS: 'PaymentDetails',
};

/** Long-form reference for future LLM backends or onboarding copy (rule engine uses INTENTS). */
export const APP_REFERENCE_GUIDE = `
Cuore (${APP_NAME}) is a cardiac-focused wellness app. Main areas:
- Today (home): daily tasks, alerts, quick entry to nutrition/fitness/mind/tobacco, meal programmes, doctor-related alerts.
- Explore: discover content and open modules (nutrition, fitness, mind, tobacco, recipes, meal builder, health, records, search).
- Trend: Predict stack — charts, heart score history, links to Health, Health Records, and Score.
- Notes: personal health notes / journal tab.
- Profile: account, photo, edit profile, doctor & caregiver contacts, health records, support, terms, delete account, renew subscription, assigned doctor view.

Subscriptions (in-app): "Cuore Monthly" (~₹99/mo) and annual "Thrive" (~₹999/yr, best value in app). Purchase/manage via Checkout and Profile → Renew Subscription. Some accounts may receive complimentary access depending on your organisation or promotion.

Doctor check-in: On Today, if an alert says check-in was requested by your doctor, use Accept or Decline to respond.

In-app assistant: uses your current route when possible, skips redundant navigation, opens Profile sub-screens via nested navigation (e.g. Renew Subscription, Support), and avoids tab jumps while you are still on Login / Onboarding / OTP unless the target is Checkout or another pre-home screen.

This assistant helps you navigate and understand the app; it does not provide medical diagnosis or replace your clinician.
`.trim();

export const QUICK_ACTIONS = [
  { label: '🏠 Go to Today', intent: 'today' },
  { label: '❤️ My Heart Score', intent: 'heart score' },
  { label: '📊 Trend & predictions', intent: 'trends' },
  { label: '🥗 Nutrition', intent: 'nutrition' },
  { label: '🧠 Mental Health', intent: 'mind' },
  { label: '💪 Fitness', intent: 'fitness' },
  { label: '👨‍⚕️ Doctor check-in', intent: 'doctor check-in' },
  { label: '💳 Plans & billing', intent: 'subscription' },
];

/**
 * Intent patterns: each entry has:
 *  - patterns: array of regex patterns to match user input
 *  - response: string or function(input) => string
 *  - navigate: optional screen name
 *  - suggestions: follow-up quick suggestion chips
 */
export const INTENTS = [
  // ── Greetings ────────────────────────────────────────────────
  {
    id: 'greeting',
    patterns: [/^(hi|hello|hey|hiya|howdy|greetings|good (morning|afternoon|evening))/i],
    response:
      "Hello! 👋 I'm your Cuore AI assistant. I can help you navigate the app, understand your health data, and get the most out of your cardiac wellness journey. What would you like to know?",
    suggestions: ['❤️ My Heart Score', '📊 Health Trends', '🥗 Nutrition', '💪 Fitness'],
  },

  // ── Where am I (route-aware via AIService context) ───────────
  {
    patterns: [
      /\bwhere am i\b/i,
      /what screen am i on/i,
      /current (screen|page)/i,
      /which (tab|page) am i on/i,
      /\bmy location in the app\b/i,
    ],
    response: (_input, ctx) => formatWhereAmI(ctx?.currentRoute),
    suggestions: ['🏠 Today', '🧭 Explore', '👤 Profile', '💳 Subscription'],
  },

  // ── What can you do / help ────────────────────────────────────
  {
    patterns: [
      /what (can|do) you (do|know|help)/i,
      /how (can|do) (you|i) (help|use)/i,
      /\bhelp\b/i,
      /what.*features/i,
    ],
    response:
      "I can help you with:\n\n• **Navigate** to any screen in Cuore\n• **Explain** your heart score & health metrics\n• **Guide** you through nutrition, fitness & mental health tracking\n• **Troubleshoot** issues with your account or data\n• **Understand** health trends & predictions\n\nJust ask me anything!",
    suggestions: ['❤️ Heart Score', '🥗 Nutrition', '💪 Fitness', '🧠 Mental Health'],
  },

  // ── Today / Dashboard ─────────────────────────────────────────
  {
    patterns: [
      /\btoday\b/i,
      /\bdashboard\b/i,
      /\bhome\b/i,
      /main screen/i,
      /go (to )?(home|main|today)/i,
    ],
    response:
      "The **Today** screen is your daily cardiac health dashboard. It shows your daily tasks, meal tracking, heart health activities, and quick access to fitness, nutrition, and mind modules. Let me take you there!",
    navigate: SCREENS.TODAY,
    suggestions: ['❤️ Heart Score', '🥗 Nutrition', '💪 Fitness'],
  },

  // ── Heart Score ───────────────────────────────────────────────
  {
    patterns: [
      /heart score/i,
      /cuore score/i,
      /cardiac score/i,
      /health score/i,
      /\bscore\b/i,
    ],
    response:
      "Your **Cuore Heart Score** is a personalised metric that reflects your overall cardiac health based on lifestyle factors like nutrition, fitness, sleep, stress, and tobacco use. A higher score means a healthier heart!\n\nYou can find it in the **Trend** tab or directly on the Score screen.",
    navigate: SCREENS.SCORE,
    suggestions: ['📊 View Trends', '🥗 Improve Nutrition', '💪 Add Exercise'],
  },

  // ── Trends / Predict / Analytics ─────────────────────────────
  {
    patterns: [
      /\btrend(s)?\b/i,
      /\bpredict\b/i,
      /\banalytics\b/i,
      /health data/i,
      /\bstatistics\b/i,
      /\bprogress\b/i,
      /how (am i|is my health)/i,
    ],
    response:
      "The **Trend** tab shows your health analytics and predictions over time. You can view your heart score history, health metrics, and get AI-powered predictions about your cardiac health trajectory.",
    navigate: SCREENS.TREND,
    suggestions: ['❤️ Heart Score', '🏥 Health Records', '📋 Notes'],
  },

  // ── Nutrition ─────────────────────────────────────────────────
  {
    patterns: [
      /\bnutrition\b/i,
      /\bfood\b/i,
      /\beat(ing)?\b/i,
      /\bdiet\b/i,
      /\bcalorie(s)?\b/i,
      /\bmeal(s)?\b/i,
      /meal (plan|track|builder)/i,
      /\brecipe(s)?\b/i,
      /what (should i|to) eat/i,
    ],
    response:
      "Cuore's **Nutrition** module helps you track meals, count calories, and follow heart-healthy eating plans. You can:\n\n• Log meals with the Meal Builder\n• Browse heart-healthy recipes\n• Track your daily calorie and macronutrient goals\n• Get personalised nutrition recommendations\n\nHead to the Nutrition screen to get started!",
    navigate: SCREENS.NUTRITION,
    suggestions: ['🍳 Meal Builder', '📖 Recipes', '💪 Fitness', '❤️ Heart Score'],
  },

  // ── Fitness ───────────────────────────────────────────────────
  {
    patterns: [
      /\bfitness\b/i,
      /\bexercise(s)?\b/i,
      /\bworkout(s)?\b/i,
      /\bactivity\b/i,
      /\bsteps\b/i,
      /\brun(ning)?\b/i,
      /\bwalk(ing)?\b/i,
      /physical (health|activity)/i,
    ],
    response:
      "The **Fitness** module tracks your physical activities and provides guided workout plans tailored for cardiac health. You can log exercises, monitor activity levels, and see how fitness impacts your heart score.",
    navigate: SCREENS.FITNESS,
    suggestions: ['💪 View Workouts', '❤️ Heart Score', '🥗 Nutrition'],
  },

  // ── Mental Health / Mind ──────────────────────────────────────
  {
    patterns: [
      /\bmind\b/i,
      /mental health/i,
      /\bstress\b/i,
      /\banxiety\b/i,
      /\bmeditat(e|ion)\b/i,
      /\bsleep\b/i,
      /\brelax(ation)?\b/i,
      /\bwellbeing\b/i,
      /feel(ing)? (stressed|anxious|worried|bad)/i,
    ],
    response:
      "The **Mind** module in Cuore helps you manage stress and mental wellbeing — key factors in cardiac health. It includes relaxation techniques, mindfulness exercises, and stress tracking. Mental and heart health are deeply connected!",
    navigate: SCREENS.MIND,
    suggestions: ['😌 Relax', '💪 Fitness', '🥗 Nutrition', '❤️ Heart Score'],
  },

  // ── Tobacco ───────────────────────────────────────────────────
  {
    patterns: [
      /\btobacco\b/i,
      /\bsmok(e|ing)\b/i,
      /\bcigarette(s)?\b/i,
      /\bnicotine\b/i,
      /quit smoking/i,
      /stop smoking/i,
    ],
    response:
      "Cuore's **Tobacco** module helps you track and reduce tobacco use — one of the biggest risk factors for cardiac disease. You can log cigarettes, set quit goals, and see how quitting improves your heart score.",
    navigate: SCREENS.TOBACCO,
    suggestions: ['❤️ Heart Score', '🧠 Mental Health', '💪 Fitness'],
  },

  // ── Health Records ────────────────────────────────────────────
  {
    patterns: [
      /health records?/i,
      /medical records?/i,
      /\breports?\b/i,
      /\bdocuments?\b/i,
      /\bprescription(s)?\b/i,
      /\btest results?\b/i,
      /\blab results?\b/i,
    ],
    response:
      "You can store and view all your **Health Records** in one place — lab reports, prescriptions, test results, and medical documents. These records help your Cuore score accurately reflect your health history.",
    navigate: { parent: 'Profile', screen: 'HealthRecords' },
    suggestions: ['❤️ Heart Score', '📊 Trends', '👤 Profile'],
  },

  // ── Explore / Knowledge ───────────────────────────────────────
  {
    patterns: [
      /\bexplore\b/i,
      /\bknowledge\b/i,
      /\barticle(s)?\b/i,
      /\blearn\b/i,
      /\btips?\b/i,
      /heart (health )?tips/i,
      /health (content|articles|info)/i,
    ],
    response:
      "The **Explore** tab is your cardiac health knowledge hub! Browse curated articles, tips, and evidence-based content about heart health, nutrition, fitness, and more — all tailored to your health profile.",
    navigate: SCREENS.EXPLORE,
    suggestions: ['🧠 Mental Health Tips', '🥗 Nutrition Tips', '💪 Fitness Tips'],
  },

  // ── Notes ─────────────────────────────────────────────────────
  {
    patterns: [
      /\bnotes?\b/i,
      /\bjournal\b/i,
      /\bwrite\b/i,
      /\bdiary\b/i,
      /\bjot\b/i,
    ],
    response:
      "The **Notes** tab lets you keep a personal health journal — log symptoms, track how you feel, write observations, or note questions for your doctor. Regular journaling helps spot patterns in your health.",
    navigate: SCREENS.NOTES,
    suggestions: ['📊 View Trends', '🏥 Health Records', '❤️ Heart Score'],
  },

  // ── Edit profile (nested — before generic Profile) ──────────
  {
    patterns: [
      /edit (my )?(profile|account)/i,
      /update (my )?(profile|details|information)/i,
      /change (my )?(name|photo|picture|email|phone)/i,
    ],
    response:
      "Opening **Edit Profile** so you can update your name, photo, contact details, and other personal information.",
    navigate: { parent: 'Profile', screen: 'EditProfile' },
    suggestions: ['👤 Profile home', '🏥 Health Records', '👨‍⚕️ Doctor'],
  },

  // ── Profile ───────────────────────────────────────────────────
  {
    patterns: [
      /\bprofile\b/i,
      /\baccount\b/i,
      /my (details|info|information)/i,
      /personal (info|details)/i,
    ],
    response:
      "Your **Profile** is where you manage personal information, health details, doctor contacts, caregiver details, subscription, and app settings. Keeping your profile updated helps Cuore give more accurate recommendations.",
    navigate: SCREENS.PROFILE,
    suggestions: ['✏️ Edit Profile', '🏥 Health Records', '🔔 Support'],
  },

  // ── Support ───────────────────────────────────────────────────
  {
    patterns: [
      /\bsupport\b/i,
      /\bhelp desk\b/i,
      /contact (us|support|team)/i,
      /\bissue(s)?\b/i,
      /\bbug(s)?\b/i,
      /not working/i,
      /\bproblem(s)?\b/i,
      /\btroubleshoot\b/i,
    ],
    response:
      "Sorry to hear you're having trouble! You can reach our **Support** team directly from the app. Common fixes:\n\n• **App crashing?** Force-close and reopen\n• **Data not loading?** Check your internet connection\n• **Login issues?** Use 'Forgot Password' on the login screen\n• **Subscription issues?** Check your account in Profile\n\nFor anything else, our support team is here to help!",
    navigate: { parent: 'Profile', screen: 'Support' },
    suggestions: ['👤 My Profile', '🔄 Refresh App', '📧 Contact Us'],
  },

  // ── Renew / manage billing (nested) ─────────────────────────
  {
    patterns: [
      /renew (my )?(subscription|plan|membership)/i,
      /manage (my )?(subscription|billing|plan)/i,
      /subscription (renewal|settings|management)/i,
      /billing (settings|portal|management)/i,
      /change (my )?plan/i,
      /cancel (my )?subscription/i,
    ],
    response:
      "Opening **Renew Subscription** under **Profile** — there you can review **Thrive** or **Cuore Monthly**, restore purchases, or update billing when your build supports it.",
    navigate: { parent: 'Profile', screen: 'RenewSubscription' },
    suggestions: ['💳 Checkout', '👤 Profile', '📞 Support'],
  },

  // ── Subscription / Payment ────────────────────────────────────
  {
    patterns: [
      /\bsubscription\b/i,
      /\bpremium\b/i,
      /\bpayment\b/i,
      /\bplan(s)?\b/i,
      /\bupgrade\b/i,
      /\bbilling\b/i,
      /how (much|to pay)/i,
      /\bthrive\b/i,
      /\bpricing\b/i,
      /\bgst\b/i,
      /free (access|tier|plan)/i,
      /\bis\s*free\b/i,
    ],
    response:
      "Cuore’s premium plans unlock full access to tracking, analytics, and personalised guidance.\n\n• **Cuore Monthly** — flexible monthly access (about **₹99**/month in the app)\n• **Thrive** — annual plan (about **₹999**/year, best value)\n\nPrices can show pre- or post-GST depending on the store screen. Open **Checkout** when you’re ready to subscribe, or go to **Profile → Renew Subscription** to manage billing later.\n\nSome users get **complimentary access** through a promotion or organisation — if that applies, you may skip payment when the app allows it.",
    navigate: SCREENS.PROFILE,
    suggestions: ['💳 Open checkout', '👤 Profile', '📞 Support'],
  },

  // ── Checkout / subscribe now ──────────────────────────────────
  {
    patterns: [
      /\bcheckout\b/i,
      /subscribe (now|today)/i,
      /\bpay\b/i,
      /\bpurchase\b/i,
      /\bbuy\b.*\bplan/i,
    ],
    response:
      "The **Checkout** screen is where you complete your **Cuore Monthly** or **Thrive** purchase through the App Store or Google Play. If the button is disabled, wait for products to load or check your network — on Android, billing must be set up for your app build.",
    navigate: SCREENS.CHECKOUT,
    suggestions: ['👤 Profile & renew', '📞 Support', '🏠 Today'],
  },

  // ── Data not syncing / loading ────────────────────────────────
  {
    patterns: [
      /data not (sync|load|updat|show)/i,
      /not (sync|load|updat|show)ing/i,
      /\brefresh\b/i,
      /why (is|isn't|aren't) (data|it|my)/i,
      /\boffline\b/i,
    ],
    response:
      "If your data isn't loading or syncing, here's what to try:\n\n1. **Check internet** — ensure you have a stable connection\n2. **Pull to refresh** — swipe down on any screen to reload\n3. **Restart the app** — close completely and reopen\n4. **Check server status** — occasionally our servers need a moment\n5. **Log out & back in** — this refreshes your session tokens\n\nStill having issues? Contact our support team!",
    suggestions: ['📞 Support', '👤 Profile', '🏠 Go to Today'],
  },

  // ── Login / Password ──────────────────────────────────────────
  {
    patterns: [
      /\blogin\b/i,
      /\bpassword\b/i,
      /\bsign (in|up)\b/i,
      /forgot password/i,
      /can't (log|sign) in/i,
      /\bOTP\b/i,
      /verification code/i,
    ],
    response:
      "For login help:\n\n• **Forgot password?** Use the 'Forgot Password' link on the login screen — we'll send an OTP to your registered email/phone\n• **OTP not arriving?** Check spam, wait 60 seconds, then request again\n• **Account locked?** Contact support after multiple failed attempts\n• **New user?** Tap 'Sign Up' to create a free account",
    suggestions: ['📞 Support', '🏠 Go to Home'],
  },

  // ── What is Cuore ─────────────────────────────────────────────
  {
    patterns: [
      /what is cuore/i,
      /about (the )?app/i,
      /what does (this|cuore) (app )?do/i,
      /how does (cuore|this) work/i,
    ],
    response:
      "**Cuore** is a comprehensive cardiac health app designed to help you monitor, understand, and improve your heart health. The name *Cuore* means *heart* in Italian. 🫀\n\n**Bottom navigation (5 tabs):**\n• **Today** — your home dashboard and daily actions\n• **Explore** — discover modules, articles, recipes, and search\n• **Trend** — analytics, predictions, and score history (Predict)\n• **Notes** — personal health notes\n• **Profile** — account, doctor/caregiver, records, subscription\n\nCuore combines heart score tracking, nutrition & meal tools, fitness, mind (stress/sleep), tobacco support, health records, and trend insights. I’m here to help you find your way around — I don’t replace your doctor.",
    suggestions: ['❤️ Heart Score', '📊 Trend tab', '🏠 Today', '👤 Profile'],
  },

  // ── App navigation / where is ───────────────────────────────
  {
    patterns: [
      /where (do i|can i|is|to) (find|go|open)/i,
      /how (do i|to) (open|get to|navigate)/i,
      /\bmain menu\b/i,
      /\btabs?\b.*\bapp\b/i,
      /what('s| is) (on|in) (each )?tab/i,
    ],
    response:
      "Use the **bottom bar** to move around:\n\n• **Today** — daily plan, alerts, shortcuts into meals, fitness, mind, tobacco, and more\n• **Explore** — browse heart-health content, recipes, **Cuore Knowledge** articles, and open full modules\n• **Trend** — see your **Predict** analytics, score over time, and jump to **Health** or **Score**\n• **Notes** — jot symptoms, questions for your clinician, or reflections\n• **Profile** — your details, **Edit Doctor** / **Edit Caregiver**, **Health Records**, **Support**, **Renew Subscription**\n\nMany screens (e.g. **Nutrition**, **Meal Builder**) open from **Today** or **Explore**.",
    suggestions: ['🏠 Today', '🧭 Explore', '📊 Trend', '👤 Profile'],
  },

  // ── Doctor check-in (Today alerts) ───────────────────────────
  {
    patterns: [
      /doctor (check|check-?in)/i,
      /check-?in.*doctor/i,
      /accept.*check/i,
      /decline.*check/i,
    ],
    response:
      "Your care team can request a **check-in** through the app. On **Today**, watch the alerts section — when you see that a **check-in was requested by your doctor**, you’ll have **Accept** and **Decline** buttons. **Accept** means you’re okay with the check-in; **Decline** means you’re not.\n\nIf you’re unsure about a medical decision, contact your clinician — I only explain how the app works.",
    navigate: SCREENS.TODAY,
    suggestions: ['👨‍⚕️ Doctor details', '🏠 Today', '📞 Support'],
  },

  // ── Doctor contact / edit ─────────────────────────────────────
  {
    patterns: [
      /\bmy doctor\b/i,
      /assigned doctor/i,
      /edit (my )?doctor/i,
      /change (my )?doctor/i,
      /doctor'?s? (contact|details|info|information)/i,
      /update (my )?doctor/i,
    ],
    response:
      "Opening **Edit Doctor** so you can view or update your doctor’s contact details. You can also open the **Doctor** card from **Profile** for more context when your care team has assigned one.",
    navigate: { parent: 'Profile', screen: 'EditDoctor' },
    suggestions: ['🏠 Today', '👤 Profile', '📞 Support'],
  },

  // ── Caregiver / family ────────────────────────────────────────
  {
    patterns: [
      /\bcaregiver\b/i,
      /\bcare ?giver\b/i,
      /family contact/i,
      /emergency contact/i,
      /next of kin/i,
    ],
    response:
      "Opening **Edit Caregiver** so you can add or update a trusted contact. Keeping this information current helps your care circle stay coordinated inside the app.",
    navigate: { parent: 'Profile', screen: 'EditCaregiver' },
    suggestions: ['👤 Profile', '👨‍⚕️ Doctor', '📞 Support'],
  },

  // ── Meal Builder & meal programmes ───────────────────────────
  {
    patterns: [
      /meal builder/i,
      /\bmeal plan\b/i,
      /build (a )?meal/i,
      /calorie ignite/i,
      /mid morning boost/i,
      /refresh refuel/i,
      /\bprogram(me)?s?\b/i,
    ],
    response:
      "**Meal Builder** walks you through creating heart-conscious meals (several steps/screens). You can start it from **Today** or **Explore**, often alongside **Nutrition**.\n\n**Today** also features structured meal programmes such as **Calorie Ignite**, **Mid Morning Boost**, and **Refresh Refuel** — quick paths to guided eating ideas tied to your daily plan.\n\nPair meals with **Recipes** when you want ready-made ideas.",
    navigate: SCREENS.MEAL_BUILDER,
    suggestions: ['🥗 Nutrition', '📖 Recipes', '🏠 Today'],
  },

  // ── Recipes ─────────────────────────────────────────────────
  {
    patterns: [
      /\brecipe(s)?\b/i,
      /cooking ideas/i,
      /heart healthy (food|meals)/i,
    ],
    response:
      "Open **Recipes** from **Today** or **Explore** to browse meal ideas that fit a heart-healthy lifestyle. You can combine recipes with **Nutrition** logging and **Meal Builder** for fuller tracking.",
    navigate: SCREENS.RECIPE,
    suggestions: ['🥗 Nutrition', '🍳 Meal Builder', '🏠 Today'],
  },

  // ── Cuore Knowledge / deep articles ───────────────────────────
  {
    patterns: [
      /\bcuore knowledge\b/i,
      /in-?depth (article|read)/i,
      /\bknowledge hub\b/i,
      /evidence based/i,
    ],
    response:
      "**Cuore Knowledge** is the in-app library of longer articles and educational content. Reach it from **Explore** (and related cards) to go deeper than short tips — topics tie back to heart health, lifestyle, and prevention.",
    navigate: SCREENS.KNOWLEDGE,
    suggestions: ['🧭 Explore', '🏥 Health Records', '❤️ Heart Score'],
  },

  // ── Search ───────────────────────────────────────────────────
  {
    patterns: [
      /\bsearch\b/i,
      /find (a )?(recipe|article|content)/i,
      /look up/i,
    ],
    response:
      "Use **Search** from **Today** or **Explore** to find recipes, topics, and content across the app. It’s the fastest way to jump to something specific without browsing every section.",
    navigate: SCREENS.SEARCH,
    suggestions: ['🧭 Explore', '🏠 Today', '🥗 Nutrition'],
  },

  // ── Health screen / vitals-style hub ─────────────────────────
  {
    patterns: [
      /\bhealth screen\b/i,
      /\bmy health\b/i,
      /vitals/i,
      /metrics hub/i,
    ],
    response:
      "The **Health** screen summarises health-related metrics and entry points (exact cards depend on your profile and backend data). You can open it from the **Today** or **Explore** stacks, and from the **Trend** stack when you follow links from **Predict**.",
    navigate: SCREENS.HEALTH,
    suggestions: ['📊 Trend', '🏥 Health Records', '❤️ Score'],
  },

  // ── Score Meter ─────────────────────────────────────────────
  {
    patterns: [
      /score meter/i,
      /meter.*score/i,
      /visual score/i,
    ],
    response:
      "**Score Meter** is a dedicated visualisation of your heart score. It’s available from the main navigation flow (same family as **Score**). If you’re looking for charts over time, also check the **Trend** tab.",
    navigate: SCREENS.SCORE_METER,
    suggestions: ['❤️ Score', '📊 Trend', '🏠 Today'],
  },

  // ── Onboarding / first-time setup ────────────────────────────
  {
    patterns: [
      /\bon-?boarding\b/i,
      /first (time|launch)/i,
      /setup (the )?app/i,
      /initial questionnaire/i,
    ],
    response:
      "**Onboarding** runs after sign-up for new users: it collects preferences and health context so **Today**, **Score**, and recommendations match you better. You can’t reopen the full first-run flow from this chat, but you can update most details anytime in **Profile → Edit Profile** and related screens.",
    suggestions: ['✏️ Edit profile', '👤 Profile', '🏠 Today'],
  },

  // ── Account creation / sign up ──────────────────────────────
  {
    patterns: [
      /\bsign ?up\b/i,
      /create (an )?account/i,
      /\bregister\b/i,
      /\bnew user\b/i,
    ],
    response:
      "Tap **Sign Up** on the login flow, enter your details, then complete **OTP verification** sent to your email or phone. After verification you may complete **Onboarding** and, if required, **Checkout** for your plan — unless your account is flagged for **complimentary access**.",
    suggestions: ['💳 Subscription', '📞 Support', '🔐 Login help'],
  },

  // ── Notifications / reminders ───────────────────────────────
  {
    patterns: [
      /\bnotification(s)?\b/i,
      /\bpush\b/i,
      /\bfcm\b/i,
      /\breminder(s)?\b/i,
      /not receiving (alerts|messages)/i,
    ],
    response:
      "Cuore can send **push notifications** (via Firebase / platform services) for reminders, check-ins, and updates. If you’re not receiving them: enable notifications for Cuore in **system Settings**, ensure you’re logged in, and check that battery optimisers aren’t blocking background delivery (especially on Android).",
    suggestions: ['📞 Support', '👤 Profile', '🏠 Today'],
  },

  // ── Privacy / delete account / terms ─────────────────────────
  {
    patterns: [
      /\bprivacy\b/i,
      /\bdelete (my )?account\b/i,
      /\bdata protection\b/i,
      /\bterms (and|&)? conditions\b/i,
      /\bgdpr\b/i,
    ],
    response:
      "Your account controls live under **Profile**: open **Terms & Conditions** for legal copy, use **Delete Account** if you want to remove your profile (this is irreversible — read the confirmation carefully), and contact **Support** for data or privacy questions.",
    navigate: SCREENS.PROFILE,
    suggestions: ['📞 Support', '👤 Profile', '🏥 Health Records'],
  },

  // ── Clinical references ───────────────────────────────────────
  {
    patterns: [
      /clinical reference/i,
      /sources?\b/i,
      /evidence|citation/i,
      /where (does|did) (this|cuore) (get )?info/i,
    ],
    response:
      "Several screens (including **Score**, **Today**, and **Health**) link to **Clinical References & Sources** so you can see where educational content draws from. That’s for transparency — it’s still not a substitute for personalised medical advice.",
    suggestions: ['❤️ Heart Score', '📊 Trend', '📞 Support'],
  },

  // ── This AI assistant ─────────────────────────────────────────
  {
    patterns: [
      /\b(this )?ai\b/i,
      /chat (button|bot|assistant)/i,
      /\bvirtual assistant\b/i,
      /who are you/i,
    ],
    response:
      "I’m the **in-app Cuore assistant**: I explain **how to use the app**, where features live, and what plans and flows mean. I’m **not** a doctor and I don’t see your private medical results unless your device already shows them to you. For diagnosis or treatment, talk to a qualified professional.",
    suggestions: ['🏠 Today', '❤️ Heart Score', '📞 Support'],
  },

  // ── Medical disclaimer (urgent) ─────────────────────────────
  {
    patterns: [
      /having\s+(a\s+)?heart\s+attack/i,
      /severe\s+chest\s+pain/i,
      /think\s+i\s*'?m\s+(having|dying)/i,
      /signs?\s+of\s+(a\s+)?stroke/i,
      /slurred\s+speech.*(face|arm|numb)/i,
      /thoughts?\s+of\s+(suicide|hurting\s+myself)/i,
      /can\s*'?t\s+breathe/i,
      /medical\s+emergency/i,
    ],
    response:
      "If you think you’re having a **medical emergency** (e.g. chest pain, trouble breathing, signs of stroke, or thoughts of self-harm), **call your local emergency number immediately** — don’t wait for an app.\n\nCuore supports wellness between visits; it doesn’t replace emergency care.",
    suggestions: ['📞 Support', '👤 Profile'],
  },

  // ── Default / Fallback ────────────────────────────────────────
  {
    patterns: [/.*/],
    response: (input) =>
      `I'm not sure I fully understood "${input}", but I'm here to help! Try asking about:\n\n• Your **Heart Score**\n• **Nutrition** or meal tracking\n• **Fitness** activities\n• **Mental health** resources\n• **Health Records**\n• **Trends** and analytics\n\nOr tap one of the quick actions below!`,
    suggestions: ['❤️ Heart Score', '🥗 Nutrition', '💪 Fitness', '🧠 Mental Health'],
  },
];
