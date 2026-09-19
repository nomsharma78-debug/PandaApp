import React, { useRef } from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';

export function NativeVideoPlayer({
  source,
  style,
  autoPlay = true,
  loop = false,
  showControls = true,
}) {
  const safeSource = source || '';
  const player = useVideoPlayer(safeSource, (p) => {
    if (p) {
      p.loop = loop;
      if (autoPlay && source) {
        p.play();
      }
    }
  });

  if (!source) {
    return (
      <View style={[styles.container, style]}>
        <ActivityIndicator size="small" color="#2dd4bf" />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <VideoView
        style={styles.video}
        player={player}
        allowsFullscreen
        allowsPictureInPicture
        nativeControls={showControls}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  video: {
    width: '100%',
    height: '100%',
  },
});
