import '@/lang/i18n';
import { FlatList, StyleSheet, TouchableOpacity,Keyboard,TouchableWithoutFeedback,Modal, Image, Dimensions,} from 'react-native'
import { useEffect,useState,useRef, useCallback, } from "react";
import RNFS from 'react-native-fs';
import { ThemedText } from '@/components/ThemedText';
import { ThemedInput } from '@/components/ThemedInput';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import socket from '@/constants/Socket';
import {useRoute,useNavigation} from "@react-navigation/native"
import AntDesign from '@expo/vector-icons/AntDesign';
import {MaterialIcons} from '@expo/vector-icons/';
import { TextInput } from 'react-native-gesture-handler';
import {addChat,readChat,ChatMessage,splitSend, settingC, appPath, blocks, stor} from '@/constants/file';
import axios from 'axios';
import * as ScreenCapture from 'expo-screen-capture';
import * as DocumentPicker from 'expo-document-picker';
import {useTranslation} from 'react-i18next';
import { peer,P2P } from '@/constants/webrtc';
import {Vid} from '@/components/Vid';
import {Aud} from '@/components/Aud';
import Alert, { AlertProps } from '@/components/Alert';
import { useFileProgress } from '@/components/Prog';
import { ChatBuble } from '@/components/ChatBuble';
import { ContactDB, ChatDB, Chat as ct } from '@/constants/db';
import { callProp, Routes } from './navType';
const {useRealm} = ChatDB;
export default function Chat() {
    const {t} = useTranslation();
    const realm = useRealm()
    const { uid, nam, block,blockby} = useRoute().params as Routes['chat'];
    const {width } = Dimensions.get('window')
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const {fileMap} = useFileProgress()
    const whoami = settingC.getString('uid') ?? '';
    const [convo,sconvo] = useState(blockby);
    const [txt,stxt] = useState('');
    const [titNam,stitNam] = useState(nam);
    const [msgs,smgs] = useState<ChatMessage[]>([]);
    const [edit,sedit] = useState(false);
    const [fileSta,sfileSta] = useState<'NA'|'PRE'|'ON'>('NA');
    const [file,sfile] = useState<DocumentPicker.DocumentPickerAsset[]>([])
    const [prog,sprog] = useState(0);
    const [alrt,salrt] = useState<AlertProps>({vis:false,setVis:()=>{salrt(p=>({...p, vis:false,title:'',discription:'',button:[]}))},title:'',discription:'',button:[]});
    const flatlis = useRef<FlatList>(null);
    const title = useRef<TextInput | null>(null);
    const nav = useNavigation<callProp>();
    useEffect(() => {
        ScreenCapture.preventScreenCaptureAsync();
        smgs(readChat(uid))
        socket.on('block',async who=>{
            const cont = await ContactDB.get(who);
            salrt(p=>({...p,vis:true,title:t('you-block'),discription:t('you-block-from',{name:cont?.name ?? who}),button:[{txt:t('ok')}]}));
        })
        if(settingC.getNumber(uid)){
            settingC.set(uid,1);
        }
        ContactDB.edit(uid,{new:null})
        const lis = blocks.addOnValueChangedListener(k=>k==='by'&& sconvo(blocks.getString('by')?.includes(uid) ?? false))
        const chtLis = stor.addOnValueChangedListener(()=>smgs(readChat(uid)))

        return () =>{ 
            lis.remove();
            chtLis.remove();
            ScreenCapture.allowScreenCaptureAsync();
        }
    }, []);
    useEffect(()=>{
        if(msgs.length % 50 == 0 && msgs[50 * msgs.length / 50 - 50].time! > (settingC.getNumber(uid)??0)){
            for(const msg of msgs){
                realm.write(()=> new ct(realm, uid, msg.who, msg.time!, msg.msg, msg.uri))
            }
            settingC.set(uid,msgs[-1].time!)
        }
    },[msgs])
    const rqCall = async(vid:boolean=false)=>{
        const on = await axios.get(`https://pandadoc.onrender.com/${uid}`)
        if(on.data){
            socket.emit('rqcall',uid, whoami,vid);
            await peer!.stStrm(vid,uid);
            nav.navigate('call', { uid, nam, cal: 'ON' });
        }else{
            salrt(p=>({...p,title:`${nam}${t('is-of')}`,vis:true,button:[{txt:t('call-late')}]}))
        }
    }

    const sendMsg = async()=>{
        if(!txt.trim())return;
        const msg = {msg:txt.trim(),who:whoami,time:Date.now()};
        flatlis.current?.scrollToEnd({animated:true});
        socket.emit('chat',uid,msg);
        addChat(uid,{...msg,uid})
        stxt('');
    }
    const changeNam = async ()=>{
        sedit((prevEdit) => {
            if (prevEdit) {
                if(titNam.trim()){
                    ContactDB.edit(uid,{name:titNam.trim()})
                }else{
                    return prevEdit;
                }
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
            salrt(p=>({...p,vis:true,title:t('er-pic'),discription:`${error.message}`,button:[{txt:t('ok')}]}))
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
        const path = `${await appPath()}${filename}`
        await RNFS.copyFile(uri,path);
        addChat(uid,{uri:`file://${path}`,who:whoami,time:Date.now(), uid});
        smgs(readChat(uid))
    }
    const sendFls = async () => {
        if (!file.length) return;
        const dc = await peer!.initData(uid);
        for(const f of file){
            const res = await splitSend({name:`${f.name}`,uri:f.uri},dc.send.bind(dc));
            if (res) {
                await cpUri(f.uri,f.name);
            }else{
                t('er-read')==alrt.title?salrt(p=>({...p,vis:true,discription:`\n${f.name}`})):
                    salrt(p=>({...p,vis:true,title:t('er-read'),discription:`${t('skip')} :${f.name}`,button:[{txt:t('retry')}]}))
            }
        }
        peer!.close(uid);
        socket.emit('chat',uid,{who:whoami,time:undefined});
    };
    const preSndFls = ()=>{
        axios.get(`https://pandadoc.onrender.com/${uid}`).then(async d=>{
            if (d.data) {
                await peer!.initPeer(uid,true);
                try{
                    const off = await peer!.crOff(uid)
                    socket.emit('offer',uid, whoami,off);
                }catch(e:any){
                    if(e.message!='Peer already connected')salrt(p=>({...p,vis:true,title:t('un-peer'),discription:e.message,button:[{txt:t('ok')}]}));
                }
                P2P.waitForConnection(peer!.getPeer(uid)!).then(sendFls).catch(e=>salrt(p=>({...p,vis:true,title:t('un-peer'),discription:e.message,button:[{txt:t('ok')}]})))
            }else{
                salrt(p=>({...p,
                    vis:true,
                    title:`${nam}${t('is-of')}`,
                    discription:t('s2ser',{name:nam}),
                    button:[
                        {
                            txt:t('send'),
                            onPress:()=>{
                                const data = new FormData();
                                data.append('uid',uid);
                                data.append('yar',whoami);
                                file.forEach((fil,i)=>{
                                    i<10&&data.append('files',{uri:fil.uri,name:fil.name,type:fil.mimeType || 'application/octet-stream'})
                                })
                                axios.post(`https://pandadoc.onrender.com/`,data,{headers:{'Content-Type': 'multipart/form-data',auth:whoami},onUploadProgress:(prog)=>{sprog(Math.round(prog.loaded/(prog.total || 1) * 100))}}).then(async v=>{
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
                                        salrt(p=>({...p,vis:true,title:'Sorry...',discription:`${e.response?.status || e.message} occer`,button:[{txt:t('ok')}]}))
                                    })
                            }
                        },{
                            txt:t('cancel')
                        }
                    ]
                }))
            }
        }).finally(()=>{
                sfileSta('ON')
            })
    }
    const rendMsg = ({item}:{item:ChatMessage})=><ChatBuble item={item} yar={whoami} path={`file://${RNFS.DownloadDirectoryPath}`} />;
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ThemedView style={style.chat} >
                <ThemedView style={[style.eventArea,{}]} darkColor="#151718">
                    <TouchableOpacity onPress={nav.goBack} style={{flex:0.1}}>
                        <AntDesign name="arrowleft" size={28} color={borderColor} />
                    </TouchableOpacity>
                    <ThemedInput value={titNam} onChangeText={stitNam} placeholder={t('no-empty')} ref={title} editable={edit} style={{fontSize:25,fontWeight:'bold',flex:0.8}}/>
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
                    keyExtractor={(item,index) => `${item.time}-${index}`}
                    renderItem={rendMsg}
                    initialNumToRender={10}
                    maxToRenderPerBatch={20}
                    windowSize={10}
                    removeClippedSubviews={true}
                    onEndReachedThreshold={0.2}
                    onEndReached={()=>{}}
                    onScrollToTop={ useCallback(async ()=>{
                        console.log('top')
                        const pst = realm.objects(ct).filtered(`time < $0 AND uid == $1`,msgs[0].time, uid).sorted('time').slice(0,50).map(({msg, uri, who, time, uid})=>({uid, msg, uri, who, time}))
                        if(pst.length){
                            smgs(p=>([...pst,...p]))
                        }
                    },[msgs])}
                    onLayout={() => setTimeout(()=>flatlis.current?.scrollToEnd({ animated: false }),100)}
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
                        {convo||block?
                            <ThemedText>{t('no-conv')}</ThemedText>
                            :<>
                                <ThemedInput style={style.inputfield} placeholder='Tyye...' value={txt} onChangeText={stxt} />
                                <TouchableOpacity style={style.sendbtn} onPress={pikFls} >
                                    <MaterialIcons name="attach-file" size={24} color={borderColor}/>
                                </TouchableOpacity>
                                <TouchableOpacity style={style.sendbtn} onPress={sendMsg} >
                                    <MaterialIcons name="send" size={24} color={borderColor}/>
                                </TouchableOpacity>
                            </>}
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
    )
}
const style = StyleSheet.create({
    chat:{ flex:1, position:'relative', },
    eventArea:{ flexDirection:'row', position:'relative', padding:15, justifyContent:"center", alignItems: 'center', },
    textArea:{ flex:1, flexDirection:'row', position:'relative', alignItems:'center', borderWidth:1, borderRadius:20, paddingLeft: 10, overflow:'hidden', maxHeight:80, minHeight: 40, },
    sendbtn:{ flex:0.15, },
    inputfield:{ flex:0.95, },
    calBtn:{ height:'10%', width:'100%', position:'absolute', bottom:0, flexDirection:'row', alignItems:'center', justifyContent:'space-around', borderWidth:1, borderColor:"#fff" },
    file:{ flex:1, justifyContent:'center', alignItems:'center', height:'100%' }
})
