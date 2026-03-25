import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Platform,
  KeyboardAvoidingView,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { hp, wp, Images } from '../../utilities';
import { useCustomAlert } from '../../hooks/useCustomAlert';
import {
  fetchNotes,
  createNote,
  updateNote,
  deleteNote,
} from '../../redux/Notes/notesThunk';

const formatDate = date => {
  const d = new Date(date);
  const day = d.getDate();
  const month = d.toLocaleString('en-US', { month: 'short' });
  const year = String(d.getFullYear()).slice(-2);
  return `${day} ${month} ${year}`;
};

const MAX_WORDS = 180;

const countWords = text => text.trim() === '' ? 0 : text.trim().split(/\s+/).length;

const Notes = () => {
  const dispatch = useDispatch();
  const { alert, AlertComponent } = useCustomAlert();
  const { data: notes, loading, saving } = useSelector(state => state.notes);

  const [inputText, setInputText] = useState('');
  const [editingId, setEditingId] = useState(null);

  const wordCount = countWords(inputText);

  useEffect(() => {
    dispatch(fetchNotes());
  }, [dispatch]);

  const handleTextChange = useCallback(text => {
    if (countWords(text) <= MAX_WORDS) {
      setInputText(text);
    }
  }, []);

  const handleSave = useCallback(() => {
    const text = inputText.trim();
    if (!text) return;

    if (editingId) {
      dispatch(updateNote({ id: editingId, text }));
      setEditingId(null);
    } else {
      dispatch(createNote(text));
    }
    setInputText('');
  }, [inputText, editingId, dispatch]);

  const handleEdit = useCallback(note => {
    setInputText(note.text);
    setEditingId(note._id);
  }, []);

  const handleDelete = useCallback(
    id => {
      alert('Delete Note', 'Are you sure you want to delete this note?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            dispatch(deleteNote(id));
            if (editingId === id) {
              setEditingId(null);
              setInputText('');
            }
          },
        },
      ]);
    },
    [editingId, dispatch, alert],
  );

  const renderNote = ({ item }) => (
    <View style={styles.noteWrapper}>
      <View style={styles.noteCard}>
        <Text style={styles.noteDate}>{formatDate(item.createdAt)}</Text>
        <Text style={styles.noteText}>{item.text}</Text>
      </View>
      <View style={styles.noteActions}>
        <TouchableOpacity
          onPress={() => handleEdit(item)}
          style={styles.actionBtn}
        >
          <Image source={Images.EDIT} style={styles.editIcon} />
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => handleDelete(item._id)}
          style={styles.actionBtn}
        >
          <Image source={Images.DELETE} style={styles.deleteIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      {AlertComponent}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <Text style={styles.screenTitle}>Notes</Text>

        <View style={styles.inputCard}>
          <TextInput
            style={styles.input}
            placeholder="Add anything you'd like to discuss at your next visit."
            placeholderTextColor="#94A3B8"
            multiline
            value={inputText}
            onChangeText={handleTextChange}
            blurOnSubmit={false}
          />
          {inputText.length > 0 && (
            <Text
              style={[
                styles.charCount,
                wordCount >= MAX_WORDS && styles.charCountWarning,
              ]}
            >
              {wordCount}/{MAX_WORDS} words
            </Text>
          )}
          {inputText.trim().length > 0 && (
            <TouchableOpacity
              style={styles.addBtn}
              onPress={handleSave}
              disabled={saving}
            >
              {saving ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.addBtnText}>
                  {editingId ? 'Update' : 'Save'}
                </Text>
              )}
            </TouchableOpacity>
          )}
        </View>

        {loading ? (
          <ActivityIndicator
            color="#11418A"
            size="large"
            style={styles.loader}
          />
        ) : notes.length > 0 ? (
          <View style={styles.listCard}>
            <FlatList
              data={notes}
              keyExtractor={item => item._id}
              renderItem={renderNote}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
              showsVerticalScrollIndicator={false}
            />
          </View>
        ) : (
          <View style={styles.emptyState}>
            {/* <Image source={Images.noNotification} style={styles.emptyIcon} /> */}
            <Text style={styles.emptyTitle}>No notes yet</Text>
            <Text style={styles.emptySubtitle}>
              Add a note above to keep track of things you'd like to discuss at
              your next visit.
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F1F5F9',
  },
  flex: {
    flex: 1,
  },
  screenTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 22,
    color: '#1E293B',
    textAlign: 'center',
    paddingVertical: hp(2),
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  loader: {
    marginTop: hp(4),
  },
  inputCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    margin: wp(4),
    padding: hp(2),
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    ...Platform.select({ android: { elevation: 1 } }),
  },
  input: {
    fontFamily: 'Poppins-Regular',
    fontSize: 14,
    color: '#334155',
    minHeight: hp(10),
    textAlignVertical: 'top',
  },
  charCount: {
    fontFamily: 'Poppins-Regular',
    fontSize: 11,
    color: '#64748B',
    textAlign: 'right',
    marginTop: hp(0.5),
  },
  charCountWarning: {
    color: '#EF4444',
  },
  addBtn: {
    alignSelf: 'flex-end',
    backgroundColor: '#11418A',
    paddingHorizontal: wp(5),
    paddingVertical: hp(1),
    borderRadius: 8,
    marginTop: hp(1),
    minWidth: wp(20),
    alignItems: 'center',
  },
  addBtnText: {
    fontFamily: 'Poppins-Medium',
    color: '#FFFFFF',
    fontSize: 13,
  },
  listCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginHorizontal: wp(4),
    marginBottom: hp(2),
    padding: hp(2),
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    ...Platform.select({ android: { elevation: 1 } }),
    flex: 1,
  },
  noteWrapper: {
    marginBottom: hp(0.5),
  },
  noteCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    padding: hp(1.5),
  },
  noteDate: {
    fontFamily: 'Poppins-Medium',
    fontSize: 13,
    color: '#1E293B',
    marginBottom: hp(0.5),
  },
  noteText: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#475569',
    lineHeight: 20,
  },
  noteActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginTop: hp(0.5),
    gap: wp(3),
  },
  actionBtn: {
    padding: 6,
  },
  editIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#11418A',
  },
  deleteIcon: {
    width: 20,
    height: 20,
    resizeMode: 'contain',
    tintColor: '#EF4444',
  },
  separator: {
    height: hp(1.5),
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: wp(10),
    marginTop: hp(2),
  },
  emptyIcon: {
    width: 80,
    height: 80,
    resizeMode: 'contain',
    opacity: 0.4,
    marginBottom: hp(2),
  },
  emptyTitle: {
    fontFamily: 'Poppins-Medium',
    fontSize: 16,
    color: '#1E293B',
    marginBottom: hp(1),
  },
  emptySubtitle: {
    fontFamily: 'Poppins-Regular',
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default Notes;
