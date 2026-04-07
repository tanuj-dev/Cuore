import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  PanResponder,
  Animated,
  Dimensions,
  SafeAreaView,
  Share,
  Platform,
} from 'react-native';
import ApiLogger from '../../utilities/ApiLogger';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

const STATUS_COLORS = {
  pending: '#F59E0B',
  200: '#10B981',
  201: '#10B981',
  204: '#10B981',
  400: '#EF4444',
  401: '#EF4444',
  403: '#EF4444',
  404: '#EF4444',
  500: '#EF4444',
  ERR: '#EF4444',
};

const METHOD_COLORS = {
  GET: '#3B82F6',
  POST: '#10B981',
  PUT: '#F59E0B',
  DELETE: '#EF4444',
};

const buildCurl = (item) => {
  let curl = `curl -X ${item.method} '${item.url}'`;
  curl += ` \\\n  -H 'Content-Type: application/json'`;
  if (item.body && item.body !== '[FormData]') {
    const bodyStr = typeof item.body === 'string' ? item.body : JSON.stringify(item.body);
    curl += ` \\\n  -d '${bodyStr}'`;
  }
  return curl;
};

const formatJson = (data) => {
  if (!data) return 'null';
  if (typeof data === 'string') return data;
  return JSON.stringify(data, null, 2);
};

const shareText = async (title, text) => {
  try {
    await Share.share({ title, message: text });
  } catch (_) {}
};

