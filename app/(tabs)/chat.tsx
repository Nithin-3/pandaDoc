import { FlatList, StyleSheet, TouchableOpacity,Keyboard,TouchableWithoutFeedback,SafeAreaView,Platform,Modal} from 'react-native'
import { useEffect,useState,useRef,useLayoutEffect,} from "react";
import RNFS from 'react-native-fs';
import { ThemedText } from '@/components/ThemedText';
import { ThemedInput } from '@/components/ThemedInput';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import socket from '@/constants/Socket';
import {useRoute} from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system';
import AntDesign from '@expo/vector-icons/AntDesign';
import { RTCPeerConnection,RTCIceCandidate,RTCSessionDescription,mediaDevices, RTCView} from "react-native-webrtc"
import {useNavigation} from 'expo-router'
import { TextInput } from 'react-native-gesture-handler';
import {addChat,readChat,} from '@/constants/file';
import ScreenCaptureSecure from 'react-native-screen-capture-secure';
const CONTACTS_KEY = "chat_contacts";
type RouteParams = {
    uid: string;
    nam: string;
};
const configuration = {
    iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
};

export default function Chat() {
    const { uid, nam } = useRoute().params as RouteParams;
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const [txt,stxt] = useState('');
    const [yar,syar] = useState('');
    const [titNam,stitNam] = useState(nam);
    const [msgs,smgs] = useState<{ msg: string; yar: string }[]>([]);
    const [edit,sedit] = useState(false);
    const [call,scall] = useState(false);
    const lstChng = useRef<number>(0);
    const flatlis = useRef<FlatList>(null);
    const title = useRef<TextInput | null>(null);
    const peer = useRef<RTCPeerConnection | null>(null);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const nav = useNavigation();

    const sendMsg = async()=>{
        if(!txt.trim())return;
        socket.emit('chat',uid,{msg:txt.trim(),yar});
        await addChat(uid,{msg:txt.trim(),yar}).catch(e=>{console.log(`chat not added error occur ${e.message} \n`,e)})
        stxt('');
    }
    const changeNam = async ()=>{
        sedit((prevEdit) => {
            if (prevEdit) {
                AsyncStorage.getItem(CONTACTS_KEY).then((t) => JSON.parse(t||'[]')).then((c) =>c.map((v: { id: string; }) => (v.id == uid ? { ...v, name: titNam } : v))).then(async (C) => await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(C)));

            } else {
                setTimeout(()=>title.current?.focus(),100)
            }
            return !prevEdit;
        });
    }
    useLayoutEffect(()=>{
        nav.setOptions({
            headerShown: false,
        });
    },[nav])
    useEffect(() => {
        AsyncStorage.getItem("uid").then(syar);
        const path = `${FileSystem.documentDirectory}${uid}.nin`;
        const interval = setInterval(async () => {
            try {
                const stats = await RNFS.stat(path);
                if (stats.mtime && new Date(stats.mtime).getTime() > lstChng.current){
                    smgs(await readChat(uid));
                    lstChng.current = new Date(stats.mtime).getTime();
                }
            } catch (e) {
                console.log('File read error:', e);
            }
        }, 1000); 

        return () => clearInterval(interval);
    }, []);
    useEffect(()=>{
        ScreenCaptureSecure.enableSecure();
        socket.on('offer', async (vid, offer) => {
            await peer.current?.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await peer.current?.createAnswer();
            await peer.current?.setLocalDescription(answer);
            socket.emit('answer',uid, answer);

        })
        socket.on('answer', async (answer) => {
            await peer.current?.setRemoteDescription(new RTCSessionDescription(answer));


        })
        socket.on('candidate', async (candidate) => {
            try{
                await peer.current?.addIceCandidate(new RTCIceCandidate(candidate))
            }catch(er){
                console.warn(er)
            }
        })
        socket.on('end-call',()=>{
            enCall()
        })
        return ()=>{
            ScreenCaptureSecure.disableSecure();
            socket.off('offer');
            socket.off('answer');
            socket.off("candidate")
            socket.off('end-call');
            peer.current?.close();
            localStream?.getTracks().forEach(track => track.stop());;
            remoteStream?.getTracks().forEach(track => track.stop());
        }
    },[]) 
    const rqCall = async(vid:boolean=false)=>{
        setLocalStream((await mediaDevices.getUserMedia({audio:true,video:vid}));
        scall(true)
    }
    const stCall= async(vid:boolean)=>{
        peer.current = new RTCPeerConnection(configuration);
        peer.current.onicecandidate = (event) => {
                if (event.candidate) {
                      socket.emit('candidate', uid, event.candidate);
                    }
              };
        localStream.getTracks().forEach(track => peer.current?.addTrack(track, localStream));
        peer.current.ontrack = (event) => {
            setRemoteStream(event.streams[0]);
        }
        scall(true)
        const offer = await peer.current?.createOffer();
        await peer.current?.setLocalDescription(offer);
        socket.emit('offer', uid, vid, offer);
    }
    const enCall = ()=>{
        if (localStream) {    
            localStream.getTracks().forEach(t=>t.stop())
            setLocalStream(null)
        }
        if (remoteStream) {    
            remoteStream.getTracks().forEach(t=>t.stop())
            setRemoteStream(null)
        }
        if(peer.current){
            peer.current.onicecandidate = null;
                peer.current.ontrack = null;
                peer.current.close();
                peer.current = null;
              }

        scall(false)
        socket.emit('end-call',uid)
    }
    return (
        <SafeAreaView style={{flex:1,paddingTop: Platform.OS === 'android' ? 25 : 0}}>
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
                <ThemedView style={style.chat} >
                    <ThemedView style={[style.eventArea,{}]} darkColor="#151718">
                        <TouchableOpacity onPress={nav.goBack} style={{flex:0.1}}>
                            <AntDesign name="arrowleft" size={28} color={borderColor} />
                        </TouchableOpacity>
                        <ThemedInput value={titNam} onChangeText={stitNam} placeholder="don't be empty..." ref={title} editable={edit} style={{fontSize:21,flex:0.8}}/>
                        <TouchableOpacity onPress={changeNam} style={{flex:0.1}}>
                            <AntDesign name={edit?"check":"edit"} size={28} color={borderColor} />
                        </TouchableOpacity>
                        <TouchableOpacity style={{flex:0.1}} onPress={()=>rqCall(true)}>
                            <AntDesign name="videocamera" size={24} color={borderColor} />
                        </TouchableOpacity>
                        <TouchableOpacity style={{flex:0.1}} onPress={rqCall}>
                            <AntDesign name="phone" size={24} color={borderColor} />
                        </TouchableOpacity>
                    </ThemedView>
                    <FlatList
                        ref={flatlis}
                        data={msgs}
                        keyExtractor={(item,index) => item?.yar+index}
                        renderItem={({item})=><ThemedView style={[style.msg,yar!=item?.yar?{alignSelf:"flex-end"}:{alignSelf:'flex-start'},{borderColor}]}>
                            <ThemedText>{item?.msg}</ThemedText>
                        </ThemedView>}
                        onContentSizeChange={() => flatlis.current?.scrollToEnd({ animated: true })}
                        onLayout={() => flatlis.current?.scrollToEnd({ animated: true })}
                    />
                    <ThemedView style={style.eventArea}>
                        <ThemedView style={[style.textArea,{borderColor}]} >
                            <ThemedInput style={style.inputfield} placeholder='Tyye...' value={txt} onChangeText={stxt} />

                            <TouchableOpacity style={style.sendbtn} onPress={sendMsg} >
                                <ThemedText>🏹</ThemedText>
                            </TouchableOpacity>
                        </ThemedView>
                    </ThemedView>
                    <Modal visible={call} onRequestClose={()=>scall(false)} transparent={true}>
                        <ThemedView style={style.chat}>
                            {localStream && (<RTCView streamURL={localStream.toURL()} objectFit='cover' mirror style={{height:200,width:"100%"}}/>)}
                            {remoteStream && (<RTCView streamURL={remoteStream.toURL()} objectFit='cover' mirror style={{height:200,width:"100%"}}/>)}
                            <TouchableOpacity onPress={enCall} >
                                <AntDesign name="closecircleo" size={28} color={borderColor} />
                            </TouchableOpacity>
                        </ThemedView>
                    </Modal>
                </ThemedView>
            </TouchableWithoutFeedback>
        </SafeAreaView>
    )
}
const style = StyleSheet.create({
    chat:{
        flex:1,
        position:'relative',
    },
    eventArea:{
        flexDirection:'row',
        position:'relative',
        padding:15,
        justifyContent:"center",
        alignItems: 'center',
    },
    textArea:{
        flex:1,
        flexDirection:'row',
        position:'relative',
        alignItems:'center',
        borderWidth:1,
        borderRadius:20,
        paddingLeft: 10,
        overflow:'hidden',
        maxHeight:80,
        minHeight: 40,
    },
    sendbtn:{
        flex:0.15,
    },
    inputfield:{
        flex:0.95,
    },
    msg:{
        flex:1,
        alignItems:'center',
        justifyContent:"center",
        maxWidth:'55%',
        padding:7,
        borderRadius:15,
        borderWidth:1,
    }
})
