import { FlatList, StyleSheet, TouchableOpacity,Keyboard,TouchableWithoutFeedback,SafeAreaView,Platform} from 'react-native'
import { useEffect,useState,useRef,useLayoutEffect,useCallback} from "react";
import { ThemedText } from '@/components/ThemedText';
import { ThemedInput } from '@/components/ThemedInput';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import socket from '@/constants/Socket';
import {useRoute} from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system';
import {Ionicons} from "@expo/vector-icons";
const CONTACTS_KEY = "chat_contacts";
import {useNavigation} from 'expo-router'
export default function Chat() {
    const {uid,nam} = useRoute().params;
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const [txt,stxt] = useState('');
    const [yar,syar] = useState('');
    const [msgs,smgs] = useState([]);
    const [edit,sedit] = useState(false);
    const flatlis = useRef();
    const title = useRef();
    const nav = useNavigation();
    const [titNam,stitNam] = useState(nam);
    AsyncStorage.getItem("uid").then(syar);
    const sendMsg = ()=>{
        if(!txt.trim())return;
        socket.emit('chat',uid,{msg:txt.trim(),yar});
        uid!=yar && smgs(p=>[...p,{msg:txt.trim(),yar}]);
        stxt('');
    }
    const changeNam = async ()=>{
        sedit((prevEdit) => {
              if (prevEdit) {
                AsyncStorage.getItem(CONTACTS_KEY).then((t) => JSON.parse(t)).then((c) =>c.map((v) => (v.id == uid ? { ...v, name: titNam } : v))).then(async (C) => await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(C)));
        console.log('jhuyhhgggfjf')

            } else {
               setTimeout(()=>title?.current?.focus(),100)
        console.log('jfjf')
            }
            return !prevEdit;
        });
    }
    useLayoutEffect(()=>{
        nav.setOptions({
            headerShown: false,
        });
    },[nav])
    useEffect(()=>{
        (async ()=>{
            const path = `${FileSystem.documentDirectory}${uid}.nin`;
            const oldData = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
            const parsedData = JSON.parse(oldData);
            smgs(parsedData);
        })();
        socket.on('msg', async (msg) => {
            try {
                const path = `${FileSystem.documentDirectory}${msg.yar}.nin`;
                const fileInfo = await FileSystem.getInfoAsync(path);
                if (!fileInfo.exists) {
                    await FileSystem.writeAsStringAsync(path, JSON.stringify([msg]), { encoding: FileSystem.EncodingType.UTF8 });
                    const storedContacts = await AsyncStorage.getItem(CONTACTS_KEY);
                    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify([{name:'unknown',id:msg.yar,new:1},...storedContacts]));
                    return;
                }
                const oldData = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
                const parsedData = JSON.parse(oldData);
                await FileSystem.writeAsStringAsync(path, JSON.stringify([...parsedData, msg]), { encoding: FileSystem.EncodingType.UTF8 });
                uid === msg.yar && smgs([...parsedData,msg]);
                uid === msg.yar ||
                    await AsyncStorage.setItem(CONTACTS_KEY, JSON.stringify(moveToFirst(await AsyncStorage.getItem(CONTACTS_KEY),msg.yar)));
            } catch (error) {
                console.error('Error handling file:', error);
            }
        });
        return ()=>{
            socket.off('msg');
        }
    },[]) 
    function moveToFirst(arr, targetId) {
        const index = arr.findIndex(item => item.id === targetId);
        if (index > -1) {
            const [item] = arr.splice(index, 1);
            arr.unshift({...item,new:item.new?item.new+1:1});
        }
        return arr;
    }
    return (
        <SafeAreaView style={{flex:1,paddingTop: Platform.OS === 'android' ? 25 : 0}}>
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ThemedView style={style.chat} >
                <ThemedView style={[style.eventArea,{}]} darkColor="#151718">
                        <TouchableOpacity onPress={nav.goBack} style={{flex:0.1}}>
                            <Ionicons name="arrow-back" size={28} color={borderColor} />
                        </TouchableOpacity>
                    <ThemedInput value={titNam} onChangeText={stitNam} placeholder="don't be empty..." ref={title} editable={edit} style={{fontSize:21,flex:0.8}}/>
                        <TouchableOpacity onPress={changeNam} style={{flex:0.1}}>

                            <Ionicons name={edit?"checkmark":"pencil"} size={28} color={borderColor} />

                        
                        </TouchableOpacity>
                </ThemedView>
                <FlatList
                    ref={flatlis}
                    data={msgs}
                    keyExtractor={(item,index) => item.yar+index}
                    renderItem={({item})=><ThemedView style={[style.msg,yar==item.yar?{alignSelf:"flex-end"}:{alignSelf:'flex-start'},{borderColor}]}>
                        <ThemedText>{item.msg}</ThemedText>
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
        paddingHorizontal:5,
        borderRadius:20,
        overflow:'hidden',
        maxHeight:80
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
