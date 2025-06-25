import * as FileSystem from 'expo-file-system';
import RNFS from 'react-native-fs'
import {MMKV} from 'react-native-mmkv'
const enc = new TextEncoder();
const stor = new MMKV({id:'cht'});
export const conty = new MMKV({id:'cnt'});
export const blocks = new MMKV({id:'block'});
export const settingC = new MMKV({id:'sett'});
interface FileInfo {
  uri: string;
  name: string;
}
type SendChunk = (data: string) => void;
export type writeFunction = (chunk:string) => Promise<string|number>;
export type ChatMessage = {
    msg?: string;
    uri?:string;
    time:number;
    yar: string;
};
export const addChat = (uid:string,msg:ChatMessage|null):boolean=>{
    const exs = stor.getString(uid);
    if(exs){
        stor.set(uid,`[${exs.slice(1, -1)},${JSON.stringify(msg)}]`);
        return false;
    }
    stor.set(uid,JSON.stringify([msg??{msg:"INIT",yar:'mid',time:Date.now()}]));
    return true;
};
export const readChat = (uid:string):ChatMessage[]=>JSON.parse(stor.getString(uid) ?? '[]') as ChatMessage[]
export const rmChat = (uid:string):void=>{
    stor.delete(uid)
    readChat(uid).map(msg=>msg.uri&&FileSystem.deleteAsync(msg.uri).catch(_e=>{}))
}
const MAX_SIZE = 16000;
type meta = {
    N:'st'|'en';
    s?:number;
    n?:string;
}
export const splitSend = async (file: FileInfo, send: SendChunk): Promise<boolean> => {
    const { uri, name,} = file;
    try {
        const fileInfo = await FileSystem.getInfoAsync(uri);
        if (!fileInfo.exists) throw new Error('File not found');
        const bin = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
        const size = bin.length
        const met = JSON.stringify({ s: bin.length, n: `${Date.now()}${Math.round(Math.random()*1E5)} ʕ•ᴥ•ʔ ${name}`, N: 'st' });
        if (enc.encode(met).byteLength > MAX_SIZE) throw new Error('Large File Name');
        send(met);
        let i = 0, s = 0;
        while (s < size) {
            s = i + MAX_SIZE;
            if (s > size) {
                s = size;
            }
            send(bin.slice(i, s));
            i = s;
            await new Promise(res => setTimeout(res, 1));
        }
        send('{"N":"en"}' );
        return true;
    } catch (e){
        return false;
    }
};

export const addChunk = (path: string): writeFunction => {
    let fileMap: string[] = [];
    let fsize = 0, fname = '', dow = 0;
    return async (chunk: string):Promise<string|number> => {
        try {
            const met = JSON.parse(chunk) as meta;
            switch (met.N) {
                case 'st':
                    fsize = met.s??0;
                    fname = met.n??'';
                    dow = 0;
                    fileMap=[];
                    return 0;
                case 'en':
                    const bin = fileMap.join('');
                    if (fsize !== bin.length) return -1;
                    const pathai = `${path}${fname}`;
                    await RNFS.writeFile(pathai,bin,'base64');
                    return pathai;
            }
        } catch {
            fileMap.push(chunk);
            dow += chunk.length;
            return dow/fsize*100;
        }
    };
};

