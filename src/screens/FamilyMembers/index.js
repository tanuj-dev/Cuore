import React, { useCallback, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  KeyboardAvoidingView,
  Keyboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import moment from 'moment';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ArrowLeft, UserPlus, Trash2, Pencil, Users } from 'lucide-react-native';
import {
  heightPercentageToDP as hp,
  widthPercentageToDP as wp,
} from 'react-native-responsive-screen';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import {
  fetchDependants,
  addDependant,
  updateDependant,
  removeDependant,
} from '../../redux/Dependants/thunks';

/**
 * Family members on this account — a child, an elderly parent: someone who needs consultations
 * but has no phone of their own and never signs in.
 *
 * Each one is a separate patient on the backend, so their consultations, prescriptions and
 * records stay separate from the account holder's. Nothing is merged by phone number.
 */

const RELATIONSHIPS = ['child', 'spouse', 'parent', 'sibling', 'other'];
const GENDERS = ['female', 'male', 'other'];

const label = s => (s ? s.charAt(0).toUpperCase() + s.slice(1) : '');

export default function FamilyMembers({ navigation }) {
  const dispatch = useDispatch();
  // AlertComponent must be rendered for alert() to show anything — it is not a global.
  const { alert, AlertComponent } = useCustomAlert();

  const items = useSelector(state => state.dependants?.items || []);
  const loading = useSelector(state => state.dependants?.loading);
  const saving = useSelector(state => state.dependants?.saving);

  const [formOpen, setFormOpen] = useState(false);
  // The member being edited, or null when adding a new one. One modal serves both, so the two
  // forms cannot drift apart.
  const [editing, setEditing] = useState(null);
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState('child');
  const [gender, setGender] = useState('');
  const [dob, setDob] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [formError, setFormError] = useState('');

  const load = useCallback(() => {
    dispatch(fetchDependants());
  }, [dispatch]);

  useEffect(() => {
    load();
  }, [load]);

  const openAdd = () => {
    setEditing(null);
    setName('');
    setRelationship('child');
    setGender('');
    setDob(null);
    setFormError('');
    setFormOpen(true);
  };

  const openEdit = member => {
    setEditing(member);
    setName(member.name || '');
    setRelationship(member.relationship || 'child');
    setGender(member.gender || '');
    setDob(member.dob ? new Date(member.dob) : null);
    setFormError('');
    setFormOpen(true);
  };

  const submit = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setFormError('Please enter a name.');
      return;
    }
    const body = {
      name: trimmed,
      relationship,
      gender,
      dob: dob ? moment(dob).format('YYYY-MM-DD') : undefined,
    };

    const res = editing
      ? await dispatch(updateDependant({ dependantId: editing.dependantId, ...body }))
      : await dispatch(addDependant(body));

    const ok = editing
      ? updateDependant.fulfilled.match(res)
      : addDependant.fulfilled.match(res);

    if (ok) {
      setFormOpen(false);
      return;
    }
    // The server's wording is the useful one — it distinguishes the household cap from the 503
    // raised while the phone-index migration is still pending.
    setFormError(res.payload?.error || 'Could not save. Please try again.');
  };

  const confirmRemove = member => {
    alert(
      `Remove ${member.name}?`,
      'Their past consultations and documents are kept. You can add them again later.',
      [
        { text: 'Keep', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            const res = await dispatch(removeDependant(member.dependantId));
            if (!removeDependant.fulfilled.match(res)) {
              // The one a patient will actually hit: an active consultation blocks removal.
              alert('Could not remove', res.payload?.error || 'Please try again.');
            }
          },
        },
      ],
    );
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>{(item.name || '?').charAt(0).toUpperCase()}</Text>
      </View>
      <View style={styles.cardBody}>
        <Text style={styles.cardName} numberOfLines={1}>
          {item.name}
        </Text>
        <Text style={styles.cardMeta} numberOfLines={1}>
          {[
            label(item.relationship),
            item.gender ? label(item.gender) : '',
            item.dob ? `${moment().diff(moment(item.dob), 'years')} yrs` : '',
          ]
            .filter(Boolean)
            .join(' · ') || 'No details added'}
        </Text>
      </View>
      <TouchableOpacity
        onPress={() => openEdit(item)}
        style={styles.iconBtn}
        accessibilityLabel={`Edit ${item.name}`}
      >
        <Pencil size={17} color="#64748B" />
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => confirmRemove(item)}
        style={styles.iconBtn}
        accessibilityLabel={`Remove ${item.name}`}
      >
        <Trash2 size={17} color="#DC2626" />
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back} accessibilityLabel="Back">
          <ArrowLeft size={20} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.title}>Family members</Text>
      </View>

      <Text style={styles.intro}>
        Add a child or another family member who needs consultations. Each person keeps their own
        records and prescriptions, separate from yours.
      </Text>

      {loading && !items.length ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#11418A" />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={d => String(d.dependantId)}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Users size={34} color="#94A3B8" />
              <Text style={styles.emptyTitle}>No family members yet</Text>
              <Text style={styles.emptyBody}>
                Anyone you add here can be chosen when you book a consultation.
              </Text>
            </View>
          }
        />
      )}

      <TouchableOpacity style={styles.addBtn} onPress={openAdd} disabled={saving}>
        <UserPlus size={18} color="#FFFFFF" />
        <Text style={styles.addBtnText}>Add family member</Text>
      </TouchableOpacity>

      <Modal visible={formOpen} transparent animationType="slide" onRequestClose={() => setFormOpen(false)}>
        {/* React Native's Modal does nothing about the keyboard on its own, so the sheet has to
            avoid it itself — otherwise the lower fields and the Add button sit underneath it with
            no way to reach them. */}
        <KeyboardAvoidingView
          style={styles.backdrop}
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
          <View style={styles.sheet}>
            <Text style={styles.sheetTitle}>{editing ? 'Edit family member' : 'Add family member'}</Text>

            {/* The fields scroll; the buttons below do not. Keeping Cancel/Add outside the scroll
                view means they are always reachable, however tall the keyboard is or how far down
                the form the user has typed.

                keyboardShouldPersistTaps="handled" matters more than it looks: without it the
                first tap anywhere in here only dismisses the keyboard, so choosing a relationship
                chip or opening the date picker while typing would silently take two taps. */}
            <ScrollView
              style={styles.sheetScroll}
              contentContainerStyle={styles.sheetScrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >

            <Text style={styles.fieldLabel}>Full name</Text>
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Aarav Sharma"
              placeholderTextColor="#94A3B8"
              maxLength={80}
            />

            <Text style={styles.fieldLabel}>Relationship</Text>
            <View style={styles.chipRow}>
              {RELATIONSHIPS.map(r => (
                <TouchableOpacity
                  key={r}
                  style={[styles.chip, relationship === r && styles.chipOn]}
                  onPress={() => setRelationship(r)}
                >
                  <Text style={[styles.chipText, relationship === r && styles.chipTextOn]}>{label(r)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Sex</Text>
            <View style={styles.chipRow}>
              {GENDERS.map(g => (
                <TouchableOpacity
                  key={g}
                  style={[styles.chip, gender === g && styles.chipOn]}
                  onPress={() => setGender(gender === g ? '' : g)}
                >
                  <Text style={[styles.chipText, gender === g && styles.chipTextOn]}>{label(g)}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.fieldLabel}>Date of birth</Text>
            <TouchableOpacity
              style={styles.input}
              onPress={() => {
                // The iOS spinner is rendered inline; leaving the keyboard up would push it out
                // of view the moment it appears.
                Keyboard.dismiss();
                setShowPicker(true);
              }}
            >
              <Text style={dob ? styles.dateText : styles.datePlaceholder}>
                {dob ? moment(dob).format('D MMM YYYY') : 'Select a date (optional)'}
              </Text>
            </TouchableOpacity>
            {showPicker && (
              <DateTimePicker
                value={dob || new Date()}
                mode="date"
                // A birth date cannot be in the future. Bounded here as well as on the server,
                // so the picker cannot offer a value the API would silently drop.
                maximumDate={new Date()}
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={(event, selected) => {
                  if (Platform.OS === 'android') setShowPicker(false);
                  if (event?.type === 'dismissed') return;
                  if (selected) setDob(selected);
                }}
              />
            )}

              {!!formError && <Text style={styles.error}>{formError}</Text>}
            </ScrollView>

            <View style={styles.sheetActions}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setFormOpen(false)}>
                <Text style={styles.cancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={submit} disabled={saving}>
                {saving ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.saveText}>{editing ? 'Save' : 'Add'}</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {AlertComponent}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#F8FAFC' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: wp(4), paddingVertical: hp(1.4) },
  back: { padding: wp(1.5), marginRight: wp(1) },
  title: { fontSize: hp(2.3), fontWeight: '700', color: '#0F172A' },
  intro: { paddingHorizontal: wp(5), fontSize: hp(1.65), color: '#64748B', lineHeight: hp(2.4), marginBottom: hp(1.5) },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { paddingHorizontal: wp(4), paddingBottom: hp(14) },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: wp(3.5),
    padding: wp(3.5),
    marginBottom: hp(1.2),
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  avatar: {
    width: wp(11),
    height: wp(11),
    borderRadius: wp(5.5),
    backgroundColor: '#EFF6FF',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: wp(3),
  },
  avatarText: { fontSize: hp(2), fontWeight: '700', color: '#11418A' },
  cardBody: { flex: 1, minWidth: 0 },
  cardName: { fontSize: hp(1.9), fontWeight: '600', color: '#0F172A' },
  cardMeta: { fontSize: hp(1.5), color: '#64748B', marginTop: 2 },
  iconBtn: { padding: wp(2) },

  empty: { alignItems: 'center', paddingTop: hp(8), paddingHorizontal: wp(10) },
  emptyTitle: { fontSize: hp(1.95), fontWeight: '600', color: '#334155', marginTop: hp(1.5) },
  emptyBody: { fontSize: hp(1.6), color: '#94A3B8', textAlign: 'center', marginTop: hp(0.6), lineHeight: hp(2.3) },

  addBtn: {
    position: 'absolute',
    left: wp(4),
    right: wp(4),
    bottom: hp(3),
    backgroundColor: '#11418A',
    borderRadius: wp(3.5),
    paddingVertical: hp(1.8),
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: wp(2),
  },
  addBtnText: { color: '#FFFFFF', fontSize: hp(1.9), fontWeight: '700' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'flex-end' },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: wp(5),
    borderTopRightRadius: wp(5),
    padding: wp(5),
    paddingBottom: hp(4),
    // Without a bound the sheet grows to fit its content and the ScrollView inside never has
    // less room than it needs, so it never scrolls. Capping it is what makes the scroll real.
    maxHeight: '88%',
  },
  sheetScroll: { flexGrow: 0 },
  sheetScrollContent: { paddingBottom: hp(1) },
  sheetTitle: { fontSize: hp(2.1), fontWeight: '700', color: '#0F172A', marginBottom: hp(2) },
  fieldLabel: { fontSize: hp(1.6), color: '#64748B', marginBottom: hp(0.7), marginTop: hp(1.2), fontWeight: '600' },
  input: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: wp(2.5),
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(1.3),
    fontSize: hp(1.8),
    color: '#0F172A',
    backgroundColor: '#FFFFFF',
  },
  dateText: { fontSize: hp(1.8), color: '#0F172A' },
  datePlaceholder: { fontSize: hp(1.8), color: '#94A3B8' },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: wp(2) },
  chip: {
    paddingHorizontal: wp(3.5),
    paddingVertical: hp(0.7),
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  chipOn: { backgroundColor: '#11418A', borderColor: '#11418A' },
  chipText: { fontSize: hp(1.6), color: '#64748B', fontWeight: '600' },
  chipTextOn: { color: '#FFFFFF' },
  error: { color: '#DC2626', fontSize: hp(1.6), marginTop: hp(1.4) },
  sheetActions: { flexDirection: 'row', gap: wp(3), marginTop: hp(2.5) },
  cancelBtn: { flex: 1, paddingVertical: hp(1.6), borderRadius: wp(3), alignItems: 'center', borderWidth: 1, borderColor: '#E2E8F0' },
  cancelText: { fontSize: hp(1.85), color: '#64748B', fontWeight: '600' },
  saveBtn: { flex: 1, paddingVertical: hp(1.6), borderRadius: wp(3), alignItems: 'center', backgroundColor: '#11418A' },
  saveText: { fontSize: hp(1.85), color: '#FFFFFF', fontWeight: '700' },
});
