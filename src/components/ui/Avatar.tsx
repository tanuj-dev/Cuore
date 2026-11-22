import React, { useEffect, useState } from 'react';
import { Image, StyleSheet, View } from 'react-native';
import { Text } from './Text';
import { useTheme } from '../../theme';

/* Initials are always drawn; a photo, when there is one, sits on top of them. A stored photo
 * address can point at a file that is gone, unreadable, still loading or blank, and an <Image> in
 * any of those states draws nothing, which used to leave an empty circle where the doctor's
 * initials belong. Layering means every one of those states still shows something sensible. */
export default function Avatar({ name, uri, size = 44 }: { name?: string; uri?: string; size?: number }) {
  const t = useTheme();
  const [failed, setFailed] = useState(false);
  // A new address (for example a freshly picked photo) deserves a fresh attempt.
  useEffect(() => setFailed(false), [uri]);
  const box = { width: size, height: size, borderRadius: size / 2 };
  return (
    <View style={[styles.c, box, { backgroundColor: t.brandSoft }]}>
      <Text style={{ color: t.brand, fontWeight: '700', fontSize: size * 0.36 }}>{initials(name)}</Text>
      {uri && !failed ? (
        <Image
          source={{ uri }}
          style={[StyleSheet.absoluteFill, box]}
          onError={() => setFailed(true)}
          accessibilityLabel={name ? `${name} photo` : 'Profile photo'}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({ c: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' } });

function initials(name?: string) {
  return (
    (name || '?')
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map(p => p[0]?.toUpperCase())
      .join('') || '?'
  );
}
