import { ChatMessage } from '@/constants/file'
import React from 'react';
import { Dimensions, Image, Pressable, StyleSheet } from 'react-native'
import { ThemedView } from './ThemedView';
import { ThemedText } from './ThemedText';
import * as clip from 'expo-clipboard';
import { useThemeColor } from '@/hooks/useThemeColor';
import { Vid } from './Vid';
import { Aud } from './Aud';


interface ChatBubleProps{
    item:ChatMessage;
    yar:string;
    path:string;
}
export const ChatBuble = React.memo<ChatBubleProps>(({item,yar,path})=>{
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const {width} = Dimensions.get('window')
    const getType = (uri:string,mimeType:string)=>{
        if(mimeType) return mimeType.split('/')[0];
        const ext = uri.split('.').pop()?.toLowerCase();
        if (!ext) return 'unknown';
        if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext)) return 'image';
        if (['mp4', 'mov', 'mkv', 'webm'].includes(ext)) return 'video';
        if (['mp3', 'wav', 'aac', 'm4a', 'ogg'].includes(ext)) return 'audio';
        return 'unknown';

    }
    const chtFls=(uri:string)=>{
        switch(getType(uri,'')){
            case 'image':
                return(<ThemedView style={{width:width/2-3, aspectRatio:1}}><Image source={{uri}} resizeMode='contain' style={{height:'100%',width:'100%'}} /></ThemedView>)
            case 'video':
                return(<ThemedView style={{width:width/2-3, aspectRatio:1,justifyContent:'center',alignItems:'center'}}><Vid uri={uri}/></ThemedView>)
            case 'audio':
                return(<ThemedView style={{ width:width/2-3,justifyContent:'center',alignItems:'center' }}><Aud uri={uri}/></ThemedView>)
            default:
                return(<ThemedView style={{width:width/2-3,justifyContent:'center',alignItems:'center'}}><ThemedText>{uri.replace(path,'')}</ThemedText></ThemedView>)
        }
    }
    return(
        <Pressable style={{width:"100%"}} onLongPress={()=>{clip.setStringAsync(item.msg ?? item.uri ?? 'null')}}>
            <ThemedView style={[style.msg,{alignSelf:item.yar==yar?"flex-end":item.yar=='mid'?'center':'flex-start'},{borderColor}]}>
                {item.msg&&<ThemedText>{item.msg}</ThemedText>}
                {item.uri && chtFls(item.uri)}
                <ThemedText type='mini' style={{alignSelf:item.yar == 'mid'?'center':item.yar==yar?'flex-start':'flex-end'}}>{new Date(item.time).toLocaleString()}</ThemedText>
            </ThemedView>
        </Pressable>
    )
},
  (prev, next) =>
    prev.item.msg === next.item.msg &&
    prev.item.uri === next.item.uri &&
    prev.item.time === next.item.time &&
    prev.item.yar === next.item.yar &&
    prev.yar === next.yar &&
    prev.path === next.path
);
const style = StyleSheet.create({
    msg:{ flex:1, alignItems:'center', justifyContent:"center", maxWidth:'55%', padding:7, borderRadius:15, borderWidth:1, },
})
