import React from 'react';
import { View, StyleSheet, ActivityIndicator } from 'react-native';
import { useVideoPlayer, VideoView } from 'expo-video';
import { Play } from 'lucide-react-native';

export const VideoThumbnailTile = React.memo(function VideoThumbnailTile({ uri, isLoading = false }) {
  if (isLoading || !uri) {
    return (
      <View style={styles.placeholder}>
        {isLoading ? (
          <ActivityIndicator size="small" color="#f43f5e" />
        ) : (
          <View style={styles.playBadge}>
            <Play size={15} color="#ffffff" fill="#ffffff" />
          </View>
        )}
      </View>
    );
  }

  return <VideoCoverFrame uri={uri} />;
});

function VideoCoverFrame({ uri }) {
  const player = useVideoPlayer(uri, (p) => {
    p.muted = true;
    p.loop = false;
    p.pause();
  });

  return (
    <View style={styles.container}>
      <VideoView
        player={player}
        style={styles.video}
        nativeControls={false}
        contentFit="cover"
      />
      <View style={styles.overlay}>
        <View style={styles.playBadge}>
          <Play size={16} color="#ffffff" fill="#ffffff" />
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    position: 'relative',
    overflow: 'hidden',
  },
  video: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(244, 63, 94, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(15, 23, 42, 0.85)',
    borderWidth: 1.5,
    borderColor: 'rgba(255, 255, 255, 0.35)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingLeft: 2,
  },
});
