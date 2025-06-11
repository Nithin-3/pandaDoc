import { useState, useEffect, useLayoutEffect, useRef } from "react";
import { FlatList, TouchableOpacity, StyleSheet, Modal, Alert ,SafeAreaView,Platform, TouchableWithoutFeedback,Pressable,Keyboard} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import { ThemedInput } from "@/components/ThemedInput";
import { useThemeColor } from '@/hooks/useThemeColor';
import { GestureHandlerRootView, Swipeable } from "react-native-gesture-handler";
import {Ionicons} from "@expo/vector-icons";
import * as clipbord from "expo-clipboard";
import {useNavigation} from 'expo-router'
import socket from '@/constants/Socket';
import {addChat,rmChat,addChunk,writeFunction} from '@/constants/file';
import {P2P} from '@/constants/webrtc';
import RNFS from 'react-native-fs';
import * as ScreenCapture from 'expo-screen-capture';
const CONTACTS_KEY = "chat_contacts";

type RouteParamsCall = {
    uid:string;
    nam:string;
    cal:'IN'|'ON';
}
const ChatContactsScreen = () => {
    interface Contact {
        id: string;
        name: string;
        new?: number;
    }
    const [contacts, setContacts] = useState<Contact[] | null>(null);
    const [name, sname] = useState("");
    const [uid, suid] = useState("");
    const [modalVisible, setModalVisible] = useState(false);
    const [yar,syar] = useState("");
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const peer = useRef<P2P|null>(null);
    const datAdd = new Map<string,AsyncGenerator>();
    const nav = useNavigation();
    const [isKeyboardVisible, setIsKeyboardVisible] = useState(false);

    useEffect(() => {
        const showSubscription = Keyboard.addListener('keyboardDidShow', () => {setIsKeyboardVisible(true);});
        const hideSubscription = Keyboard.addListener('keyboardDidHide', () => {setIsKeyboardVisible(false);});
        return () => {
            showSubscription.remove();
            hideSubscription.remove();
        };
    }, []);
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
        peer.current = new P2P({
            onDatOpen:(peerId)=>{
                datAdd.set(peerId,genAdd());
            },
            onData:(data,peerId)=>{
                datAdd.get(peerId)?.next({chunk:JSON.parse(data),peerId})
            },
            onDatClose:(peerId)=>{
                peer.current?.clean(peerId)
                datAdd.delete(peerId)
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
            peer.current || console.warn('404 peer')
            peer.current?.setRemDisc(peerId,ans);
        })
        socket.on('ice',async(peerId:string,candidate)=>{
            peer.current || console.warn('404 peer')
            peer.current?.addICE(peerId,candidate)
        })
        socket.on('rqcall',async(peerId:string,vid:boolean)=>{
            peer.current || console.warn('404 peer')
            await peer.current?.initPeer(peerId);
            await peer.current?.stStrm(vid);
            nav.navigate('call',{uid:peerId,cal:'IN',nam:'dgerbeb'} as RouteParamsCall)
        })
        socket.on('msg', async (msg) => {
            if((await addChat(msg.yar,msg)) === null) {
                const newContact = {
                    id: msg.yar ,
                    name: "unknown",
                };
                setContacts(p=>[newContact,...p??[]]);
            }else{
                setContacts(p=>moveToFirst(p??[],msg.yar))
            }
        });
        return ()=>{
            ScreenCapture.allowScreenCaptureAsync();
        }
    }, []);

    const genAdd = async function* (){
        const path = `${RNFS.ExternalStorageDirectoryPath}pandaDoc/`;
        const exists = await RNFS.exists(path);
        if (!exists) await RNFS.mkdir(path);
        const down = new Map<string ,writeFunction >();
        while (true) {
            const {chunk,peerId} =  yield;
            if(!down.has(chunk.n)){
                down.set(chunk.n,addChunk(path));
            }
            const isadd = await down.get(chunk.n)?.(chunk);
            if (typeof isadd === 'string') {
                down.delete(chunk.n);
                addChat(peerId,{uri:isadd,yar:peerId,time:Date.now()})
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
        } catch (error) {
            console.error("Error loading contacts:", error);
        }
    };
    const addContact = async () => {
        if (!name.trim()) return;
        const index = contacts?.findIndex(item => item.id === uid) || -1;
        if(-1 < index){

            Alert.alert(
                `uid alredy exist in ${contacts?[index].name}`,
                "Are you sure you want to rewrite this contact?",
                [
                    { text: "Cancel", style: "cancel" },
                    { text: "ok", style: "destructive", onPress: () => setContacts(p=>p.map(i=>i.id===uid?{...i,name:name.trim()}:i))},
                ]
            );
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
        rmChat(contactId).then(()=>setContacts(updatedContacts?? contacts))
    };
    const showDeleteAlert = (contactId:string) => {
        Alert.alert(
            "Delete Contact",
            "Are you sure you want to delete this contact?",
            [
                { text: "Cancel", style: "cancel" },
                { text: "Delete", style: "destructive", onPress: () => deleteContact(contactId) },
            ]
        );
    };
    const renderSwipeableContact = ({ item }: { item: Contact }) => (
    <Swipeable
        renderRightActions={() => (
            <TouchableOpacity style={styles.deleteButton} onPress={() => showDeleteAlert(item.id)}>
                <ThemedText style={styles.deleteButtonText}>Delete</ThemedText>
            </TouchableOpacity>
        )}
    >
        <TouchableOpacity onPress={async()=>{nav.navigate('chating',{uid:item.id,nam:item.name,peer:await peer.current?.getPeer(item.id)})}} onLongPress={() => showDeleteAlert(item.id)} style={styles.contactItem}>
            <ThemedText style={styles.contactName}>{item.name} {item.new}</ThemedText>
            <ThemedText style={styles.contactUuid}>{item.id}</ThemedText>
        </TouchableOpacity>
    </Swipeable>
);

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
                    <FlatList data={contacts} keyExtractor={(item) => item.id} renderItem={renderSwipeableContact}/>
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
        backgroundColor: "red",
        justifyContent: "center",
        alignItems: "center",
        width: 80,
        marginVertical: 5,
    },
    deleteButtonText: { color: "white", fontWeight: "bold" },
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

