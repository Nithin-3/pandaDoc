import {TouchableOpacity,StyleSheet, Dimensions} from 'react-native';
import {useState,useLayoutEffect, useEffect} from "react";
import {RTCView} from "react-native-webrtc"
import {MaterialIcons} from '@expo/vector-icons/';
import {ThemedText} from '@/components/ThemedText';
import {ThemedView} from '@/components/ThemedView';
import {useThemeColor} from "@/hooks/useThemeColor"
import {useNavigation} from 'expo-router'
import {useRoute} from "@react-navigation/native"
import { peer } from '@/constants/webrtc';
import socket from '@/constants/Socket';
type RouteParams = {
    uid:string;
    nam:string;
    cal:'IN'|'ON';
}
export default function call(){
    const { uid, nam , cal } = useRoute().params as RouteParams;
    const [remAud,sremAud] = useState(true);
    const [locAud,slocAud] = useState(true);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const [call,scall] = useState<'IN'|'ON'>(cal);
    const [flip,sflip] = useState(true);
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const nav = useNavigation();
    useLayoutEffect(()=>{nav.setOptions({headerShown: false,})},[nav])
    useEffect(()=>{
        console.log(uid,nam);
        (async()=>{
        await peer?.bgnStrm(uid);
        setLocalStream((await peer?.getLocStrm()));
        setRemoteStream((await peer?.getRemStrm(uid)));
        })();
        socket.on('encall',()=>{
            peer?.close(uid);
            nav.goBack();
        })
    },[])
    const audioOut = (stream: MediaStream|null,set: Function) => {
        stream?.getAudioTracks().forEach(track => {
            set(!track.enabled)
            track.enabled = !track.enabled;
        });
    };
    const flipCamera = async () => {
        const trk = localStream?.getVideoTracks()[0];
        if(trk && typeof trk._switchCamera === 'function'){
            trk._switchCamera();
        }else{
            localStream?.getTracks().forEach(t=>t.stop());
            const fli = await peer?.stStrm({facingMode : flip? "environment":"user"});
            await peer?.replaceVid(fli?.getVideoTracks()[0],uid)
        }
        sflip(p=>!p)
    };
    const stCall = async ()=>{
        const off = await peer?.crOff(uid);
        socket.emit('offer',uid,off);
        scall('ON')

    }
    const enCall =()=>{
        peer?.close(uid);
        nav.goBack();
        socket.emit('encall');
    }
    return (
  <ThemedView style={style.chat}>
    <ThemedView style={style.videoHalf}>
      {localStream && (
        <RTCView streamURL={localStream.toURL()} objectFit="cover" mirror={flip} style={StyleSheet.absoluteFill} />
      )}
      <TouchableOpacity onPress={() => audioOut(localStream, slocAud)} style={style.micBtn}>
        <MaterialIcons name={locAud ? 'mic' : 'mic-off'} size={30} color={borderColor} />
      </TouchableOpacity>
    </ThemedView>
    <ThemedView style={style.videoHalf}>
      {remoteStream && (
        <RTCView streamURL={remoteStream.toURL()} objectFit="cover" style={StyleSheet.absoluteFill} />
      )}
    </ThemedView>
    <ThemedView style={style.calBtn}>
      <TouchableOpacity onPress={() => audioOut(remoteStream, sremAud)}>
        <MaterialIcons name={remAud ? 'volume-up' : 'volume-off'} size={30} color={borderColor} />
      </TouchableOpacity>
      <TouchableOpacity onPress={call === 'IN' ? stCall : enCall}>
        <MaterialIcons name={call === 'IN' ? 'call' : 'call-end'} size={30} color={borderColor} />
      </TouchableOpacity>
      <TouchableOpacity onPress={flipCamera}>
        <MaterialIcons name="flip-camera-android" size={30} color={borderColor} />
      </TouchableOpacity>
    </ThemedView>
  </ThemedView>
);


}
const style = StyleSheet.create({
  chat: {
    flex: 1,
  },
  videoHalf: {
    height: '50%',
    width: '100%',
    position: 'relative',
    overflow: 'hidden',
  },
  micBtn: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  calBtn: {
    height: 60,
    width: '100%',
    position: 'absolute',
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    borderTopWidth: 1,
    borderColor: '#fff',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
})

