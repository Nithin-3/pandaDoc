import { useVideoPlayer, VideoView } from 'expo-video';
import { StyleSheet,} from 'react-native';
import { ThemedView } from './ThemedView';
import {useIsFocused} from '@react-navigation/native'
import {InView} from 'react-native-intersection-observer'
import { useEffect } from 'react';
type VidProps = {
    uri: string;
};

export default function Vid({ uri}: VidProps) {
    const player = useVideoPlayer(uri);
    const foc = useIsFocused();
    useEffect(()=>{
        !foc && player.pause()
    },[foc])
    return (
        <InView onChange={vis=>vis || player.pause()} style={styles.container}>
        <ThemedView style={styles.container}>
            <VideoView style={styles.video} player={player} contentFit='contain' nativeControls allowsFullscreen allowsPictureInPicture/>
        </ThemedView>
        </InView>
    );
}

const styles = StyleSheet.create({
    container: {
        width:'100%',
        height:"100%",
    },
    video: {
        flex:1,
    },
});

