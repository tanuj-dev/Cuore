import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { ArrowLeft, ChevronLeft, ChevronRight, Minus, Plus, Info } from 'lucide-react-native';
import { hp, wp, Fonts } from '../../utilities';
import { fetchCycle, saveCycle } from '../../redux/Cycle/thunks';
import { clearCycleError } from '../../redux/Cycle/slice';
import Toast from '../../components/Toast';

/**
 * Cycle tracker — reached from the calendar button on Today.
 *
 * "First day of your last period (select in calendar) / How many days did it last? (default 5) /
 *  Average cycle length (default 28) / Submit → estimated next period (red), estimated fertile
 *  window (green)."
 *
 * ── DATES ARE STRINGS, START TO FINISH ───────────────────────────────────────────────────────
 * Every date here is `YYYY-MM-DD` and every comparison is a string comparison. No Date objects,
 * no timezone conversion. A cycle is counted in calendar days: "my period started on the 3rd" is
 * the same fact wherever it is read, and a Date at UTC midnight renders as the 2nd for anyone
 * west of Greenwich. The backend stores and computes the same way — see its
 * utils/cyclePredictions.js.
 *
 * ── THE PREDICTIONS ARE NOT COMPUTED HERE ────────────────────────────────────────────────────
 * Red and green days arrive from the server already worked out, which is why the calendar only
 * changes after Submit. Repeating the formula on the phone would mean two implementations that
 * drift, and the stale one would be the copy a patient is actually reading. It also keeps the
 * drawn calendar and the accepted input in agreement: the server validates, so a refused save can
 * never leave a prediction on screen that was built from it.
 */

const BRAND = '#11418A';
const PERIOD_RED = '#E5484D';
const FERTILE_GREEN = '#16A34A';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

/* Calendar-day helpers. UTC throughout for the same reason the backend is: the day is the unit,
 * and local midnight is a different instant in every timezone. */
const pad = n => String(n).padStart(2, '0');
const toStr = (y, m, d) => `${y}-${pad(m + 1)}-${pad(d)}`;
const daysInMonth = (y, m) => new Date(Date.UTC(y, m + 1, 0)).getUTCDate();
const firstWeekday = (y, m) => new Date(Date.UTC(y, m, 1)).getUTCDay();

// Inclusive, on strings. `YYYY-MM-DD` sorts lexicographically in date order, which is the whole
// reason this format is worth keeping.
const within = (day, start, end) => !!start && !!end && day >= start && day <= end;

/** Weeks of the month as arrays of 7 cells, null where the grid has no day. */
function buildMonthGrid(year, month) {
  const total = daysInMonth(year, month);
  const lead = firstWeekday(year, month);
  const cells = [];
  for (let i = 0; i < lead; i += 1) cells.push(null);
  for (let d = 1; d <= total; d += 1) cells.push(toStr(year, month, d));
  while (cells.length % 7 !== 0) cells.push(null);

  const weeks = [];
  for (let i = 0; i < cells.length; i += 7) weeks.push(cells.slice(i, i + 7));
  return weeks;
}

