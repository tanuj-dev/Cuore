import React, { use, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from 'react-native';
import { hp, wp, Images } from '../../utilities';

import { useSelector } from 'react-redux';
import images from '../../utilities/Images';
// import Icon from 'react-native-vector-icons/Ionicons';

export const diabetesEducationData = [
  {
    id: 1,
    title: 'What Is Diabetes?',
    image: Images.DM1,
    description:
      'Understand how your body processes sugar—and what happens when it doesn’t',
    points: [
      {
        heading: '1. Know your numbers',
        text: 'Check sugar, BP, cholesterol, kidney, and eye health regularly. Even small changes may signal early damage.',
      },
      {
        heading: '2. Follow your treatment plan',
        text: 'Stick with medicines, healthy eating, and doctor visits. Consistency prevents regression.',
      },
      {
        heading: '3. Watch for warning signs',
        text: 'Report tingling feet, blurred vision, swelling, or tiredness early.',
      },
      {
        heading: '4. Protect what matters',
        text: 'Keep BP <130/82, HbA1c <7%, never smoke, and get yearly eye/urine tests.',
      },
    ],
    takeaway:
      'You don’t need to be perfect—stay alert, act early, and prevent complications.',
  },
  {
    id: 2,
    title: 'How Families Can Help',
    image: Images.DM2,
    description:
      'Family support plays a major role in managing diabetes, staying motivated, and preventing complications.',
    points: [
      {
        heading: 'Be involved, not controlling',
        text: 'Ask how to help instead of giving orders. Encourage gently.',
      },
      {
        heading: 'Join healthy habits',
        text: 'Eat together, walk together—small steps matter.',
      },
      {
        heading: 'Remind, don’t nag',
        text: 'Kindly help with medicines or appointments without pressure.',
      },
      {
        heading: 'Listen first',
        text: 'Sometimes, listening without judgment is the best support.',
      },
      {
        heading: 'Watch for warning signs',
        text: 'If tiredness, blurred vision, or wounds that won’t heal appear, see a doctor.',
      },
    ],
    takeaway: 'Support creates strength—no one has to face diabetes alone.',
  },
  {
    id: 3,
    title: 'Master Your Daily Routine',
    image: Images.DM3,
    description:
      'Small, consistent habits make a big difference. Your daily routine acts like medicine for your body.',
    points: [
      {
        heading: '1. Keep a steady rhythm',
        text: 'Maintain regular sleep and wake times.',
      },
      {
        heading: '2. Move every day',
        text: 'Walk or exercise 20–30 minutes daily.',
      },
      {
        heading: '3. Eat with awareness',
        text: 'Eat on schedule; focus on whole foods and avoid processed ones.',
      },
      {
        heading: '4. Manage stress',
        text: 'Pause, breathe, or meditate 5 minutes daily.',
      },
      {
        heading: '5. Stay on track with medicines',
        text: 'Never skip doses; use reminders or apps.',
      },
      {
        heading: '6. Support your sleep',
        text: 'Avoid screens and heavy meals at night.',
      },
    ],
    takeaway: 'Start small—one or two habits at a time. Consistency is key.',
  },
  {
    id: 4,
    title: 'Medications & Monitoring Made Simple',
    image: Images.DM4,
    description:
      'With the right steps, diabetes management becomes simpler and less stressful.',
    points: [
      {
        heading: '1. Understand your medicines',
        text: 'Take tablets or insulin at the same time daily. Never guess missed doses—ask your doctor.',
      },
      {
        heading: '2. Monitor wisely',
        text: 'Track sugar consistently—fasting, post-meal, or when feeling off.',
      },
      {
        heading: '3. Watch out for burnout',
        text: 'Diabetes burnout is normal. Pause, reset, and seek support.',
      },
      {
        heading: '4. Focus on small wins',
        text: 'Consistency in medicines and monitoring prevents long-term issues.',
      },
    ],
    takeaway:
      'You’re not just managing numbers—you’re building lifelong health.',
  },
  {
    id: 5,
    title: 'Spot the Signs Early',
    image: Images.DM5,
    description:
      'Diabetes often begins silently—early detection prevents damage to vital organs.',
    points: [
      {
        heading: 'Common warning signs',
        text: 'Tiredness, thirst, frequent urination, blurred vision, tingling, or slow healing wounds.',
      },
      {
        heading: 'Why early detection matters',
        text: 'Simple tests like fasting sugar or HbA1c can catch diabetes early and even reverse it.',
      },
      {
        heading: 'What to do',
        text: 'If you have risk factors—age, weight, family history, or high BP—get tested regularly.',
      },
    ],
    takeaway:
      'Catch diabetes early—it’s easier to manage before complications begin.',
  },
  {
    id: 6,
    title: 'Stress, Sleep, and Your Sugar Levels',
    image: Images.DM6,
    description:
      'Stress and poor sleep raise blood sugar and make insulin less effective.',
    points: [
      {
        heading: '1. Prioritize sleep',
        text: 'Sleep 7–8 hours, with fixed timings and minimal screen time.',
      },
      {
        heading: '2. Breathe to relax',
        text: 'Meditate or do deep breathing 5 minutes daily.',
      },
      {
        heading: '3. Move gently',
        text: 'Walk, stretch, or do yoga to release tension.',
      },
      {
        heading: '4. Talk it out',
        text: 'Share worries with someone you trust to reduce emotional stress.',
      },
    ],
    takeaway:
      'Calm mind = better sugar control. Stress management is powerful medicine.',
  },
  {
    id: 7,
    title: 'What Is Diabetes?',
    image: Images.DM1,
    description:
      'Diabetes affects how your body uses glucose for energy. It occurs when insulin is absent or ineffective.',
    points: [
      {
        heading: 'Types of diabetes',
        text: 'Type 1: requires insulin; often starts young. Type 2: linked to lifestyle; preventable with healthy habits.',
      },
      {
        heading: 'Common symptoms',
        text: 'Thirst, frequent urination, fatigue, blurred vision, infections, or weight loss.',
      },
      {
        heading: 'Long-term effects',
        text: 'High sugar harms eyes, kidneys, nerves, and heart—even if you feel fine.',
      },
      {
        heading: 'Good news',
        text: 'Early care and lifestyle control prevent serious problems. Diabetes is manageable.',
      },
    ],
    takeaway:
      'Learning about diabetes is the first step toward long-term health.',
  },
];

export const bpArticles = [
  {
    id: 1,
    title: 'Monitor Your Pressure, Know Your Risk',
    image: Images.HTN1,
    description:
      'Blood pressure shows how hard your heart works to push blood through your body. High BP increases your risk of heart attack, stroke, and kidney damage—even if you feel fine.',
    points: [
      {
        heading: '1. Check BP correctly',
        text: 'Sit quietly for 5 minutes, rest your arm at heart level, and place the cuff on bare skin.',
      },
      {
        heading: '2. Avoid interference',
        text: 'Don’t talk, move, or consume caffeine 30 minutes before measuring.',
      },
      {
        heading: '3. Take multiple readings',
        text: 'Take two readings one minute apart and record both.',
      },
      {
        heading: '4. Know your numbers',
        text: 'Normal: below 120/80 mmHg, Elevated: 120–129/<80, Hypertension: above 130/80 mmHg.',
      },
    ],
    takeaway:
      'Check BP regularly and track it over time—early awareness prevents serious heart and kidney problems.',
  },
  {
    id: 2,
    title: 'How Stress and Poor Sleep Raise Your Blood Pressure',
    image: Images.HTN2,
    description:
      'Chronic stress and poor sleep trigger hormones that tighten blood vessels and increase BP over time.',
    points: [
      {
        heading: '1. Prioritize rest',
        text: 'Aim for 7–8 hours of quality sleep with a regular routine.',
      },
      {
        heading: '2. Practice deep breathing',
        text: 'Spend 5 minutes daily focusing on slow, deep breaths to calm your system.',
      },
      {
        heading: '3. Move gently',
        text: 'Walking, yoga, or stretching reduces stress hormones and improves circulation.',
      },
      {
        heading: '4. Talk or write it out',
        text: 'Sharing feelings or journaling reduces emotional load and helps control BP.',
      },
    ],
    takeaway:
      'Managing stress and improving sleep are as important as medication for healthy blood pressure.',
  },
  {
    id: 3,
    title: 'Stay Consistent with Your BP Medicines',
    image: Images.HTN3,
    description:
      'High blood pressure is a lifelong condition. Skipping medication can silently raise your risk of heart attack or stroke.',
    points: [
      {
        heading: '1. Take medicines daily',
        text: 'Link it to daily habits like brushing your teeth or breakfast time.',
      },
      {
        heading: '2. Use reminders',
        text: 'Set alarms or use a pillbox to avoid missing doses.',
      },
      {
        heading: '3. Never stop suddenly',
        text: 'Consult your doctor before changing or stopping any BP medicine.',
      },
      {
        heading: '4. Carry extras when traveling',
        text: 'Always keep an extra strip with you to stay consistent.',
      },
    ],
    takeaway:
      'Consistency protects your heart, brain, and kidneys—don’t skip even when you feel fine.',
  },
  {
    id: 4,
    title: 'Prevent Dizziness and Falls from Low BP in the Elderly',
    image: Images.HTN4,
    description:
      'Postural hypotension (BP drop when standing) can cause dizziness and falls, especially in older adults.',
    points: [
      {
        heading: '1. Recognize the signs',
        text: 'Feeling faint, dizzy, or blurred vision on standing may indicate low BP.',
      },
      {
        heading: '2. Stand up slowly',
        text: 'Move from lying → sitting → standing gradually, pausing at each step.',
      },
      {
        heading: '3. Stay hydrated',
        text: 'Drink enough fluids unless your doctor advises otherwise.',
      },
      {
        heading: '4. Review medications',
        text: 'Some medicines may worsen low BP—consult your doctor for adjustments.',
      },
    ],
    takeaway:
      'Balance BP control with fall prevention—move slowly, stay hydrated, and check BP regularly.',
  },
  {
    id: 5,
    title: 'Build a Lifestyle That Helps Lower Blood Pressure',
    image: Images.HTN5,
    description:
      'You don’t need a total overhaul—small, steady lifestyle changes can lower BP effectively.',
    points: [
      {
        heading: '1. Eat smart',
        text: 'Cut down salt, avoid packaged foods, and eat more fruits and vegetables.',
      },
      {
        heading: '2. Stay active',
        text: 'Aim for at least 30 minutes of moderate activity most days.',
      },
      {
        heading: '3. Watch your weight',
        text: 'Even a 5–10% weight loss can make a big difference.',
      },
      {
        heading: '4. Manage stress',
        text: 'Take 5 minutes daily for deep breathing or mindfulness to relax your mind.',
      },
    ],
    takeaway:
      'Small, daily habits build a strong foundation for lifelong BP control.',
  },
  {
    id: 6,
    title: 'Prevent Stroke, Heart Attack, and Kidney Damage',
    image: Images.HTN6,
    description:
      'Uncontrolled BP silently harms your heart, brain, and kidneys—but it’s preventable with early action.',
    points: [
      {
        heading: '1. Know your numbers',
        text: 'Track BP regularly and aim for under 130/80 mmHg (or as advised).',
      },
      {
        heading: '2. Take medicines regularly',
        text: 'Never skip a dose, even if you feel fine.',
      },
      {
        heading: '3. Adopt a heart-healthy routine',
        text: 'Eat fresh, move daily, and avoid smoking or excess alcohol.',
      },
      {
        heading: '4. Control other conditions',
        text: 'Manage diabetes and cholesterol to reduce heart and kidney risk.',
      },
    ],
    takeaway:
      'Every small step—daily meds, healthy meals, and regular checks—protects your vital organs for life.',
  },
  {
    id: 7,
    title: 'What Is Hypertension?',
    image: Images.HTN7,
    description:
      'Hypertension means blood pushes too hard against artery walls, causing silent damage over time.',
    points: [
      {
        heading: '1. Know your reading',
        text: 'Normal BP is around 120/80 mmHg; above 130/80 mmHg is high.',
      },
      {
        heading: '2. Understand your risks',
        text: 'Family history, diabetes, stress, and age increase your chances of hypertension.',
      },
      {
        heading: '3. Act early',
        text: 'Get regular BP checks—early detection prevents complications.',
      },
      {
        heading: '4. Build healthy habits',
        text: 'Eat less salt, stay active, and take medicines if prescribed.',
      },
    ],
    takeaway:
      'Hypertension is preventable and treatable—control it early to protect your heart and brain.',
  },
];

export const wellnessArticles = [
  {
    id: 1,
    title: 'How Movement Heals Beyond the Calorie Burn',
    images: Images.GENERAL1,
    description:
      'Movement is medicine. You don’t need a marathon or gym to feel better—just move more every day to reset your body, relax your mind, and boost your health.',
    points: [
      {
        heading: '1. Why movement matters',
        text: 'Regular activity lowers BP and sugar, reduces stress hormones, and improves mood and digestion.',
      },
      {
        heading: '2. What counts as movement',
        text: 'Brisk walks, yoga, dancing, chores, cycling, or even walking while on calls—all add up.',
      },
      {
        heading: '3. Move to relax',
        text: 'Exercise isn’t punishment; it’s a way to release tension and clear your mind.',
      },
      {
        heading: '4. Make it routine',
        text: 'Start with what you enjoy and make it part of your daily rhythm.',
      },
    ],
    takeaway:
      'Your body is built to move. Small daily movement heals more than calories—it supports heart, mind, and hormones.',
  },
  {
    id: 2,
    title: 'Stay Ahead of Hidden Risks with Regular Health Checks',
    image: Images.GENERAL2,
    description:
      'Prediabetes, fatty liver, and low vitamin D often develop quietly. The right blood tests reveal early risks—when they’re easiest to fix.',
    points: [
      {
        heading: '1. Key tests to track',
        text: 'Fasting sugar & HbA1c, Lipid Profile, LFTs, Kidney, Thyroid, Vitamin D, and CRP reveal early signs of trouble.',
      },
      {
        heading: '2. Track regularly',
        text: 'Monitor daily BP, weekly sugar, and annual lab results using apps or reminders.',
      },
      {
        heading: '3. Understand your patterns',
        text: 'Regular data shows what habits help or harm your energy, sugar, and sleep.',
      },
      {
        heading: '4. Take early action',
        text: 'Use insights to improve diet, sleep, and movement—long before symptoms appear.',
      },
    ],
    takeaway:
      'Your numbers tell your story. Test, track, and act early—knowledge keeps you one step ahead of illness.',
  },
  {
    id: 3,
    title:
      'Why Heart, Metabolic, and Hormonal Problems Often Start Years Before Diagnosis',
    image: Images.GENERAL3,
    description:
      'Many lifestyle diseases build silently for years. Early signs like fatigue, belly fat, or poor sleep can reveal deeper imbalances.',
    points: [
      {
        heading: '1. Silent risk builds slowly',
        text: 'Weight gain, tiredness, irregular periods, and poor sleep are early warning signs.',
      },
      {
        heading: '2. Why early detection matters',
        text: 'It helps prevent heart disease, strokes, fertility issues, and sudden sugar or BP spikes.',
      },
      {
        heading: '3. What to track',
        text: 'BP, sugar, cholesterol, waist size, and Cuore Score—all show your current risk.',
      },
      {
        heading: '4. Screen yearly',
        text: 'Annual checkups catch silent changes before they become serious problems.',
      },
    ],
    takeaway:
      'Catching risk early saves effort later. Awareness today prevents complications tomorrow.',
  },
  {
    id: 4,
    title: 'Balanced Eating for Better Energy and Long-Term Health',
    image: Images.GENERAL4,
    description:
      'You don’t need a strict diet—just smart, balanced meals that steady energy, reduce cravings, and support metabolism.',
    points: [
      {
        heading: '1. Why hunger hits fast',
        text: 'Sugary or fried foods cause energy crashes, leading to overeating.',
      },
      {
        heading: '2. What a balanced plate looks like',
        text: 'Half veggies, one palm of protein, healthy fats, and complex carbs like roti, millets, or oats.',
      },
      {
        heading: '3. Smart daily habits',
        text: 'Eat breakfast with protein, avoid late meals, and drink water before snacks.',
      },
      {
        heading: '4. Prep for success',
        text: 'Plan meals in advance to avoid unhealthy choices under pressure.',
      },
    ],
    takeaway:
      'Food is your first medicine. Balanced meals fuel your body, stabilize hormones, and protect long-term health.',
  },
  {
    id: 5,
    title:
      'Why Your Body Resists Weight Loss—And How to Work With It, Not Against It',
    image: Images.GENERAL5,
    description:
      'Weight loss isn’t just about calories. Metabolism, hormones, sleep, and stress all play major roles in how your body stores or burns fat.',
    points: [
      {
        heading: '1. What metabolism does',
        text: 'It converts food to energy and regulates how you burn calories or store fat.',
      },
      {
        heading: '2. When metabolism slows',
        text: 'Dieting, stress, or poor sleep can lower metabolism, causing belly fat and fatigue.',
      },
      {
        heading: '3. Support your body',
        text: 'Eat regularly, move daily, and sleep well to rebuild metabolic balance.',
      },
      {
        heading: '4. Test, don’t guess',
        text: 'Simple blood tests can reveal slow metabolism or hormonal imbalance early.',
      },
    ],
    takeaway:
      'Your metabolism isn’t broken—it needs support. Consistency and care restore balance better than extreme diets.',
  },
  {
    id: 6,
    title: 'Your Body Gives Clues—Don’t Ignore Them',
    image: Images.GENERAL6,
    description:
      'Your body shows early signs when it’s under stress—through skin, hair, digestion, or mood. Paying attention prevents bigger problems.',
    points: [
      {
        heading: '1. Notice visible changes',
        text: 'Hair loss, dry skin, brittle nails, or dark neck patches may signal imbalance.',
      },
      {
        heading: '2. Watch internal cues',
        text: 'Bloating, acidity, cravings, or fatigue are early markers of gut or sugar issues.',
      },
      {
        heading: '3. Build gentle routines',
        text: 'Eat on time, drink water steadily, and add curd or fermented foods for gut health.',
      },
      {
        heading: '4. Move and rest',
        text: 'Short walks, stretching, and quality sleep reset your system naturally.',
      },
    ],
    takeaway:
      'Your body speaks in signals—listen early, act gently, and you’ll restore balance before illness develops.',
  },
  {
    id: 7,
    title: 'Change That Doesn’t Rely on Motivation Alone',
    image: Images.GENERAL7,
    description:
      'Motivation fades, but systems last. Real health change comes from repeatable, simple habits that run on routine, not willpower.',
    points: [
      {
        heading: '1. Anchor habits',
        text: 'Link a new habit to an old one—like taking meds after brushing teeth.',
      },
      {
        heading: '2. Make it visible',
        text: 'Keep healthy cues—like shoes or fruits—in sight to trigger action.',
      },
      {
        heading: '3. Start small',
        text: 'Tiny, repeatable actions like a 10-minute walk or daily water glass build momentum.',
      },
      {
        heading: '4. Track and reward consistency',
        text: 'Focus on streaks, not perfection. Celebrate staying consistent.',
      },
    ],
    takeaway:
      'Systems beat motivation. Build habits so simple they don’t need inspiration—only repetition.',
  },
  {
    id: 8,
    title: 'Small Steps Today Can Reduce Tomorrow’s Risk',
    image: Images.GENERAL8,
    description:
      'Chronic conditions build slowly—but early lifestyle changes can prevent or delay them entirely.',
    points: [
      {
        heading: '1. Prevention starts early',
        text: 'Fatigue, belly fat, and poor sleep are early signs—don’t ignore them.',
      },
      {
        heading: '2. Know your numbers',
        text: 'Track sugar, BP, cholesterol, and inflammation markers like hsCRP.',
      },
      {
        heading: '3. Move daily',
        text: 'Even 30 minutes of walking improves sugar control, mood, and circulation.',
      },
      {
        heading: '4. Sleep and nourish',
        text: 'Get 7–8 hours of rest and eat balanced meals with fiber, protein, and healthy fats.',
      },
    ],
    takeaway:
      'Prevention starts with small, steady steps. The earlier you act, the stronger and healthier your future becomes.',
  },
];
export const knowledgeData = [
  {
    id: 1,
    title: 'Simplify Your Daily Plan—Track, Log, and Never Miss a Dose',
    image: Images.HTN_DM1,
    description:
      'A structured daily plan helps you build consistency, take medications on time, and stay on top of your health progress.',
    points: [
      {
        heading: '1. Set reminders',
        text: 'Use notifications or alarms to remember your medicine and activity timings.',
      },
      {
        heading: '2. Log daily habits',
        text: 'Track your meals, workouts, and mood to understand what affects your health.',
      },
      {
        heading: '3. Stay flexible',
        text: 'If you miss something, note it down—progress, not perfection, matters most.',
      },
      {
        heading: '4. Reflect weekly',
        text: 'Check your logs every week to celebrate small wins and spot areas to improve.',
      },
    ],
    takeaway:
      'Consistency builds health. Your daily routine is your strongest medicine.',
  },
  {
    id: 2,
    title: 'Why Your Body Needs Rest to Recover, Repair, and Thrive',
    image: Images.HTN_DM2,
    description:
      'Rest is not laziness—it’s when your body repairs tissues, balances hormones, and strengthens your immune system.',
    points: [
      {
        heading: '1. Prioritize quality sleep',
        text: 'Sleep 7–8 hours daily with a consistent bedtime routine.',
      },
      {
        heading: '2. Schedule downtime',
        text: 'Include relaxation breaks or power naps in your busy day.',
      },
      {
        heading: '3. Listen to fatigue',
        text: 'If you feel drained, take a step back—your body is signaling a recharge.',
      },
      {
        heading: '4. Avoid overtraining',
        text: 'Too much exercise without rest can slow recovery and increase stress.',
      },
    ],
    takeaway: 'Rest smart, not less. A rested body performs and heals better.',
  },
  {
    id: 3,
    title: 'Eat Smart, Stay Balanced: Nutrition for Everyday Health',
    image: Images.HTN_DM3,
    description:
      'Food is fuel and medicine—balanced nutrition helps control blood sugar, support the heart, and sustain energy.',
    points: [
      {
        heading: '1. Fill half your plate with veggies',
        text: 'Colorful vegetables are rich in fiber, vitamins, and minerals.',
      },
      {
        heading: '2. Choose whole grains',
        text: 'Switch from white rice to brown rice, millet, or whole wheat options.',
      },
      {
        heading: '3. Go easy on oil and sugar',
        text: 'Limit fried and sweet foods to keep calories and triglycerides in check.',
      },
      {
        heading: '4. Eat mindfully',
        text: 'Chew slowly and stop when 80% full to prevent overeating.',
      },
    ],
    takeaway:
      'Every bite counts. Balanced meals keep your energy steady and your heart happy.',
  },
  {
    id: 4,
    title: 'Hydration: The Simple Secret to Better Health',
    image: Images.HTN_DM4,
    description:
      'Water supports digestion, circulation, and temperature balance. Even slight dehydration affects energy and focus.',
    points: [
      {
        heading: '1. Aim for 8–10 glasses daily',
        text: 'Adjust more if you’re active or in hot weather.',
      },
      {
        heading: '2. Start your day with water',
        text: 'Drink a glass right after waking up to boost metabolism.',
      },
      {
        heading: '3. Limit sugary drinks',
        text: 'Choose water, infused water, or herbal teas instead of soda or juice.',
      },
      {
        heading: '4. Watch urine color',
        text: 'Pale yellow = good hydration; dark means drink more.',
      },
    ],
    takeaway:
      'Stay hydrated, stay energized. Water is your body’s simplest health boost.',
  },
  {
    id: 5,
    title: 'Mindful Eating—Slow Down, Feel Better',
    image: Images.HTN_DM5,
    description:
      'Mindful eating helps you reconnect with hunger cues, avoid overeating, and enjoy food guilt-free.',
    points: [
      {
        heading: '1. Eat without distractions',
        text: 'Avoid screens or multitasking while eating.',
      },
      {
        heading: '2. Notice flavors and textures',
        text: 'Take smaller bites and enjoy the taste of each meal.',
      },
      {
        heading: '3. Check hunger levels',
        text: 'Eat when you’re truly hungry, not out of boredom or stress.',
      },
      {
        heading: '4. Respect fullness',
        text: 'Stop eating when comfortably satisfied, not stuffed.',
      },
    ],
    takeaway:
      'Mindful eating turns meals into moments of nourishment, not guilt.',
  },
  {
    id: 6,
    title: 'Stress, Sleep, and Your Sugar Levels',
    image: Images.HTN_DM6,
    description:
      'Stress and poor sleep raise blood sugar and make insulin less effective.',
    points: [
      {
        heading: '1. Prioritize sleep',
        text: 'Sleep 7–8 hours, with fixed timings and minimal screen time.',
      },
      {
        heading: '2. Breathe to relax',
        text: 'Meditate or do deep breathing 5 minutes daily.',
      },
      {
        heading: '3. Move gently',
        text: 'Walk, stretch, or do yoga to release tension.',
      },
      {
        heading: '4. Talk it out',
        text: 'Share worries with someone you trust to reduce emotional stress.',
      },
    ],
    takeaway:
      'Calm mind = better sugar control. Stress management is powerful medicine.',
  },
  {
    id: 7,
    title: 'Stay Active: Small Steps, Big Difference',
    image: Images.HTN_DM7,
    description:
      'Regular movement improves blood circulation, reduces stress, and helps manage weight.',
    points: [
      {
        heading: '1. Walk often',
        text: 'Take 5–10 minute walks after meals to regulate sugar levels.',
      },
      {
        heading: '2. Strengthen muscles',
        text: 'Do light resistance training 2–3 times a week.',
      },
      {
        heading: '3. Add movement breaks',
        text: 'Stretch or stand up every hour if sitting for long periods.',
      },
      {
        heading: '4. Track your progress',
        text: 'Use apps or wearables to monitor steps and activity.',
      },
    ],
    takeaway:
      'Every step adds up. Consistent movement keeps your body young and active.',
  },
  {
    id: 8,
    title: 'Heart Health Basics—Know Your Numbers',
    image: Images.HTN_DM8,
    description:
      'Understanding your blood pressure, sugar, and cholesterol helps prevent future heart problems.',
    points: [
      {
        heading: '1. Monitor regularly',
        text: 'Track your BP, sugar, and weight every week.',
      },
      {
        heading: '2. Eat heart-healthy',
        text: 'Focus on fruits, vegetables, and unsaturated fats.',
      },
      {
        heading: '3. Limit salt',
        text: 'Keep sodium below 5 grams (1 teaspoon) daily.',
      },
      {
        heading: '4. Avoid tobacco and alcohol',
        text: 'They directly damage your heart and raise blood pressure.',
      },
    ],
    takeaway: 'Knowing your numbers today protects your heart tomorrow.',
  },
];
export const howToabaco = {
  id: 8,
  title: 'Quit Tobacco: Protect Your Body, Improve Your Health',
  description:
    'Whether smoked, chewed, or vaped, tobacco and nicotine harm more than your lungs, affecting your heart, hormones, blood sugar, and organs.',
  points: [
    {
      heading: '1. The hidden metabolic impact',
      text: 'Tobacco raises blood pressure, increases insulin resistance, and alters fat storage. Nicotine spikes stress hormones, raising blood sugar and straining your heart. Vaping can increase overall nicotine exposure and damage.',
    },
    {
      heading: '2. Organ damage over time',
      text: 'Heart: Thickens blood, damages vessels, and speeds up plaque buildup. Kidneys: Reduced blood flow increases risk of damage. Liver & Pancreas: Overloaded with toxins, struggle to control insulin. Hormones: Nicotine disrupts sex hormones, thyroid, and stress balance.',
    },
    {
      heading: '3. The good news: quitting heals',
      text: 'Within 2–12 weeks: Circulation and lung function improve. Within 1 year: Heart disease risk drops by 50%. Long term: Blood sugar control improves, inflammation reduces, organs repair.',
    },
    {
      heading: '4. Make the shift',
      text: 'Every tobacco-free day strengthens your metabolic foundation. Protect your heart, hormones, and future—starting now.',
    },
  ],
  takeaway:
    'Quitting tobacco benefits your metabolism, organs, and long-term health. Every day without it makes a difference.',
};

// Set to false for BP or wellness articles

const CuoreKnowledge = ({ navigation }) => {
  const [search, setSearch] = useState('');

  const isDiabetes = useSelector(
    state => state?.onboardingdata?.data?.data?.o3Data?.hasDiabetes,
  );

  const htn = useSelector(
    state => state?.onboardingdata?.data?.data?.o3Data?.q3,
  );

  const smoking = useSelector(
    state => state?.onboardingdata?.data?.data?.o4Data?.smoking,
  );

  console.log('isDiabetes', isDiabetes, htn, smoking);

  const renderItem = ({ item }) => (
    <TouchableOpacity
      onPress={() =>
        navigation?.navigate('KnowledgeDetails', {
          points: item.points,
          takeaway: item?.takeaway,
          title: item?.title,
        })
      }
      style={styles.card}
    >
      <Image source={item.image} style={styles.image} />
      <View style={styles.textContainer}>
        <Text style={styles.title}>{item.title}</Text>
        <Text numberOfLines={3} style={styles.description}>
          {item.description}
        </Text>
      </View>
    </TouchableOpacity>
  );

  const getArticleData = () => {
    if (isDiabetes && htn) return knowledgeData;
    if (isDiabetes) return diabetesEducationData;
    if (htn === 'I have Hypertension (High blood pressure)') return bpArticles;
    return howToabaco;
  };

  return (
    <View style={styles.screen}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation?.goBack()}
        >
          <Image source={Images.BACK_BUTTON} style={styles.backIcon} />
        </TouchableOpacity>

        <View style={styles.headerIconContainer}>
          <View style={styles.headerIconWrapper}>
            <Image source={Images.DOCTOR_PROFILE} style={styles.headerIcon} />
          </View>
          <Text style={styles.heading}>Recommended Articles</Text>
        </View>
      </View>

      {/* Content */}
      <View style={styles.container}>
        <FlatList
          data={getArticleData()}
          renderItem={renderItem}
          keyExtractor={item => item.id?.toString()}
          contentContainerStyle={{ paddingBottom: hp(10) }}
          showsVerticalScrollIndicator={false}
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#EFF6FF',
  },
  header: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingTop: hp(2),
    elevation: 1,
    alignItems: 'center',
  },
  backButton: {
    paddingHorizontal: hp(1),
  },
  backIcon: {
    // marginTop: Platform.select({ ios: hp(4), android: hp(3) }),
    marginLeft: Platform.select({ ios: hp(1), android: hp(0.5) }),
    resizeMode: 'contain',
    height: hp(3.5),
    width: wp(4),
  },
  headerIconContainer: {
    flex: 1,
    alignItems: 'center',
    // marginRight: hp(4),
    marginLeft: -hp(5),
    marginTop: Platform.select({ ios: hp(4), android: hp(1) }),
    marginBottom: hp(2),
  },
  headerIconWrapper: {
    padding: hp(0.8),
    borderWidth: 3,
    borderRadius: hp(10),
  },
  headerIcon: {
    width: wp(10),
    height: wp(10),
    resizeMode: 'contain',
  },
  heading: {
    fontFamily: 'Roboto-Regular',
    fontSize: 20,
    fontWeight: '400',
    color: '#1E64AC',
    textAlign: 'center',
    marginTop: hp(2),
  },
  container: {
    flex: 1,
    padding: wp(4),
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: hp(0.5),
    flexDirection: 'row',
    marginBottom: hp(2),
    padding: wp(2),
    elevation: 1,
  },
  image: {
    width: wp(18),
    height: wp(18),
    borderRadius: hp(0.3),
    resizeMode: 'contain',
  },
  textContainer: {
    flex: 1,
    marginLeft: wp(3),
    justifyContent: 'center',
  },
  title: {
    fontSize: 14,
    fontFamily: 'Roboto-Regular',
    fontWeight: '400',
    color: '#000000',
  },
  description: {
    fontSize: 13,
    fontFamily: 'Roboto-Regular',
    color: '#6B7280',
    marginTop: hp(0.5),
    fontWeight: '400',
  },
});

export default CuoreKnowledge;
