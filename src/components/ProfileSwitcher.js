/**
 * SWAP USER — the family-plan profile switcher.
 *
 * "Create family plan in Cuore — 2 or more people in the same app — parent can have upto 2
 * dependents — swap user."
 *
 * The switching itself already existed, but only as two inline chip rows buried inside Booking
 * and Health Records. That meant the app's idea of "who am I acting for" was invisible everywhere
 * else, and a parent who picked their child while booking had no way to see, from any other
 * screen, that the app was still pointed at the child.
 *
 * This is the one control: a compact chip that always SHOWS the active profile, and opens a sheet
 * to change it. Placed in the header of the screens where the answer changes what you see.
 *
 * ── WHY IT IS A CHIP AND NOT A SILENT SETTING ────────────────────────────────────────────────
 * Acting as somebody else is a mode, and an invisible mode is how a parent books a cardiology
 * appointment for their eight-year-old. It reads "You" or the family member's name at all times,
 * and turns brand-coloured when it is NOT you — so the unusual state is the one that stands out.
 *
 * `activeProfileId` lives in redux/Dependants/slice.js and is null for the account holder. This
 * component neither owns nor duplicates that state; it renders it and dispatches to change it.
 */
import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import { ChevronDown, Check, User, Users } from 'lucide-react-native';

import { setActiveProfile } from '../redux/Dependants/slice';
import { fetchDependants } from '../redux/Dependants/thunks';

const BRAND = '#11418A';

export default function ProfileSwitcher({ style, compact = false }) {
  const dispatch = useDispatch();
  const [open, setOpen] = useState(false);

  const dependants = useSelector(s => s.dependants?.items) || [];
  const activeProfileId = useSelector(s => s.dependants?.activeProfileId) || null;
  const myName = useSelector(s => s.profile?.data?.data?.display_name) || 'You';

  // Family members are loaded here rather than assumed: this control is often the first thing
  // on screen, and a switcher that renders nothing because nobody fetched the list is worse
  // than one that fetches it.
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchDependants());
    }, [dispatch]),
  );

  // Nothing to switch between. A patient with no family members should never be asked to pick
  // themselves out of a list of one.
  if (!dependants.length) return null;

  const active = dependants.find(
    d => String(d.dependantId) === String(activeProfileId),
  );
  const label = active ? active.name : compact ? 'You' : myName;
  const actingAsOther = !!active;

  const choose = id => {
    dispatch(setActiveProfile(id));
    setOpen(false);
  };

  return (
    <>
      <TouchableOpacity
        onPress={() => setOpen(true)}
        activeOpacity={0.8}
        style={[styles.chip, actingAsOther && styles.chipActive, style]}
      >
        {actingAsOther ? (
          <Users size={13} color="#FFFFFF" />
        ) : (
          <User size={13} color={BRAND} />
        )}
        <Text
          numberOfLines={1}
          style={[styles.chipText, actingAsOther && styles.chipTextActive]}
        >
          {label}
        </Text>
        <ChevronDown size={13} color={actingAsOther ? '#FFFFFF' : BRAND} />
      </TouchableOpacity>

      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          {/* Stops a tap inside the sheet from closing it. */}
          <Pressable style={styles.sheet} onPress={() => {}}>
            <View style={styles.handle} />
            <Text style={styles.sheetTitle}>Who is this for?</Text>
            <Text style={styles.sheetSub}>
              Bookings, records and prescriptions will be for the person you pick.
            </Text>

            <Row
              label={myName}
              caption="Account holder"
              selected={!activeProfileId}
              onPress={() => choose(null)}
            />
            {dependants.map(d => (
              <Row
                key={d.dependantId}
                label={d.name}
                caption={d.relationship ? capitalise(d.relationship) : 'Family member'}
                selected={String(d.dependantId) === String(activeProfileId)}
                onPress={() => choose(d.dependantId)}
              />
            ))}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function Row({ label, caption, selected, onPress }) {
  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.7}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowLabel, selected && styles.rowLabelOn]}>{label}</Text>
        <Text style={styles.rowCaption}>{caption}</Text>
      </View>
      {selected ? <Check size={18} color={BRAND} /> : null}
    </TouchableOpacity>
  );
}

const capitalise = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : s);

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#DBE5F1',
    backgroundColor: '#F2F6FB',
    maxWidth: 170,
  },
  chipActive: { backgroundColor: BRAND, borderColor: BRAND },
  chipText: { fontSize: 12, fontWeight: '600', color: BRAND, flexShrink: 1 },
  chipTextActive: { color: '#FFFFFF' },

  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 22,
    borderTopRightRadius: 22,
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 28,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    marginBottom: 14,
  },
  sheetTitle: { fontSize: 17, fontWeight: '700', color: '#16283F' },
  sheetSub: { fontSize: 12, color: '#64748B', marginTop: 3, marginBottom: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 13,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rowLabel: { fontSize: 15, fontWeight: '600', color: '#16283F' },
  rowLabelOn: { color: BRAND },
  rowCaption: { fontSize: 11.5, color: '#94A3B8', marginTop: 1 },
});
