import { ScrollView, StyleSheet, TouchableOpacity,Keyboard,TouchableWithoutFeedback,View} from 'react-native'
import { useEffect,useState} from "react";
import { ThemedText } from '@/components/ThemedText';
import { ThemedInput } from '@/components/ThemedInput';
import { ThemedView } from '@/components/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';
import socket from '@/constants/Socket';
import {useRoute} from "@react-navigation/native"
import AsyncStorage from "@react-native-async-storage/async-storage";
export default function Chat() {
    const {uid} = useRoute().params;
    const borderColor = useThemeColor({light:undefined,dark:undefined},'text');
    const [txt,stxt] = useState('');
    const [yar,syar] = useState('');
    AsyncStorage.getItem("uid").then(syar);
    const sendMsg = ()=>{
        if(!txt.trim())return;
        socket.emit('chat',uid,{msg:txt.trim(),yar});
        stxt('');
    }
   useEffect(()=>{
        socket.on('msg',console.log);
        return ()=>{
        socket.off('msg');
        }
    },[]) 
    return (
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
            <ThemedView style={style.chat}>
                <ScrollView >
                    <View style={[style.msg,{alignSelf:'flex-start'},{borderColor}]}>
                        <ThemedText>fghsrhsrvxvdvd</ThemedText>
                    </View>
                    <View style={[style.msg,{alignSelf:'flex-end'},{borderColor}]}>
                        <ThemedText>{uid}</ThemedText>
                    </View>
                </ScrollView>
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