const LogItem = ({ item }) => {
  const [expanded, setExpanded] = useState(false);
  const statusColor = STATUS_COLORS[item.status] || '#6B7280';
  const methodColor = METHOD_COLORS[item.method] || '#6B7280';
  const time = item.timestamp ? new Date(item.timestamp).toLocaleTimeString() : '';

  if (item.status === 'pending') return null;

  const bodyText = formatJson(item.body);
  const responseText = formatJson(item.response);

  return (
    <TouchableOpacity
      style={styles.logItem}
      onPress={() => setExpanded(!expanded)}
      activeOpacity={0.7}
    >
      <View style={styles.logHeader}>
        <View style={[styles.methodBadge, { backgroundColor: methodColor }]}>
          <Text style={styles.methodText}>{item.method}</Text>
        </View>
        <View style={[styles.statusBadge, { backgroundColor: statusColor }]}>
          <Text style={styles.statusText}>{item.status}</Text>
        </View>
        {item.duration != null && (
          <Text style={styles.durationText}>{item.duration}ms</Text>
        )}
        <Text style={styles.timeText}>{time}</Text>
      </View>
      <Text style={styles.urlText} numberOfLines={expanded ? undefined : 1}>
        {item.url}
      </Text>
      {expanded && (
        <View style={styles.details}>
          {/* Action buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => shareText('cURL', buildCurl(item))}
            >
              <Text style={styles.actionBtnText}>Share cURL</Text>
            </TouchableOpacity>
            {item.body && (
              <TouchableOpacity
                style={styles.actionBtn}
                onPress={() => shareText('Request Body', bodyText)}
              >
                <Text style={styles.actionBtnText}>Share Body</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.actionBtn}
              onPress={() => shareText('Response', responseText)}
            >
              <Text style={styles.actionBtnText}>Share Response</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.actionBtn, styles.shareAllBtn]}
              onPress={() => {
                const full = `${item.method} ${item.url}\nStatus: ${item.status} | ${item.duration}ms\n\n--- Request Body ---\n${bodyText}\n\n--- Response ---\n${responseText}\n\n--- cURL ---\n${buildCurl(item)}`;
                shareText('API Log', full);
              }}
            >
              <Text style={[styles.actionBtnText, styles.shareAllText]}>Share All</Text>
            </TouchableOpacity>
          </View>

          {item.body && (
            <View style={styles.detailSection}>
              <Text style={styles.detailLabel}>Request Body:</Text>
              <Text style={styles.detailValue} selectable>
                {bodyText}
              </Text>
            </View>
          )}
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>Response:</Text>
            <Text style={styles.detailValue} selectable>
              {responseText}
            </Text>
          </View>
          <View style={styles.detailSection}>
            <Text style={styles.detailLabel}>cURL:</Text>
            <Text style={styles.detailValue} selectable>
              {buildCurl(item)}
            </Text>
          </View>
        </View>
      )}
    </TouchableOpacity>
  );
};

const ApiDebugger = () => {
  const [visible, setVisible] = useState(false);
  const [logs, setLogs] = useState([]);
  const [count, setCount] = useState(0);
  const pan = useRef(new Animated.ValueXY({ x: SCREEN_W - 70, y: SCREEN_H - 200 })).current;

  useEffect(() => {
    const unsub = ApiLogger.subscribe(newLogs => {
      const filtered = newLogs.filter(l => l.status !== 'pending');
      setLogs(filtered);
      setCount(filtered.length);
    });
    return unsub;
  }, []);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 5 || Math.abs(g.dy) > 5,
      onPanResponderGrant: () => {
        pan.setOffset({ x: pan.x._value, y: pan.y._value });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event([null, { dx: pan.x, dy: pan.y }], { useNativeDriver: false }),
      onPanResponderRelease: (_, g) => {
        pan.flattenOffset();
        if (Math.abs(g.dx) < 5 && Math.abs(g.dy) < 5) {
          setVisible(true);
        }
      },
    }),
  ).current;

  return (
    <>
      <Animated.View
        style={[styles.fab, { transform: pan.getTranslateTransform() }]}
        {...panResponder.panHandlers}
      >
        <Text style={styles.fabIcon}>API</Text>
        {count > 0 && (
          <View style={styles.badge}>
            <Text style={styles.badgeText} numberOfLines={1}>
              {count > 99 ? '99+' : String(count)}
            </Text>
          </View>
        )}
      </Animated.View>

      <Modal visible={visible} animationType="slide" transparent={false}>
        <SafeAreaView style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>API Logs ({logs.length})</Text>
            <View style={styles.headerButtons}>
              <TouchableOpacity
                style={styles.clearBtn}
                onPress={() => ApiLogger.clear()}
              >
                <Text style={styles.clearBtnText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.closeBtn}
                onPress={() => setVisible(false)}
              >
                <Text style={styles.closeBtnText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
          <FlatList
            data={logs}
            keyExtractor={item => String(item.id)}
            renderItem={({ item }) => <LogItem item={item} />}
            contentContainerStyle={styles.list}
            ListEmptyComponent={
              <Text style={styles.emptyText}>No API calls yet</Text>
            }
          />
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#1E293B',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'visible',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 9999,
  },
  fabIcon: {
    color: '#10B981',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  badge: {
    position: 'absolute',
    top: 4,
    right: 4,
    backgroundColor: '#EF4444',
    borderRadius: 11,
    minWidth: 22,
    paddingHorizontal: 7,
    paddingVertical: 3,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#1E293B',
  },
  badgeText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    textAlign: 'center',
    flexShrink: 0,
    ...(Platform.OS === 'android' ? { includeFontPadding: false } : {}),
  },
  modal: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1E293B',
  },
  modalTitle: {
    color: '#F1F5F9',
    fontSize: 18,
    fontWeight: '700',
  },
  headerButtons: {
    flexDirection: 'row',
    gap: 10,
  },
  clearBtn: {
    backgroundColor: '#1E293B',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  clearBtnText: {
    color: '#F59E0B',
    fontSize: 14,
    fontWeight: '600',
  },
  closeBtn: {
    backgroundColor: '#3B82F6',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  closeBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
  list: {
    padding: 12,
  },
  logItem: {
    backgroundColor: '#1E293B',
    borderRadius: 10,
    padding: 12,
    marginBottom: 8,
  },
  logHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  methodBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  methodText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '800',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 4,
  },
  statusText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
  },
  durationText: {
    color: '#94A3B8',
    fontSize: 11,
  },
  timeText: {
    color: '#64748B',
    fontSize: 11,
    marginLeft: 'auto',
  },
  urlText: {
    color: '#CBD5E1',
    fontSize: 13,
    fontFamily: 'monospace',
  },
  details: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#334155',
    paddingTop: 10,
  },
  actionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  actionBtn: {
    backgroundColor: '#334155',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionBtnText: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
  },
  shareAllBtn: {
    backgroundColor: '#1D4ED8',
  },
  shareAllText: {
    color: '#FFF',
  },
  detailSection: {
    marginBottom: 10,
  },
  detailLabel: {
    color: '#94A3B8',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailValue: {
    color: '#E2E8F0',
    fontSize: 12,
    fontFamily: 'monospace',
    backgroundColor: '#0F172A',
    padding: 10,
    borderRadius: 6,
    overflow: 'hidden',
  },
  emptyText: {
    color: '#64748B',
    fontSize: 16,
    textAlign: 'center',
    marginTop: 40,
  },
});

export default ApiDebugger;
