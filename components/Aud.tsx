import { useEffect } from "react";
import { TouchableOpacity, StyleSheet } from "react-native";
import { useAudioPlayer } from 'expo-audio';
import Slider from '@react-native-community/slider';
import MaterialIcons from '@expo/vector-icons/MaterialIcons';
import { ThemedView } from "./ThemedView";
import { ThemedText } from "./ThemedText";
import { useThemeColor } from "@/hooks/useThemeColor";

type AudProps = {
  uri: string;
};

export default function Aud({ uri }: AudProps) {
  const player = useAudioPlayer({ uri });
  const timeFormat = (sec: number) => (`${Math.floor(sec / 60)}:${sec % 60}`)
    const color = useThemeColor({light:undefined,dark:undefined},'text');
  useEffect(() => {
    return player.remove
  }, []);
  const play = player.playing;
  const duration = player.duration || 1;
  const position = player.currentTime;

  return (
    <ThemedView style={styles.container}>
      <TouchableOpacity onPress={play ? player.pause : player.play}>
        <MaterialIcons name={play ? 'pause' : 'play-arrow'} size={28} />
      </TouchableOpacity>
      <Slider thumbTintColor={color} minimumTrackTintColor={color} maximumTrackTintColor="gray" style={styles.slider} minimumValue={0} maximumValue={duration} value={position} onSlidingComplete={v => player.seekTo(v)}/>
      <ThemedText>{timeFormat(position)}/{timeFormat(duration)}</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  slider: {
    flex: 1,
  },
});

