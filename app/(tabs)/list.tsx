import '@/lang/i18n';
import React, { useState, useEffect, useLayoutEffect, useRef,} from "react";
import {useFileProgress} from '@/components/Prog';
import { FlatList, TouchableOpacity, StyleSheet, Modal, TouchableWithoutFeedback,Keyboard} from "react-native";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemedInput } from "@/components/ThemedInput";
import { useThemeColor } from '@/hooks/useThemeColor';
import {Ionicons} from "@expo/vector-icons";
import * as clipbord from "expo-clipboard";
import {useNavigation} from '@react-navigation/native';
import socket from '@/constants/Socket';
import {addChunk,writeFunction,blocks, settingC, appPath} from '@/constants/file';
import {P2P} from '@/constants/webrtc';
import RNFS from 'react-native-fs';
import * as ScreenCapture from 'expo-screen-capture';
import Alert, { AlertProps } from "@/components/Alert";
import Cont from "@/components/Cont"
import axios from "axios";
import {useTranslation} from 'react-i18next';
import {cat, ChatMessage, Contact, echo, rm, touch, watch} from '@/DB/index';
import { chatProp } from '@/constants/navType';
const List = () => {
    const {t} = useTranslation();
    const {fileMap,setFileStatus} = useFileProgress();
    const [contacts, setContacts] = useState<Contact[]>([]);
    const [blockC,sblockC] = useState<string[]>(JSON.parse(blocks.getString('which')??'[]'));
    const [blockBy,sblockBy] = useState<string[]>(JSON.parse(blocks.getString('by')??'[]'));
    const [name, sname] = useState("");
    const [uid, suid] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const whoami = settingC.getString('uid') ?? '';
    const [alrt,salrt] = useState<AlertProps>({vis:false,setVis:()=>{salrt(p=>({...p, vis:false,title:'',discription:'',button:[]}))},title:'',discription:'',button:[]});
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const peer = useRef<P2P|null>(null);
    const dow = useRef(new Map<string,writeFunction>()).current;
    const nav = useNavigation<chatProp>();
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    useLayoutEffect(()=>{
        return nav.addListener('focus', () => {
            loadContacts();
            ScreenCapture.preventScreenCaptureAsync();
        })
    },[nav])
    useEffect(() => {
        blocks.set('which',JSON.stringify(blockC))
    }, [blockC])
    useEffect(() => {
        socket.emit('set',whoami)
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {setIsKeyboardVisible(true);});
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {setIsKeyboardVisible(false);});
        peer.current = new P2P({
            onDatOpen:async (peerId)=>{
                dow.set(peerId,(addChunk(await appPath())));
            },
            onData:(data,peerId)=>{
                dow.get(peerId)?.(data).then(async res=>{
                    if(typeof res == 'string'){
                        const  is =  await cat('chat',0,peerId,false);
                        touch('chat',{uri:`file://${res}`,who:peerId,time:Date.now(),uid:peerId})
                        if(!is.length){
                            touch('contact',{name:t('unknown'),uid:peerId,at:Date.now()})
                        }else{
                            const [cont] = await cat('contact',peerId)
                            echo('contact',peerId,{new: cont.new?cont.new+1:0 });
                        }
                        dow.delete(peerId);
                        setFileStatus(peerId,{prog:'',name:''});
                    }else{
                        setFileStatus(peerId,{prog:res?.toFixed(1)})
                    }
                })
            },
            onDatClose:(peerId)=>{
                peer.current?.close(peerId)
            },
            onICE:(candidate,uid)=>{
                socket.emit('ice', uid,whoami, candidate);
            }

        })

        socket.on('offer',async (peerId:string,off)=>{
            if(blockC.includes(peerId)){
                console.log('blocked');
                socket.emit('block',peerId,whoami);
                return;
            }
            peer.current?.setRemDisc(peerId,off);
            const ans = await peer.current?.crAns(peerId);
            socket.emit('answer',peerId,whoami,ans);
        })
        socket.on('answer',async(peerId:string,ans)=>{
            peer.current?.setRemDisc(peerId,ans);
        })
        socket.on('ice',async(peerId:string,candidate)=>{
            peer.current?.addICE(peerId,candidate)
        })
        socket.on('rqcall',async(peerId:string,vid:boolean)=>{
            await peer.current?.stStrm(vid,peerId);
            nav.navigate('call',{uid:peerId,cal:'IN',nam:'dgerbeb'})
        })
        socket.on('wait',(tree:string[])=>{
                const blockSet = new Set<string>();
            Promise.all(tree.map(async url=>{
                try{
                    const sender = url.split('/')[0]
                    if(blockC.includes(sender) && !blockSet.has(sender)){
                        blockSet.add(sender);
                        console.log('block');
                        socket.emit('block',sender,whoami);
                        return;
                    }
                    const yar = url.split('/')
                    const path = `${await appPath()}/${yar[1]}`
                    const dow = RNFS.downloadFile({fromUrl:`https://pandadoc.onrender.com/dow/${whoami}/${url}`,toFile:path,discretionary:true,cacheable:true,begin:()=>{
                        setFileStatus(yar[0],{name:yar[1].split('°').pop()??'Downloading'})
                    },progress:rs=>{
                            setFileStatus(yar[0],{prog:(rs.bytesWritten/rs.contentLength * 100).toFixed(2)})
                        },progressDivider:5})
                    const res = await dow.promise;
                    if(res.statusCode === 200){
                        const  is =  await cat('chat',0,yar[0],false);
                        touch('chat',{uri:`file://${path}`,who:yar[0],time:Date.now(),uid:yar[0]})
                        if(!is.length){
                            await touch('contact',{uid:yar[0],name:t('unknown'),at:Date.now()})
                        }else{
                            const [cont] = await cat('contact',yar[0])
                            echo('contact',yar[0],{new: cont.new?cont.new+1:0 });
                        }
                        await axios.delete(`https://pandadoc.onrender.com/dow/${whoami}/${url}`)
                        setFileStatus(yar[0],{name:'',prog:''})
                    }else{
                        if(t('fls!down')== alrt.title){
                            salrt(p=>({...p,discription:`${p.discription??''}\n${yar[1]}`,vis:true}));
                        }else{
                            salrt(p=>({...p,title:t('fls!down'),discription:yar[1],vis:true,button:[{txt:t('ok')}]}));
                        }
                        throw new Error('hggk');
                    }
                    }catch(e:any){
                    e.message === 'hggk' || salrt(p=>({...p,title:t('er-net'),vis:true,button:[{txt:t('ok')}]}));
                }
            }))
        })
        socket.on('msg', async (msg:ChatMessage) => {
            if(!msg.time)return;
            if(blockC.includes(msg.who)){
                console.log('block');
                socket.emit('block',msg.who,whoami);
            }else{
                touch('chat',{...msg,uid:msg.who})
                const contact = await cat('contact',msg.who)
                contact.length ? echo('contact',msg.who,{new:contact[0].new?contact[0].new+1:0}) : touch('contact',{uid:msg.who,name:t('unknown'),at:Date.now()})
            }
        });
        socket.on('block', who => {
            const current = JSON.parse(blocks.getString('by') ?? '[]');
            if (!current.includes(who)) {
                current.push(who);
                blocks.set('by', JSON.stringify(current));
            }
        });
        socket.on('unblock', who => {
            const current = JSON.parse(blocks.getString('by') ?? '[]')as string[];
            blocks.set('by', JSON.stringify(current.filter(c => c !== who)));
        });
        blocks.addOnValueChangedListener(k=> k==='by' && sblockBy(JSON.parse(blocks.getString('by')??'[]')))
        watch('contact',setContacts)
        return ()=>{
            showSubscription.remove();
            hideSubscription.remove();
            ScreenCapture.allowScreenCaptureAsync();
        }
    }, []);

    const vis = () => setModalVisible(p=>!p)
    const loadContacts = async () => {
        try {
            
            setContacts(await cat('contact'));
            sblockC(JSON.parse(blocks.getString('which')??'[]'));
        } catch (error:any) {
            salrt(p=>({...p,vis:true,title:t('er-load-contact'),discription:`${error.message}`,button:[
                {txt:t('ok')}
            ]}))
        }
    };
    const addContact = async () => {
        if (!name.trim() || !uid.trim()) return;
        const contact = await cat('contact',uid)
        if(contact.length){
            salrt(p=>({...p,vis:true,title:t('uid-exist',{name:contact[0].name}),discription:t('re-write-contact'),button:[
                {
                    txt:t('ok'),
                    onPress:() => echo('contact',uid,{name:name.trim()})
                },{
                    txt:t('cancel')
                }
            ]}))
            sname('');suid('');setModalVisible(false);
            return;
        }
        touch('contact',{uid,name:name.trim(),at:Date.now()})
        sname('');suid('');setModalVisible(false);
    };
    const deleteContact = (contactId:string) => {
        rm('contact',contactId);
        rm('chat',contactId);
    };
    const blockContact = (contactId:string)=>{
        sblockC(p=>{
            if(p.includes(contactId)){
                socket.emit('unblock',contactId,whoami);
                return p.filter(id=>id!=contactId);
            }else{
                socket.emit('block',contactId,whoami);
                return [...p,contactId];
            }
        })
    }
    const showAlert = (contactId:string,ev:"block"|"delete") => {
        const lable = ev==='block' && blockC.includes(contactId)?'un'+ev:ev;
        salrt(p=>({...p,vis:true,title:t(`${lable}-c`),discription:t(`${lable}-cc`,{name:`${contacts?.filter(e=>e.uid==contactId)[0].name}`}),button:[
            {txt:t('cancel')},
            {txt:t(lable),onPress:() =>{
                ev==="delete"&&deleteContact(contactId)
                ev==="block"&& blockContact(contactId)
            } }
        ]}))
    };
    const Conts = ({item}: { item: Contact,index:number }) => {
        const press = ()=>{
            nav.navigate('chat',{uid:item.uid,nam:item.name,block:blockC.includes(item.uid),blockby: blockBy.includes(item.uid)});
        }
        return <Cont borderColor={borderColor} onBlockPress={()=>showAlert(item.uid,'block')} onDeletePress={()=>showAlert(item.uid,'delete')} press={press} prog={fileMap[item.uid]?.prog??''} pName={fileMap[item.uid]?.name??''} blocked={blockC.includes(item.uid)} contact={item} blockedBy={ blockBy.includes(item.uid) } />
    }

    return (
        <ThemedView style={styles.container}>
            <ThemedView style={styles.eventArea} darkColor="#151718">
                <TouchableOpacity onPress={nav.goBack} style={{flex:0.1}}><Ionicons name="arrow-back" size={28} color={borderColor} /></TouchableOpacity>
                <ThemedText style={{flex:0.8}} type="title">{t('chats')}</ThemedText>
                <TouchableOpacity onPress={vis} style={{flex:0.1}}><Ionicons name="add" size={28} color={borderColor} /></TouchableOpacity>
            </ThemedView>
            <TouchableOpacity style={styles.uid} onLongPress={()=>{clipbord.setStringAsync(whoami)}}>
                <ThemedText type="link">{whoami}</ThemedText>
            </TouchableOpacity>
            <FlatList data={contacts} keyExtractor={(item) => item.uid} initialNumToRender={10} maxToRenderPerBatch={10} windowSize={7} removeClippedSubviews renderItem={Conts}/>
            <Modal visible={modalVisible} animationType='fade' transparent onRequestClose={vis}>
                <TouchableWithoutFeedback onPress={()=>{isKeyboardVisible?Keyboard.dismiss():vis()}}>
                    <ThemedView style={styles.modalContainer}>
                        <ThemedView style={[styles.modalContent,{borderColor}]}>
                            <ThemedText style={styles.modalTitle}>{t('add')}</ThemedText>
                            <ThemedInput placeholder={t('in-cont')} style={styles.inp} value={name} onChangeText={sname}/>
                            <ThemedInput placeholder={t('in-uid')} style={styles.inp} value={uid} onChangeText={suid}/>
                            <ThemedView style={styles.modalButtons}>
                                <TouchableOpacity style={[styles.modalButton,{borderColor}]} onPress={vis}>
                                    <ThemedText>{t('cancel')}</ThemedText>
                                </TouchableOpacity>
                                <TouchableOpacity style={[styles.modalButton,{borderColor}]} onPress={addContact}>
                                    <ThemedText>{t('save')}</ThemedText>
                                </TouchableOpacity>
                            </ThemedView>
                        </ThemedView>
                    </ThemedView>
                </TouchableWithoutFeedback>
            </Modal>
            <Alert {...alrt}/>
        </ThemedView>

    );
};

const styles = StyleSheet.create({
    eventArea:{ flexDirection:'row', position:'relative', padding:15, justifyContent:"center", alignItems: 'center', },
    container: { flex: 1,},
    modalContainer: { flex: 1, backgroundColor:"rgba(0,0,0,0.5)", justifyContent: "center", alignItems: "center", },
    modalContent: { width: "80%", padding: 20, borderRadius: 10, borderWidth: 2, },
    modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
    modalButtons: { flexDirection: "row", justifyContent: "space-between", marginTop: 15, paddingHorizontal: 10, },
    modalButton: { padding: 10, borderRadius: 5, alignItems: "center", marginHorizontal: 5, borderWidth: 2, },
    uid:{ alignSelf: 'center', },
    inp:{ margin: 5, }
});

export default List;

