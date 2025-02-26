import { FlatList, StyleSheet, TouchableOpacity,Keyboard,TouchableWithoutFeedback,View} from 'react-native'
import { useEffect,useState,useRef} from "react";
import { ThemedText } from '@/components/ThemedText';
import { ThemedInput } from '@/components/ThemedInput';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import socket from '@/constants/Socket';
import {useRoute} from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as FileSystem from 'expo-file-system';
export default function Chat() {
    const {uid} = useRoute().params;
    const borderColor = useThemeColor({light:undefined,dark:undefined},'text');
    const [txt,stxt] = useState('');
    const [yar,syar] = useState('');
    const [msgs,smgs] = useState([]);
    const flatlis = useRef();
    AsyncStorage.getItem("uid").then(syar);
    const sendMsg = ()=>{
        if(!txt.trim())return;
        socket.emit('chat',uid,{msg:txt.trim(),yar});
        stxt('');

    }
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
                    return;
                }

                const oldData = await FileSystem.readAsStringAsync(path, { encoding: FileSystem.EncodingType.UTF8 });
                const parsedData = JSON.parse(oldData);

                await FileSystem.writeAsStringAsync(path, JSON.stringify([...parsedData, msg]), { encoding: FileSystem.EncodingType.UTF8 });
                smgs([...parsedData,msg]);

            } catch (error) {
                console.error('Error handling file:', error);
            }
        });

        return ()=>{
            socket.off('msg');
        }
    },[]) 
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ThemedView style={style.chat}>
                <FlatList
                    ref={flatlis}
                    data={msgs}
                    keyExtractor={(item,index) => item.yar+index}
                    renderItem={({item})=><View style={[style.msg,yar==item.yar?{alignSelf:"flex-end"}:{alignSelf:'flex-start'},{borderColor}]}>
                        <ThemedText>{item.msg}</ThemedText>
                    </View>}
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
