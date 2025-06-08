import { FlatList, StyleSheet, TouchableOpacity,Keyboard,TouchableWithoutFeedback,SafeAreaView,Platform,Modal, Image, Dimensions} from 'react-native'
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
import {addChat,readChat,ChatMessage,splitSend,addChunk,ChunkMessage, writeFunction} from '@/constants/file';
import {P2P} from '@/constants/webrtc';
import {RTCView} from "react-native-webrtc"
import * as ScreenCapture from 'expo-screen-capture';
import * as DocumentPicker from 'expo-document-picker';
const CONTACTS_KEY = "chat_contacts";
type RouteParams = {
    uid: string;
    nam: string;
};
export default function Chat() {
    const { uid, nam } = useRoute().params as RouteParams;
    const {width } = Dimensions.get('window')
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const [txt,stxt] = useState('');
    const [yar,syar] = useState('');
    const [titNam,stitNam] = useState(nam);
    const [msgs,smgs] = useState<ChatMessage[]>([]);
    const [edit,sedit] = useState(false);
    const [call,scall] = useState<'NA'|'IN'|'ON'>('NA');
    const [fileSta,sfileSta] = useState<'NA'|'PRE'|'ON'>('NA');
    const [flip,sflip] = useState(true);
    const [file,sfile] = useState<DocumentPicker.DocumentPickerAsset[]>([])
    const [remAud,sremAud] = useState(true);
    const [locAud,slocAud] = useState(true);
    const [localStream, setLocalStream] = useState<MediaStream | null>(null);
    const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
    const lstChng = useRef<number>(0);
    const flatlis = useRef<FlatList>(null);
    const title = useRef<TextInput | null>(null);
    const peer = useRef<P2P | null>(null);
    const nav = useNavigation();

    useLayoutEffect(()=>{nav.setOptions({headerShown: false,})},[nav])
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
        
        // const adv = addChunk(path)
        ScreenCapture.preventScreenCaptureAsync();
        peer.current = new P2P({
            onICE:(candidate)=>{
                socket.emit('candidate', uid, candidate);
            },
            onDatClose:()=>{
                peer.current?.clean()
            },
            onRemStrm:(e)=>{
                setRemoteStream(e)
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
        socket.on('rqcall',async(vid)=>{
            const stream = await peer.current?.stStrm(vid);
            if (stream) setLocalStream(stream);
            scall('IN')
        })
        socket.on('endcall',()=>{
            setLocalStream(null);
            setRemoteStream(null);
            scall('NA')
            peer.current?.clean()
        })
        return ()=>{
            ScreenCapture.allowScreenCaptureAsync();
            socket.off('offer');
            socket.off('answer');
            socket.off("candidate")
            socket.off('endcall');
            socket.off('rqcall');
            peer.current?.close();
            localStream?.getTracks().forEach(track => track.stop());;
            remoteStream?.getTracks().forEach(track => track.stop());
        }
    },[]) 
    const genAdd = async function* (){
        const path = `${RNFS.ExternalStorageDirectoryPath}pandaDoc/`;
        const exists = await RNFS.exists(path);
        if (!exists) await RNFS.mkdir(path);
        const down = new Map<string ,writeFunction >();
        while (true) {
            const chunk:ChunkMessage =  yield;
            if(!down.has(chunk.n)){
                down.set(chunk.n,addChunk(path));
            }
            const isadd = await down.get(chunk.n)?.(chunk);
            if (typeof isadd === 'string') {
                down.delete(chunk.n);
                // set path in sended
            }
            else if(!isadd){
                // set in failed
            }
            if (0 === down.size) {
                break;
            }
        }
        down.clear()
    }
    const rqCall = async(vid:boolean=false)=>{
        const stream = await peer.current?.stStrm(vid);
        if (stream) setLocalStream(stream);
        scall('ON')
        socket.emit('rqcall',uid,vid);
    }
    const stCall= async()=>{
        peer.current?.initPeer()
        const offer = await peer.current?.crOff();
        socket.emit('offer', uid, offer);
    }
    const enCall = ()=>{
        peer.current?.clean()
        scall('NA')
        socket.emit('endcall',uid)
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
            const newStrm = await peer.current.stStrm({ facingMode: flip?"environment":"user" });
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
        const msg = {msg:txt.trim(),yar,time:Date.now()} as ChatMessage
        socket.emit('chat',uid,msg);
        await addChat(uid,msg)
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
    const pikFls = async () => {
        try {
            const result = await DocumentPicker.getDocumentAsync({
                type: '*/*', 
                multiple: true,
                copyToCacheDirectory: true,
            });
            if (!result.canceled && result.assets) {
                sfile(result.assets)
                sfileSta('PRE')
            } else {
                console.log('Picker cancelled or failed.');
            }
        } catch (error) {
            console.error('Error picking files:', error);
        }
    };
    const shoFls = ({item}:{item:DocumentPicker.DocumentPickerAsset}) =>{
        switch (item.mimeType?.split('/')[0]) {
            case 'image':
                return(<ThemedView style={[style.file,{width}]}><Image source={{uri:item.uri}} resizeMode='contain' style={{height:'100%',width:'100%'}} /></ThemedView>)
            default:
                return(<ThemedView style={[style.file,{width}]}><ThemedText>{item.name}</ThemedText></ThemedView>)
        }
    }
    const sendFls = async () => {
        if (!file.length) return;
        await peer.current?.initPeer(true);
        const dc = peer.current?.getDatChannel();
        if (!dc || !dc.send) return;
        for (const f of file) {
            if (!f.size) {
                console.warn(`Skipping ${f.name}: missing file size.`);
                continue;
            }
            await splitSend({ name: f.name, uri: f.uri, size: f.size }, dc.send.bind(dc));
        }
    };
    const preSndFls = async()=>{
        // TODO
        await sendFls()
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
                        <TouchableOpacity onPress={changeNam} style={{flex:0.1,marginHorizontal:3}}>
                            <AntDesign name={edit?"check":"edit"} size={28} color={borderColor} />
                        </TouchableOpacity>
                        <TouchableOpacity style={{flex:0.1,marginHorizontal:3}} onPress={()=>rqCall(true)}>
                            <AntDesign name="videocamera" size={24} color={borderColor} />
                        </TouchableOpacity>
                        <TouchableOpacity style={{flex:0.1,marginHorizontal:3}} onPress={()=>rqCall(false)}>
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
                            <TouchableOpacity style={style.sendbtn} onPress={pikFls} >
                                    <MaterialIcons name="attach-file" size={24} color={borderColor}/>
                            </TouchableOpacity>
                            <TouchableOpacity style={style.sendbtn} onPress={sendMsg} >
                                    <MaterialIcons name="send" size={24} color={borderColor}/>
                            </TouchableOpacity>
                        </ThemedView>
                    </ThemedView>
                    <Modal visible={fileSta === 'PRE'} onRequestClose={()=>{sfile([]);sfileSta('NA');}} transparent>
                        <FlatList data={file} keyExtractor={i=>i.uri} style={style.chat} renderItem={shoFls} horizontal showsHorizontalScrollIndicator={false} pagingEnabled/>
                        <ThemedView style={{flex:0.1,alignItems:'center',justifyContent:'space-around',flexDirection:'row'}}>
                            <TouchableOpacity onPress={()=>sfile([])}>
                                <MaterialIcons name='cancel' size={30} color={borderColor}/>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={preSndFls}>
                                <MaterialIcons name='send' size={30} color={borderColor}/>
                            </TouchableOpacity>
                        </ThemedView>
                    </Modal>
                    <Modal visible={call != 'NA'} onRequestClose={()=>scall('NA')} transparent>
                        <ThemedView style={style.chat}>
                            <ThemedView style={[{height:'45%',width:"100%"},style.chat]}>
                                {localStream && (<RTCView streamURL={localStream.toURL()} objectFit='cover' mirror={flip} style={{height:'100%',width:"100%"}}/>)}
                                <TouchableOpacity onPress={() => audioOut(localStream, slocAud)} style={{position:"absolute",bottom:5,right:5}} >
                                    <MaterialIcons name={locAud?"mic":"mic-off"} size={35} color={borderColor}/>
                                </TouchableOpacity>
                            </ThemedView>
                            {remoteStream && (<RTCView streamURL={remoteStream.toURL()} objectFit='cover'  style={{height:'45%',width:"100%"}}/>)}
                            <ThemedView style={style.calBtn}>
                                <TouchableOpacity onPress={() => audioOut(remoteStream, sremAud)} >
                                    <MaterialIcons name={remAud?"volume-up":"volume-off"} size={35} color={borderColor}/>
                                </TouchableOpacity>
                                <TouchableOpacity onPress={call=='IN'?stCall:enCall} >
                                    <MaterialIcons name={call=='IN'?"call":"call-end"} size={35} color={borderColor}/>
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
    },
    file:{
        flex:1,
        justifyContent:'center',
        alignItems:'center',
        height:'100%'
    }
})
