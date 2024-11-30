import React, { useEffect, useState } from 'react';
import {View,Text,TextInput,TouchableOpacity,FlatList, Modal, Alert,TouchableWithoutFeedback,Keyboard, StyleSheet,Dimensions,} from 'react-native'
import Clipboard from '@react-native-clipboard/clipboard'
import uu from 'react-native-uuid';
import Stor from '@react-native-async-storage/async-storage'
import * as scren from 'expo-screen-capture';
import io from 'socket.io-client'
import {API_URL} from "@env"
export default ({navigation})=>{
    const [id,is] = useState('');
    const [vis,ble] = useState(false);
    const [nam,setnam] = useState('');
    const [ied,setid] = useState('');
    const [lis,setlis] = useState([]);
    const [msge,addmsg]=useState({});
        const sock = io(API_URL);
    async function getid (){
        let ide = await Stor.getItem('_id');
        if (!ide) {
            ide = uu.v4();
            await Stor.setItem('_id', ide);
        }
        return ide;
    }
    const getlis = async ()=>{
        setlis(await Stor.getItem('lis') ?? []);
    }
    const send=(i,m)=>{
        sock.emit('chat',i,m)
    }
    useEffect(()=>{
        navigation.setOptions({
            sendData:()=>{
                return msge;
            }
        })
    },[msge,navigation])
    useEffect(()=>{
        (async ()=>{
            is(await getid());
            getlis();
            await scren.preventScreenCaptureAsync();
        })();
        getid().then(id=>{
            sock.emit('set',id)
        sock.on('cht',(msg)=>{
            addmsg(p=>{
                const crnt = p[msg.id] ?? [];
                p[msg.id] = [msg, ...crnt]
                return p;
            });
            // (i==lis.length-1 || lis.length == 0 )?{nam:`new chat`,ied:msg.id}
            setlis(p=>p.map(v=>v.ied==msg.id?{...v,nam:`${v.nam} new msg`}:v))
        })
        })
        return ()=>{
            scren.allowScreenCaptureAsync();
            sock.disconnect();
        }
    },[]);
    const addTog = () => {
        ble((p) => !p);
    };
    const addLis = ()=>{
        if(lis.filter(v=>v.ied==ied).length>0){Alert.alert('id alredy exist');return;}
        if (nam && ied) {
            setlis(p=>[{nam,ied},...p]);
            setnam('')
            setid('')
            addTog()
        }
        else {
            Alert.alert('Chat spec in empty','please fill empty field');
        }
    }
    const copyToClipboard = (text) => {
        Clipboard.setString(text);
    };
    return(
        <View style={{flex:1}}>
            <View><TouchableOpacity onPress={() => copyToClipboard(id)}>
                <Text style={sty.copyText}>{id}</Text></TouchableOpacity></View>
            <FlatList data={lis} style={{flex:1}} renderItem={
                ({item})=><TouchableOpacity style={sty.box} onPress={
                    ()=>{navigation.navigate("Test",{id:item.ied,msge,send})}}>
                    <Text>{item.nam}</Text>
                </TouchableOpacity>} keyExtractor={(i)=>i.ied} />
            <TouchableOpacity onPress={addTog} style={sty.box} ><Text>Add</Text></TouchableOpacity>
            <Modal visible={vis} onRequestClose={addTog} animationType="fade">
                <TouchableWithoutFeedback onPress={Keyboard.dismiss} style={{flex:1,}}>
                    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}>
                        <TextInput value={nam} style={[sty.box,{width:Dimensions.get('window').width - 5,}]} onChangeText={setnam} placeholder='Name' placeholderTextColor={'#000'}/>
                        <TextInput value={ied} style={[sty.box,{width:Dimensions.get('window').width - 5,}]} onChangeText={setid} placeholder='ID' placeholderTextColor={'#000'}/>
                        <TouchableOpacity  onPress={addLis} style={[sty.box,{width:Dimensions.get('window').width - 5,}]}>
                            <Text>add</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableWithoutFeedback>
            </Modal>
        </View>
    )
}
const sty = StyleSheet.create({
    box:{
        margin:5,
        padding:5,
        borderWidth: 1,
        borderColor: '#000',
        borderRadius: 5,
        justifyContent:'center',
        alignItems:'center',
    },
    copyText: {
        color: '#007AFF',  // Style for the text that will be copied
        fontWeight: 'bold',
        fontSize: 16,
        textDecorationLine: 'underline',  // Optional: underline to indicate it's tappable
    },
})
