import React, { useState, useEffect, useLayoutEffect, useRef } from "react";
import {useFileProgress} from '@/components/Prog';
import { FlatList, TouchableOpacity, StyleSheet, Modal, SafeAreaView,Platform, TouchableWithoutFeedback,Pressable,Keyboard} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemedInput } from "@/components/ThemedInput";
import { useThemeColor } from '@/hooks/useThemeColor';
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import {Ionicons} from "@expo/vector-icons";
import * as clipbord from "expo-clipboard";
import {useNavigation} from 'expo-router'
import socket, { init } from '@/constants/Socket';
import {addChat,rmChat,addChunk,writeFunction,} from '@/constants/file';
import {P2P} from '@/constants/webrtc';
import RNFS from 'react-native-fs';
import * as ScreenCapture from 'expo-screen-capture';
import Alert, { AlertProps } from "@/components/Alert";
import axios from "axios";
const CONTACTS_KEY = "chat_contacts";

const ChatContactsScreen = () => {
    interface Contact {
        id: string;
        name: string;
        new?: number;
    }
    const {fileMap,setFileStatus} = useFileProgress();
    const [contacts, setContacts] = useState<Contact[] | null>(null);
    const [name, sname] = useState("");
    const [uid, suid] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [yar,syar] = useState("");
    const [alrt,salrt] = useState<AlertProps>({vis:false,setVis:()=>{salrt(p=>({...p, vis:false,title:'',discription:'',button:[]}))},title:'',discription:'',button:[]});
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const peer = useRef<P2P|null>(null);
    const dow = new Map<string,writeFunction>();
    const nav = useNavigation();
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);
    useLayoutEffect(()=>{
        nav.setOptions({
            headerShown: false,
        });
        return nav.addListener('focus', () => {
            loadContacts();
            ScreenCapture.preventScreenCaptureAsync();
        })
    },[nav])
    useEffect(() => {
        (async()=>{
            contacts && await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(contacts));
            sname("");
            suid("");
            setModalVisible(false);
        })();
    }, [contacts])
    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {setIsKeyboardVisible(true);});
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {setIsKeyboardVisible(false);});
        init();
        peer.current = new P2P({
            onDatOpen:async (peerId)=>{
                const path = `${RNFS.ExternalStorageDirectoryPath}/.pandaDoc/`;
                const exists = await RNFS.exists(path);
                if (!exists) await RNFS.mkdir(path);
                dow.set(peerId,(await addChunk(path)));
            },
            onData:async (data,peerId)=>{
                const res = await dow.get(peerId)?.(data)
                if(typeof res === 'string'){
                    addChat(peerId,{uri:`file://${res}`,yar:peerId,time:Date.now()});
                    dow.delete(peerId);
                    setFileStatus(peerId,{prog:'',name:''});
                }else if(res == -1){
                    // failed
                }else{
                    setFileStatus(peerId,{prog:res?.toFixed(1)})
                }
            },
            onDatClose:(peerId)=>{
                peer.current?.close(peerId)
            },
            onICE:(candidate,uid)=>{
                AsyncStorage.getItem('uid').then(yar=>{
                    socket.emit('ice', uid,yar, candidate);
                })
            }

        })

        socket.on('offer',async (peerId:string,off)=>{
            peer.current?.setRemDisc(peerId,off);
            const ans = await peer.current?.crAns(peerId);
            socket.emit('answer',peerId,await AsyncStorage.getItem('uid'),ans);
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
            Promise.all(tree.map(async url=>{
                try{
                    let path = `${RNFS.ExternalStorageDirectoryPath}/.pandaDoc/`;
                    const exists = await RNFS.exists(path);
                    if (!exists) await RNFS.mkdir(path);
                    const yar = url.split('/')
                    path = `${path}/${yar[1]}`
                    const dow = RNFS.downloadFile({fromUrl:`http://192.168.20.146:3030/dow/${await AsyncStorage.getItem('uid') || ''}/${url}`,toFile:path,discretionary:true,cacheable:true,begin:()=>{
                        setFileStatus(yar[0],{name:yar[1].split('°').pop()??'Downloading'})
                    },progress:rs=>{
                            setFileStatus(yar[0],{prog:(rs.bytesWritten/rs.contentLength * 100).toFixed(2)})
                        },progressDivider:5})
                    const res = await dow.promise;
                    if(res.statusCode === 200){
                        addChat(yar[0],{uri:`file://${path}`,yar:yar[0],time:Date.now()});
                        axios.delete(`http://192.168.20.146:3030/dow/${await AsyncStorage.getItem('uid') || ''}/${url}`)
                        setContacts(p=>moveToFirst(p??[],yar[0]));
                        setFileStatus(yar[0],{name:'',prog:''})
                    }else{
                        if('File(s) not Downloaded' == alrt.title){
                            salrt(p=>({...p,discription:`${p.discription??''}\n${yar[1]}`,vis:true}));
                        }else{
                            salrt(p=>({...p,title:"File(s) not Downloaded",discription:yar[1],vis:true,button:[{txt:'ok'}]}));
                        }
                        throw new Error('hggk');
                    }
                }catch(e:any){
                    e.message === 'hggk' || salrt(p=>({...p,title:"Network error",vis:true,button:[{txt:'ok'}]}));
                }
            }))
        })
        socket.on('msg', async (msg) => {
            if(msg.time){
                if(addChat(msg.yar,msg) === null) {
                    const newContact = {
                        id: msg.yar ,
                        name: "unknown",
                    };
                    setContacts(p=>[newContact,...p??[]]);
                }else{
                    setContacts(p=>moveToFirst(p??[],msg.yar))
                }}
        });
        return ()=>{
            showSubscription.remove();
            hideSubscription.remove();
            ScreenCapture.allowScreenCaptureAsync();
        }
    }, []);

    const vis = () => setModalVisible(p=>!p)
    function moveToFirst(arr: Contact[], targetId: string): Contact[] {
        const index = arr.findIndex(item => item.id === targetId);
        if (index > -1) {
            const updated = [...arr];
            const [item] = updated.splice(index, 1);
            return [{ ...item, new: (item.new || 0) + 1 }, ...updated];
        }
        return arr;
    }
    const loadContacts = async () => {
        try {
            const storedContacts = await AsyncStorage.getItem(CONTACTS_KEY);
            syar(await AsyncStorage.getItem('uid') || '');
            if (storedContacts) {
                setContacts(JSON.parse(storedContacts));
            }
        } catch (error:any) {
            salrt(p=>({...p,vis:true,title:"Error loading contact",discription:`${error.message}`,button:[
                {txt:'ok'}
            ]}))
        }
    };
    const addContact = async () => {
        if (!name.trim()) return;
        const index = contacts?.findIndex(item => item.id === uid) ?? -1;
        if(-1 < index){
            salrt(p=>({...p,vis:true,title:`uid alredy exist in ${contacts[index]?.name}`,discription:"Are you sure you want to rewrite this contact?",button:[
                {
                    txt:'ok',
                    onPress:() => setContacts(p=>p.map(i=>i.id===uid?{...i,name:name.trim()}:i))
                },{
                    txt:'cancel'
                }
            ]}))
            return;
        }
        const newContact = {
            id: uid ,
            name: name.trim(),
        };
        addChat(uid,null);
        setContacts(p=>[newContact,...p??[]]);
    };
    const deleteContact = async (contactId:string) => {
        const updatedContacts = contacts?.filter((contact) => contact.id !== contactId);
        rmChat(contactId)
        setContacts(updatedContacts??contacts);
    };
    const showDeleteAlert = (contactId:string) => {
        salrt(p=>({...p,vis:true,title:'Delete Contact',discription:'Are you sure you want to delete this contact?',button:[
            {txt:'cancel'},
            {txt:'Delete',onPress:() => deleteContact(contactId)}
        ]}))
    };
    const Cont = React.memo(({ item }: { item: Contact }) => (
        <Swipeable renderRightActions={() => (
            <TouchableOpacity style={[styles.deleteButton,{backgroundColor:borderColor}]} onPress={() => showDeleteAlert(item.id)}>
                <ThemedText style={styles.deleteButtonText} lightColor="#ECEDEE" darkColor="#000000">Delete</ThemedText>
            </TouchableOpacity>)}>
            <TouchableOpacity onPress={()=>{setContacts(p=>(p||[]).map(v=>(v.id===item.id?{...v,new:0}:v))); 
                nav.navigate('chating',{uid:item.id,nam:item.name,});}} onLongPress={() => showDeleteAlert(item.id)} style={styles.contactItem}>
                <ThemedText style={styles.contactName}>{item.name} {item.new?`(${item.new})`:''}</ThemedText>
                <ThemedText style={styles.contactUuid}>{item.id}</ThemedText>
                {fileMap[item.id]?.prog &&(<>
                    <ThemedText type="mini">{fileMap[item.id].name}</ThemedText>
                    <ThemedView style={{height:3}}>
                        <ThemedView style={{width:`${Number(fileMap[item.id]?.prog ?? '0')}%`,height:'100%',backgroundColor:borderColor}}/>
                    </ThemedView></>)}
            </TouchableOpacity>
        </Swipeable>
    ));

    return (
        <SafeAreaView style={{flex:1,paddingTop: Platform.OS === 'android' ? 25 : 0}}>
            <GestureHandlerRootView>
                <ThemedView style={styles.container}>
                    <ThemedView style={styles.eventArea} darkColor="#151718">
                        <TouchableOpacity onPress={nav.goBack} style={{flex:0.1}}><Ionicons name="arrow-back" size={28} color={borderColor} /></TouchableOpacity>
                        <ThemedText style={{fontSize:21,flex:0.8}}>chats</ThemedText>
                        <TouchableOpacity onPress={vis} style={{flex:0.1}}><Ionicons name="add" size={28} color={borderColor} /></TouchableOpacity>
                    </ThemedView>
                    <TouchableOpacity style={styles.uid} onLongPress={()=>{clipbord.setStringAsync(yar)}}>
                        <ThemedText type="link">{yar}</ThemedText>
                    </TouchableOpacity>
                    <FlatList data={contacts} keyExtractor={(item) => item.id} initialNumToRender={10} maxToRenderPerBatch={10} windowSize={7} removeClippedSubviews renderItem={({item})=><Cont item={item}/>}/>
                    <Modal visible={modalVisible} animationType="slide" transparent onRequestClose={vis}>
                        <TouchableWithoutFeedback onPress={()=>{isKeyboardVisible?Keyboard.dismiss():vis()}}>
                            <ThemedView style={styles.modalContainer}>
                                <Pressable style={[styles.modalContent,{borderColor}]}>
                                    <ThemedText style={styles.modalTitle}>Add Contact</ThemedText>
                                    <ThemedInput placeholder="Enter contact name" style={styles.inp} value={name} onChangeText={sname}/>
                                    <ThemedInput placeholder="Enter UUID" style={styles.inp} value={uid} onChangeText={suid}/>
                                    <ThemedView style={styles.modalButtons}>
                                        <TouchableOpacity style={[styles.modalButton,{borderColor}]} onPress={vis}>
                                            <ThemedText>Cancel</ThemedText>
                                        </TouchableOpacity>
                                        <TouchableOpacity style={[styles.modalButton,{borderColor}]} onPress={addContact}>
                                            <ThemedText>Save</ThemedText>
                                        </TouchableOpacity>
                                    </ThemedView>
                                </Pressable>
                            </ThemedView>
                        </TouchableWithoutFeedback>
                    </Modal>
                </ThemedView>
                <Alert {...alrt}/>
            </GestureHandlerRootView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    eventArea:{
        flexDirection:'row',
        position:'relative',
        padding:15,
        justifyContent:"center",
        alignItems: 'center',
    },
    container: { flex: 1,},
    contactItem: {
        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#ddd",
    },
    contactName: { fontSize: 18, fontWeight: "bold" },
    contactUuid: { fontSize: 14, color: "gray" },
    deleteButton: {
        justifyContent: "center",
        alignItems: "center",
        width: 80,
        marginVertical: 5,
    },
    deleteButtonText: {fontWeight: "bold" },
    modalContainer: {
        flex: 1,
        backgroundColor: "rgba(0, 0, 0, 0.5)",
        justifyContent: "center",
        alignItems: "center",
    },
    modalContent: {
        width: "80%",
        padding: 20,
        borderRadius: 10,
        borderWidth: 2,
    },
    modalTitle: { fontSize: 20, fontWeight: "bold", marginBottom: 10 },
    modalButtons: {
        flexDirection: "row",
        justifyContent: "space-between",
        marginTop: 15,
        paddingHorizontal: 10,
    },
    modalButton: {
        padding: 10,
        borderRadius: 5,
        alignItems: "center",
        marginHorizontal: 5,
        borderWidth: 2,
    },
    uid:{
        alignSelf: 'center',
    },
    inp:{
        margin: 5,
    }
});

export default ChatContactsScreen;

