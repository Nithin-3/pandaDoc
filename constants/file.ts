import * as FileSystem from 'expo-file-system';
import {MMKV} from 'react-native-mmkv'
const enc = new TextEncoder();
const stor = new MMKV({id:'cht'});
interface FileInfo {
  uri: string;
  name: string;
  size: number;
}
export interface ChunkMessage {
  d: string;
  i: number;
  s: number;
  n: string;
}

type SendChunk = (data: string) => void;
export type writeFunction = (chunk:ChunkMessage) => string|boolean;
export type ChatMessage = {
      msg?: string;
    uri?:string;
    time:number;
      yar: string;
};
export const addChat = (uid:string,msg:ChatMessage|null):void|null =>{
    const exs = stor.getString(uid);
    if(exs){
        setTimeout(()=>stor.set(uid,`[${exs.slice(1,-1)}${msg}]`),500)
    }else{
        stor.set(uid,JSON.stringify([msg??{msg:"INIT",yar:'mid',time:Date.now()}]))
        return null
    }
};
export const readChat = (uid:string):ChatMessage[]=>JSON.parse(stor.getString(uid) ?? '[]') as ChatMessage[]
export const rmChat = (uid:string):void=>{
    readChat(uid).map(msg=>msg.uri&&FileSystem.deleteAsync(msg.uri).catch(_e=>{}))
    stor.delete(uid)
}
export const splitSend = async(file: FileInfo, send: SendChunk): Promise<boolean> => {
    const { uri, name, size } = file;
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) return false;
    const occ = enc.encode(JSON.stringify({d:'',i:Math.ceil(size/16384),s:Math.ceil(size/16384), n: name })).byteLength;
    let cSize = 16384 - occ;
    let totalChunks = Math.ceil(size / cSize);
    for (let i = 0; i < totalChunks; i++) {
        const start = i * cSize;
        const end = Math.min(start + cSize, size);
        try {
            const chunk = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64, position: start, length: end - start });
            const payload = JSON.stringify({ d: chunk, i, s: totalChunks, n: name });
            if (enc.encode(payload).byteLength > 16384){
                cSize = enc.encode(payload).byteLength - 16384;
                i--;
                continue;
            }
            send(payload);
        } catch(e){
            console.warn(e)
            return false;
        }
    }
    return true;
};
export const addChunk = (path: string): writeFunction => {
    const fileMap = new Map<number, string>();
    let fsize = 0, fname = '';
    return (chunk: ChunkMessage):string | boolean => {
        const { d, s, n, i } = chunk;
        fileMap.set(i, d);
        fsize = s;
        fname = n;
        if (fileMap.size !== fsize) return true;
        const order: string[] = [];
        for (let i = 0; i < fsize; i++) {
            const part = fileMap.get(i);
            if (!part) return false;
            order.push(part);
        }
        const base64 = order.join('');
        const fullPath = `${path}${fname}`;
        FileSystem.writeAsStringAsync(fullPath, base64, { encoding: FileSystem.EncodingType.Base64 });
        fileMap.clear();
        return fullPath;
    };
};

