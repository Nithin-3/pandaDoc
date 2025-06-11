import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet, TouchableOpacity} from 'react-native';
import { ThemedView } from './ThemedView';
import { useEvent, useEventListener } from 'expo';
import { MaterialIcons } from '@expo/vector-icons';
import Slider from '@react-native-community/slider';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useState } from 'react';

type VidProps = {
    uri: string;
};

export default function Vid({ uri }: VidProps) {
    const player = useVideoPlayer(uri, player => {
        player.timeUpdateEventInterval = 1;
    });
    const [time, stime] = useState(0);
    const { isPlaying } = useEvent(player, 'playingChange', { isPlaying: player.playing });
    useEventListener(player, 'timeUpdate', pla => {
        stime(pla.currentTime);
    });
    const color = useThemeColor({ light: undefined, dark: undefined }, 'text');

    return (
        <ThemedView style={styles.container}>
            <VideoView style={styles.video} player={player} contentFit="contain" allowsFullscreen allowsPictureInPicture/>
            <ThemedView style={styles.controls}>
                <TouchableOpacity onPress={isPlaying ? player.pause : player.play}>
                    <MaterialIcons name={isPlaying ? 'pause' : 'play-arrow'} size={28} />
                </TouchableOpacity>
                <Slider style={styles.slider} thumbTintColor={color} minimumTrackTintColor={color} maximumTrackTintColor="gray" minimumValue={0} maximumValue={player.duration} value={time} onSlidingComplete={player.seekBy}/>
                <MaterialIcons name="volume-up" size={28} />
                <Slider style={styles.volumeSlider} thumbTintColor={color} minimumTrackTintColor={color} maximumTrackTintColor="gray" minimumValue={0} maximumValue={1} onSlidingComplete={v => (player.volume = v)}/>
            </ThemedView>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    container: {
        width: '100%',
        height: '100%',
        flex: 1,
    },
    video: {
        flex: 1,
    },
    controls: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 8,
        gap: 8,
    },
    slider: {
        flex: 1,
    },
    volumeSlider: {
        width: 100,
    },
});

