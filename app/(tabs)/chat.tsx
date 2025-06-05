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
import {MaterialIcons} from '@expo/vector-icons/';
import {useNavigation} from 'expo-router'
import { TextInput } from 'react-native-gesture-handler';
import {addChat,readChat,} from '@/constants/file';
import {P2P} from '@/constants/webrtc';
import * as ScreenCapture from 'expo-screen-capture';
const CONTACTS_KEY = "chat_contacts";
type RouteParams = {
    uid: string;
    nam: string;
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
    const [flip,sflip] = useState(false);
    const [remAud,sremAud] = useState(true);
    const [locAud,slocAud] = useState(true);
    const [downCall,sdownCall] = useState(false);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const lstChng = useRef<number>(0);
    const flatlis = useRef<FlatList>(null);
    const title = useRef<TextInput | null>(null);
    const peer = useRef<P2P | null>(null);
    const nav = useNavigation();

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
        ScreenCapture.preventScreenCaptureAsync();
        peer.current = new P2P({
            onRemStrm:setRemoteStream,
            onICE:(candidate)=>{
                socket.emit('candidate', uid, candidate);
            },
            onDatClose:()=>{
                peer.current?.clean()
            }

        })
        socket.on('offer', async (offer) => {
            peer.current?.setRemDisc(offer)
            const answer = await peer.current?.crAns();
            socket.emit('answer',uid, answer);

        })
        socket.on('answer', async (answer) => {
            await peer.current?.setRemDisc(answer);


        })
        socket.on('candidate', async (candidate) => {
            try{
                await peer.current?.addICE(candidate);
            }catch(er){
                console.warn(er)
            }
        })
        socket.on('rq-call',async(vid)=>{
            setLocalStream((await mediaDevices.getUserMedia({audio:true,video:vid})));
            sdownCall(true)
            scall(true)
        })
        socket.on('end-call',()=>{
            setLocalStream(null);
            setRemoteStream(null);
            peer.current.clean()
        })
        return ()=>{
            ScreenCapture.allowScreenCaptureAsync();
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
        setLocalStream((await peer.current?.stStrm(vid)));
        scall(true)
        socket.emit('rq-call',uid,vid)
    }
    const stCall= async()=>{
        peer.current?.initPeer()
        const offer = await peer.current?.crOff();
        socket.emit('offer', uid, offer);
    }
    const enCall = ()=>{
        peer.current?.clean()
        scall(false)
        socket.emit('end-call',uid)
    }
    const flipCamera = async () => {
        if (!peer.current) return;
        const crnt = peer.current.getLocStrm();
        if (!crnt) return;
        const crntTrk = crnt.getVideoTracks()[0];
        if (crntTrk && typeof crntTrk._switchCamera === 'function'){
            crntTrk._switchCamera();
        }
        else{

            console.log('flipCamera: switching by restarting stream');
            crnt.getTracks().forEach(track => track.stop());
            const newStrm = await peer.current.stStrm({ facingMode: flip?"user":"environment" });
            const nuuTrk = newStrm.getVideoTracks()[0]
            nuuTrk && await peer.current.replaceVid(nuuTrk)
        }
        setLocalStream((await peer.current?.getLocStrm()))
        sflip(p=>!p)
    };
    
    const audioOut = (stream: MediaStream|null,set: Function) => {
        stream?.getAudioTracks().forEach(track => {
            set(!track.enabled)
            track.enabled = !track.enabled;
        });
    };

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
                        <TouchableOpacity style={{flex:0.1}} onPress={()=>rqCall(false)}>
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
                                    <MaterialIcons name="send" size={24} color={borderColor}/>
                            </TouchableOpacity>
                        </ThemedView>
                    </ThemedView>
                    <Modal visible={call} onRequestClose={()=>scall(false)} transparent={true}>
                        <ThemedView style={style.chat}>
                            {localStream && (<RTCView streamURL={localStream.toURL()} objectFit='cover' mirror style={{height:'45%',width:"100%"}}/>)}
                            {remoteStream && (<RTCView streamURL={remoteStream.toURL()} objectFit='cover' mirror style={{height:'45%',width:"100%"}}/>)}
                            <ThemedView style={style.calBtn}>
                                <TouchableOpacity onPress={() => audioOut(remoteStream, sremAud)} >
                                    <MaterialIcons name={remAud?"volume-up":"volume-off"} size={35} color={borderColor}/>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={downCall?stCall:enCall} >
                                    <MaterialIcons name={downCall?"call":"call-end"} size={35} color={borderColor}/>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={flipCamera} >
                                    <MaterialIcons name="flip-camera-android" size={35} color={borderColor}/>
                                </TouchableOpacity>
                            </ThemedView>
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
    },
    calBtn:{
        height:'10%',
        width:'100%',
        position:'absolute',
        bottom:0,
        flexDirection:'row',
        alignItems:'center',
        justifyContent:'space-around',
        borderWidth:1,
        borderColor:"#fff"
    }
})