/** A stepper: a number with minus and plus, bounded. The spec's "default 5 +/-" and "default 28 +/-". */
function Stepper({ label, value, min, max, suffix, onChange, invalid }) {
  const step = delta => {
    const next = value + delta;
    if (next < min || next > max) return;
    onChange(next);
  };
  return (
    <View style={styles.stepperRow}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={[styles.stepper, invalid && styles.stepperInvalid]}>
        <TouchableOpacity
          onPress={() => step(-1)}
          disabled={value <= min}
          style={styles.stepperBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Minus size={hp(2)} color={value <= min ? '#CBD5E1' : BRAND} />
        </TouchableOpacity>
        <Text style={styles.stepperValue}>
          {value}
          <Text style={styles.stepperSuffix}> {suffix}</Text>
        </Text>
        <TouchableOpacity
          onPress={() => step(1)}
          disabled={value >= max}
          style={styles.stepperBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Plus size={hp(2)} color={value >= max ? '#CBD5E1' : BRAND} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

export default function CycleTracker({ navigation }) {
  const dispatch = useDispatch();
  const { data, loading, saving, error, errorField } = useSelector(s => s.cycle);

  const [lastPeriodStart, setLastPeriodStart] = useState(null);
  const [periodLengthDays, setPeriodLengthDays] = useState(5);
  const [averageCycleLength, setAverageCycleLength] = useState(28);
  const [toast, setToast] = useState(null);
  const [toastType, setToastType] = useState('success');

  // The month on screen. Starts on today's month and moves only when the arrows are tapped.
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getUTCFullYear());
  const [viewMonth, setViewMonth] = useState(now.getUTCMonth());

  useEffect(() => {
    dispatch(fetchCycle());
  }, [dispatch]);

  // Seed the form from whatever is saved, once it arrives. Defaults stay until then, so the
  // steppers never show a 0 that the patient has to correct.
  useEffect(() => {
    if (!data?.input) return;
    setLastPeriodStart(data.input.lastPeriodStart ?? null);
    setPeriodLengthDays(data.input.periodLengthDays ?? 5);
    setAverageCycleLength(data.input.averageCycleLength ?? 28);
  }, [data?.input]);

  const predictions = data?.predictions || null;
  const bounds = data?.bounds || { periodLengthDays: [1, 15], averageCycleLength: [20, 45] };

  /* Which days are red and which are green. Flattened from the server's projected cycles into two
   * lookups, so the grid does not re-scan every cycle for every cell it draws. */
  const marks = useMemo(() => {
    const period = [];
    const fertile = [];
    for (const c of predictions?.upcoming || []) {
      /* `periodLastDay`, NOT `periodEnd`. The spec's end date is start + days ("28 Sept + 4 =
       * 2 Oct"), which is the day the period is OVER — an exclusive bound. Shading through it
       * would paint five days red for a four-day period. `periodLastDay` is the last day there
       * is actually bleeding, which is what a calendar should colour. Falls back to `periodEnd`
       * for a response from a server that predates the field. */
      period.push([c.periodStart, c.periodLastDay || c.periodEnd]);
      fertile.push([c.fertileStart, c.fertileEnd]);
    }
    return { period, fertile };
  }, [predictions]);

  const dayKind = useCallback(
    day => {
      if (!day) return null;
      // Period wins over fertile when they meet. They should not overlap for any valid input —
      // validation rejects a period as long as its cycle — but drawing one colour deterministically
      // is better than depending on that.
      if (marks.period.some(([a, b]) => within(day, a, b))) return 'period';
      if (marks.fertile.some(([a, b]) => within(day, a, b))) return 'fertile';
      return null;
    },
    [marks],
  );

  const today = data?.today || null;

  const shiftMonth = delta => {
    let m = viewMonth + delta;
    let y = viewYear;
    if (m < 0) {
      m = 11;
      y -= 1;
    } else if (m > 11) {
      m = 0;
      y += 1;
    }
    setViewMonth(m);
    setViewYear(y);
  };

  const weeks = useMemo(() => buildMonthGrid(viewYear, viewMonth), [viewYear, viewMonth]);

  const onPickDay = day => {
    // A period cannot have started in the future. Refused here so the tap does nothing visible,
    // rather than accepting it and having the server reject the whole submit.
    if (today && day > today) {
      setToastType('error');
      setToast('That day has not happened yet.');
      return;
    }
    dispatch(clearCycleError());
    setLastPeriodStart(day);
  };

  const onSubmit = async () => {
    if (!lastPeriodStart) {
      setToastType('error');
      setToast('Pick the first day of your last period.');
      return;
    }
    const res = await dispatch(
      saveCycle({ lastPeriodStart, periodLengthDays, averageCycleLength }),
    );
    if (saveCycle.fulfilled.match(res)) {
      setToastType('success');
      setToast('Saved');
      // Jump the calendar to the month the next period falls in — the answer the patient came for
      // is frequently not in the month they were just looking at.
      const next = res.payload?.predictions?.upcoming?.[0]?.periodStart;
      if (next) {
        const [y, m] = next.split('-').map(Number);
        setViewYear(y);
        setViewMonth(m - 1);
      }
    }
  };

  if (loading && !data) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <View style={styles.centred}>
          <ActivityIndicator size="large" color={BRAND} />
        </View>
      </SafeAreaView>
    );
  }

  /* Tracking is off for this account — offered to female profiles only. Reached only by
   * navigating here directly, since Today hides the card, but it must say something truthful
   * rather than showing an empty calendar. */
  if (data && !data.trackingEnabled) {
    return (
      <SafeAreaView style={styles.safe} edges={['top']}>
        <Header navigation={navigation} />
        <View style={styles.centred}>
          <Text style={styles.emptyTitle}>Cycle tracking is not on</Text>
          <Text style={styles.emptyBody}>
            Cycle tracking is available for female profiles.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Header navigation={navigation} />
      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Calendar */}
        <View style={styles.card}>
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={() => shiftMonth(-1)} style={styles.monthBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ChevronLeft size={hp(2.4)} color={BRAND} />
            </TouchableOpacity>
            <Text style={styles.monthLabel}>
              {MONTH_NAMES[viewMonth]} {viewYear}
            </Text>
            <TouchableOpacity onPress={() => shiftMonth(1)} style={styles.monthBtn} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <ChevronRight size={hp(2.4)} color={BRAND} />
            </TouchableOpacity>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((d, i) => (
              <Text key={`${d}${i}`} style={styles.weekday}>
                {d}
              </Text>
            ))}
          </View>

          {weeks.map((week, wi) => (
            <View key={wi} style={styles.weekRow}>
              {week.map((day, di) => {
                if (!day) return <View key={di} style={styles.dayCell} />;
                const kind = dayKind(day);
                const selected = day === lastPeriodStart;
                const isToday = day === today;
                const future = today && day > today;
                return (
                  <TouchableOpacity
                    key={di}
                    onPress={() => onPickDay(day)}
                    style={styles.dayCell}
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.dayDot,
                        kind === 'period' && styles.dayPeriod,
                        kind === 'fertile' && styles.dayFertile,
                        selected && styles.daySelected,
                      ]}
                    >
                      <Text
                        style={[
                          styles.dayText,
                          !!kind && styles.dayTextOnColour,
                          selected && styles.dayTextSelected,
                          future && !kind && styles.dayTextFuture,
                        ]}
                      >
                        {Number(day.slice(8))}
                      </Text>
                    </View>
                    {isToday && <View style={styles.todayUnderline} />}
                  </TouchableOpacity>
                );
              })}
            </View>
          ))}

          <View style={styles.legend}>
            <LegendDot colour={PERIOD_RED} label="Estimated period" />
            <LegendDot colour={FERTILE_GREEN} label="Estimated fertile window" />
            <LegendDot colour={BRAND} label="Your last period" ring />
          </View>
        </View>

        {/* Questions */}
        <View style={styles.card}>
          <Text style={styles.fieldLabel}>First day of your last period</Text>
          <Text
            style={[
              styles.pickedDate,
              errorField === 'lastPeriodStart' && styles.pickedDateInvalid,
            ]}
          >
            {lastPeriodStart ? formatLong(lastPeriodStart) : 'Tap a day in the calendar above'}
          </Text>

          <Stepper
            label="How many days did it last?"
            value={periodLengthDays}
            min={bounds.periodLengthDays[0]}
            max={bounds.periodLengthDays[1]}
            suffix={periodLengthDays === 1 ? 'day' : 'days'}
            onChange={v => {
              dispatch(clearCycleError());
              setPeriodLengthDays(v);
            }}
            invalid={errorField === 'periodLengthDays'}
          />

          <Stepper
            label="Average cycle length"
            value={averageCycleLength}
            min={bounds.averageCycleLength[0]}
            max={bounds.averageCycleLength[1]}
            suffix="days"
            onChange={v => {
              dispatch(clearCycleError());
              setAverageCycleLength(v);
            }}
            invalid={errorField === 'averageCycleLength'}
          />

          {!!error && <Text style={styles.errorText}>{error}</Text>}

          <TouchableOpacity
            onPress={onSubmit}
            disabled={saving}
            style={[styles.submit, saving && styles.submitDisabled]}
            activeOpacity={0.85}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <Text style={styles.submitText}>Submit</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Results */}
        {!!predictions && (
          <View style={styles.card}>
            <Text style={styles.resultTitle}>Estimates</Text>
            <ResultRow
              colour={PERIOD_RED}
              label="Next period"
              value={`${formatLong(predictions.upcoming[0].periodStart)} – ${formatLong(
                predictions.upcoming[0].periodEnd,
              )}`}
            />
            <ResultRow
              colour={FERTILE_GREEN}
              label="Fertile window"
              value={`${formatLong(predictions.upcoming[0].fertileStart)} – ${formatLong(
                predictions.upcoming[0].fertileEnd,
              )}`}
            />

            {/* Said plainly, because somebody will use this to make a decision it cannot support.
                The fertile window in particular is a fixed offset from a predicted date — it is an
                average, not an observation of this body. */}
            <View style={styles.noteRow}>
              <Info size={hp(1.6)} color="#94A3B8" />
              <Text style={styles.noteText}>
                These are estimates from the dates you entered, not a medical assessment. They are
                not a reliable way to prevent or plan a pregnancy.
              </Text>
            </View>

            {/* The recorded date is old enough that the calendar is projecting forward from it. */}
            {predictions.isStale && (
              <View style={styles.noteRow}>
                <Info size={hp(1.6)} color="#B45309" />
                <Text style={[styles.noteText, styles.noteWarn]}>
                  These are projected from a period that started{' '}
                  {formatLong(predictions.lastPeriodStart)}. Update the date above for a closer
                  estimate.
                </Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {toast && (
        <View style={styles.toastWrap}>
          <Toast message={toast} type={toastType} onHide={() => setToast(null)} />
        </View>
      )}
    </SafeAreaView>
  );
}

function Header({ navigation }) {
  return (
    <View style={styles.header}>
      <TouchableOpacity
        onPress={() => navigation.goBack()}
        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
      >
        <ArrowLeft size={hp(2.6)} color="#16283F" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>My Cycle</Text>
    </View>
  );
}

function LegendDot({ colour, label, ring }) {
  return (
    <View style={styles.legendItem}>
      <View
        style={[
          styles.legendDot,
          ring
            ? { borderColor: colour, borderWidth: 2, backgroundColor: 'transparent' }
            : { backgroundColor: colour },
        ]}
      />
      <Text style={styles.legendText}>{label}</Text>
    </View>
  );
}

function ResultRow({ colour, label, value }) {
  return (
    <View style={styles.resultRow}>
      <View style={[styles.legendDot, { backgroundColor: colour }]} />
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text style={styles.resultLabel}>{label}</Text>
        <Text style={styles.resultValue}>{value}</Text>
      </View>
    </View>
  );
}

/** `2026-03-31` → `31 Mar 2026`. String in, string out — no Date, so no timezone can shift it. */
function formatLong(dateStr) {
  if (!dateStr) return '';
  const [y, m, d] = dateStr.split('-').map(Number);
  const short = MONTH_NAMES[m - 1]?.slice(0, 3) || '';
  return `${d} ${short} ${y}`;
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F5F7FA' },
  centred: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: wp(10) },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: wp(3),
    paddingHorizontal: wp(5),
    paddingVertical: hp(1.6),
    backgroundColor: '#FFFFFF',
  },
  headerTitle: { fontSize: hp(2.2), color: '#16283F', fontFamily: Fonts?.semiBold },
  scroll: { padding: wp(4), paddingBottom: hp(4) },

  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: wp(4),
    marginBottom: hp(1.6),
  },

  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: hp(1.4),
  },
  monthBtn: { padding: wp(1) },
  monthLabel: { fontSize: hp(1.95), color: '#16283F', fontFamily: Fonts?.semiBold },

  weekRow: { flexDirection: 'row' },
  weekday: {
    flex: 1,
    textAlign: 'center',
    fontSize: hp(1.4),
    color: '#94A3B8',
    marginBottom: hp(0.6),
  },
  dayCell: { flex: 1, alignItems: 'center', paddingVertical: hp(0.35) },
  dayDot: {
    height: hp(4),
    width: hp(4),
    borderRadius: hp(2),
    alignItems: 'center',
    justifyContent: 'center',
  },
  dayPeriod: { backgroundColor: PERIOD_RED },
  dayFertile: { backgroundColor: FERTILE_GREEN },
  // A ring, not a fill: the chosen day may also be a red or green day, and one must not hide
  // the other.
  daySelected: { borderWidth: 2, borderColor: BRAND },
  dayText: { fontSize: hp(1.6), color: '#334155' },
  dayTextOnColour: { color: '#FFFFFF' },
  dayTextSelected: { fontFamily: Fonts?.semiBold },
  dayTextFuture: { color: '#CBD5E1' },
  todayUnderline: {
    height: 3,
    width: hp(1.4),
    borderRadius: 2,
    backgroundColor: BRAND,
    marginTop: hp(0.2),
  },

  legend: { marginTop: hp(1.4), gap: hp(0.7) },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: wp(2) },
  legendDot: { height: hp(1.4), width: hp(1.4), borderRadius: hp(0.7) },
  legendText: { fontSize: hp(1.5), color: '#64748B' },

  fieldLabel: { fontSize: hp(1.7), color: '#16283F', fontFamily: Fonts?.semiBold },
  pickedDate: {
    fontSize: hp(1.8),
    color: BRAND,
    marginTop: hp(0.6),
    marginBottom: hp(1.6),
  },
  pickedDateInvalid: { color: PERIOD_RED },

  stepperRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: wp(3),
    marginBottom: hp(1.6),
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    paddingHorizontal: wp(2),
    paddingVertical: hp(0.5),
    gap: wp(2),
  },
  stepperInvalid: { borderColor: PERIOD_RED },
  stepperBtn: { padding: wp(1.5) },
  stepperValue: { fontSize: hp(1.8), color: '#16283F', minWidth: wp(16), textAlign: 'center' },
  stepperSuffix: { fontSize: hp(1.4), color: '#94A3B8' },

  errorText: { fontSize: hp(1.5), color: PERIOD_RED, marginBottom: hp(1) },

  submit: {
    backgroundColor: BRAND,
    borderRadius: 14,
    paddingVertical: hp(1.6),
    alignItems: 'center',
    marginTop: hp(0.6),
  },
  submitDisabled: { opacity: 0.6 },
  submitText: { color: '#FFFFFF', fontSize: hp(1.9), fontFamily: Fonts?.semiBold },

  resultTitle: {
    fontSize: hp(1.8),
    color: '#16283F',
    fontFamily: Fonts?.semiBold,
    marginBottom: hp(1.2),
  },
  resultRow: { flexDirection: 'row', alignItems: 'center', gap: wp(3), marginBottom: hp(1.2) },
  resultLabel: { fontSize: hp(1.5), color: '#64748B' },
  resultValue: { fontSize: hp(1.8), color: '#16283F' },

  noteRow: { flexDirection: 'row', gap: wp(2), marginTop: hp(0.8) },
  noteText: { flex: 1, fontSize: hp(1.4), color: '#94A3B8', lineHeight: hp(2) },
  noteWarn: { color: '#B45309' },

  emptyTitle: { fontSize: hp(2), color: '#16283F', fontFamily: Fonts?.semiBold, marginBottom: hp(1) },
  emptyBody: { fontSize: hp(1.6), color: '#64748B', textAlign: 'center', lineHeight: hp(2.4) },

  toastWrap: { position: 'absolute', bottom: hp(4), left: wp(5), right: wp(5) },
});
