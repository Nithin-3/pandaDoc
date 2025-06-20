import { FlatList, StyleSheet, TouchableOpacity,Keyboard,TouchableWithoutFeedback,SafeAreaView,Platform,Modal, Image, Dimensions,} from 'react-native'
import { useEffect,useState,useRef,useLayoutEffect, useCallback,} from "react";
import RNFS from 'react-native-fs';
import { ThemedText } from '@/components/ThemedText';
import { ThemedInput } from '@/components/ThemedInput';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import socket from '@/constants/Socket';
import {useRoute} from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage";
import AntDesign from '@expo/vector-icons/AntDesign';
import {MaterialIcons} from '@expo/vector-icons/';
import {useNavigation} from 'expo-router'
import { TextInput } from 'react-native-gesture-handler';
import {addChat,readChat,ChatMessage,splitSend} from '@/constants/file';
import axios from 'axios';
import * as ScreenCapture from 'expo-screen-capture';
import * as DocumentPicker from 'expo-document-picker';
import { peer,P2P } from '@/constants/webrtc';
import {Vid} from '@/components/Vid';
import {Aud} from '@/components/Aud';
import Alert, { AlertProps } from '@/components/Alert';
import { useFileProgress } from '@/components/Prog';
import { ChatBuble } from '@/components/ChatBuble';
const CONTACTS_KEY = "chat_contacts";
type RouteParams = {
    uid: string;
    nam: string;
};
export default function Chating() {
    const { uid, nam ,} = useRoute().params as RouteParams;
    const {width } = Dimensions.get('window')
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const {fileMap} = useFileProgress()
    const [txt,stxt] = useState('');
    const [yar,syar] = useState('');
    const [titNam,stitNam] = useState(nam);
    const [msgs,smgs] = useState<ChatMessage[]>([]);
    const [edit,sedit] = useState(false);
    const [fileSta,sfileSta] = useState<'NA'|'PRE'|'ON'>('NA');
    const [file,sfile] = useState<DocumentPicker.DocumentPickerAsset[]>([])
    const [prog,sprog] = useState(0);
    const [alrt,salrt] = useState<AlertProps>({vis:false,setVis:()=>{salrt(p=>({...p, vis:false,title:'',discription:'',button:[]}))},title:'',discription:'',button:[]});
    const flatlis = useRef<FlatList>(null);
    const title = useRef<TextInput | null>(null);
    const nav = useNavigation();

    useLayoutEffect(()=>{nav.setOptions({headerShown: false,})},[nav])
    useEffect(() => {
        AsyncStorage.getItem("uid").then(e=>e ?? '').then(syar);
        ScreenCapture.preventScreenCaptureAsync();
        smgs(readChat(uid))
        socket.on('msg',(msg)=>{
            try{
                msg.yar == uid &&
                setTimeout(async()=>smgs(readChat(uid)),100);
            }catch(e:any){
                salrt(p=>({...p,vis:true,title:'file read error',discription:`${e.message}`,button:[{txt:"ok"}]}))
            }
        })
        return () =>{ 
            ScreenCapture.allowScreenCaptureAsync();
            socket.off('msg');
        }
    }, []);
    const rqCall = async(vid:boolean=false)=>{
        const on = await axios.get(`https://pandadoc.onrender.com/${uid}`)
        if(on.data){
            socket.emit('rqcall',uid, yar,vid);
            await peer!.stStrm(vid,uid);
            nav.navigate('call', { uid, nam, cal: 'ON' });
        }else{
            salrt(p=>({...p,title:`${nam} is offline`,vis:true,button:[{txt:'call later'}]}))
        }
    }

    const sendMsg = async()=>{
        if(!txt.trim())return;
        const msg = {msg:txt.trim(),yar,time:Date.now()} as ChatMessage
        flatlis.current?.scrollToEnd({animated:true});
        socket.emit('chat',uid,msg);
        addChat(uid,msg)
        smgs(readChat(uid))
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
            } 
        } catch (error:any) {
            salrt(p=>({...p,vis:true,title:'Error picking files',discription:`${error.message}`,button:[{txt:"ok"}]}))
        }
    };
    const shoFls = ({item}:{item:DocumentPicker.DocumentPickerAsset}) =>{
        switch (item.mimeType?.split('/')[0]) {
            case 'image':
                return(<ThemedView style={[style.file,{width}]}><Image source={{uri:item.uri}} resizeMode='contain' style={{height:'100%',width:'100%'}} /></ThemedView>)
            case 'video':
                return(<ThemedView style={[style.file,{width}]}><Vid uri={item.uri}/></ThemedView>)
            case 'audio':
                return(<ThemedView style={[style.file,{width}]}><Aud uri={item.uri}/></ThemedView>)
            default:
                return(<ThemedView style={[style.file,{width}]}><ThemedText>{item.name}</ThemedText></ThemedView>)
        }
    }
    const cpUri = async(uri:string,filename:string)=>{
        let path = `${RNFS.ExternalStorageDirectoryPath}/.pandaDoc/`;
        const exists = await RNFS.exists(path);
        if (!exists) await RNFS.mkdir(path);
        path = `${path}${filename}`
        await RNFS.copyFile(uri,path);
        addChat(uid,{uri:`file://${path}`,yar,time:Date.now()});
        smgs(readChat(uid))
    }
    const sendFls = async () => {
        if (!file.length) return;
        const dc = await peer!.initData(uid);
        if(!dc && dc.send){
            console.log('no method');
            return;
        }
        for(const f of file){
            const res = await splitSend({name:`${f.name}`,uri:f.uri},dc.send.bind(dc));
            if (res) {
                await cpUri(f.uri,f.name);
            }else{
                salrt(p=>({...p,vis:true,title:'file internal read error',discription:`skiped :${f.name}`,button:[{txt:'retry'}]}))
            }
        }
        peer!.close(uid);
        socket.emit('chat',uid,{yar,time:undefined});
    };
    const preSndFls = ()=>{
        axios.get(`https://pandadoc.onrender.com/${uid}`).then(async d=>{
            if (d.data) {
                await peer!.initPeer(uid,true);
                try{
                    const off = await peer!.crOff(uid)
                    socket.emit('offer',uid, yar,off);
                }catch(e:any){
                    if(e.message!='Peer already connected')salrt(p=>({...p,vis:true,title:'unknown peer',discription:e.message,button:[{txt:'ok'}]}));
                }
                P2P.waitForConnection(peer!.getPeer(uid)!).then(sendFls).catch(e=>salrt(p=>({...p,vis:true,title:'unknown peer',discription:e.message,button:[{txt:'ok'}]})))
            }else{
                salrt(p=>({...p,
                    vis:true,
                    title:`user ${nam} is offline`,
                    discription:`you can send file(s) to server ${nam} resive when online`,
                    button:[
                        {
                            txt:'send',
                            onPress:()=>{
                                const data = new FormData();
                                data.append('uid',uid);
                                data.append('yar',yar);
                                file.forEach((fil,i)=>{
                                    i<10&&data.append('files',{uri:fil.uri,name:fil.name,type:fil.mimeType || 'application/octet-stream'})
                                })
                                axios.post(`https://pandadoc.onrender.com/`,data,{headers:{'Content-Type': 'multipart/form-data',auth:yar},onUploadProgress:(prog)=>{
                                    sprog(Math.round(prog.loaded/(prog.total || 1) * 100))
                                }}).then(async v=>{
                                        await Promise.all([sfile(p=>{
                                            p.splice(0,v.data).map(f=>cpUri(f.uri,f.name));
                                            return p;
                                        })]);
                                    }).finally(()=>{
                                        if(file.length>0){
                                            preSndFls()
                                        }
                                        sprog(0);
                                    }).catch(e=>{
                                        salrt(p=>({...p,vis:true,title:'Sorry...',discription:`${e.response?.status || e.message} occer`,button:[{txt:'ok'}]}))
                                    })
                            }
                        },{
                            txt:'cancel'
                        }
                    ]
                }))
            }
        }).finally(()=>{
                sfileSta('ON')
            })
    }
    const rendMsg = useCallback(({item}:{item:ChatMessage})=>(
        <ChatBuble item={item} yar={yar} path={RNFS.ExternalStorageDirectoryPath} />
    ),[yar])
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
                        renderItem={rendMsg}
                        initialNumToRender={20}
                        maxToRenderPerBatch={10}
                        windowSize={5}
                        removeClippedSubviews
                        onLayout={() => flatlis.current?.scrollToEnd({ animated: true })}
                    />
                    {fileMap[uid]?.prog &&(<>
                        <ThemedText type='mini'>{fileMap[uid]?.name}</ThemedText>
                        <ThemedView style={{height:4}}>
                            <ThemedView style={{width:`${Number(fileMap[uid]?.prog??'0')}%`,height:'100%',backgroundColor:borderColor}}/>
                        </ThemedView></>)}
                    {prog > 0 &&
                        <ThemedView style={{height:4}}>
                            <ThemedView style={{width:`${prog}%`,height:'100%',backgroundColor:borderColor}}/>
                        </ThemedView>
                    }
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
                            <TouchableOpacity onPress={()=>{sfile([]);sfileSta('NA')}}>
                                <MaterialIcons name='cancel' size={30} color={borderColor}/>
                            </TouchableOpacity>
                            <TouchableOpacity onPress={preSndFls}>
                                <MaterialIcons name='send' size={30} color={borderColor}/>
                            </TouchableOpacity>
                        </ThemedView>
                    </Modal>
                    <Alert {...alrt}/>
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
