import RNFS from 'react-native-fs'
import {MMKV} from 'react-native-mmkv'
const enc = new TextEncoder();
const MAX_SIZE = 16000;
const SAFE_SIZE = Math.floor(MAX_SIZE*3/4);
type meta = {
    N:'st'|'en';
    s?:number;
    n?:string;
}
interface FileInfo {
    uri: string;
    name: string;
}
type SendChunk = (data: string) => void;
export const stor = new MMKV({id:'cht'});
export const blocks = new MMKV({id:'block'});
export const settingC = new MMKV({id:'sett'});
export type writeFunction = (chunk:string) => Promise<string|number>;
export type ChatMessage = {
    msg?: string;
    uri?:string;
    uid:string;
    time:number|undefined;
    who: string;
};
export const appPath = async():Promise<string>=>{
        let path = `${RNFS.DownloadDirectoryPath}/.pandaDoc/`;
        const exists = await RNFS.exists(path);
        if (!exists) await RNFS.mkdir(path);
        return path;
}
export const addChat = (uid:string,msg:ChatMessage|null):boolean=>{
    const exs = stor.getString(uid);
    if(exs){
        const past = exs.slice(1,-1)
        stor.set(uid,`[${past.length?past+',':''}${JSON.stringify(msg)}]`);
        return false;
    }
    stor.set(uid,msg!=null?JSON.stringify([msg]):`[]`);
    return true;
};
export const readChat = (uid:string):ChatMessage[]=>JSON.parse(stor.getString(uid) ?? '[]') as ChatMessage[]
export const rmChat = (uid:string):void=>{
    readChat(uid).map(async msg=>msg.uri&&await RNFS.unlink(msg.uri.replace('file://', '')).catch(_e=>{}))
    stor.delete(uid)
}
export const splitSend = async (file: FileInfo, send: SendChunk): Promise<boolean> => {
    const { uri, name,} = file;
    try {
        const stat = await RNFS.stat(uri.replace('file://',''));
        if(!stat.isFile()) throw(new Error("file not exist"))
        const size = stat.size;
        const met = JSON.stringify({ s: size, n: `${Date.now()}${Math.round(Math.random()*1E5)}ʕ•ᴥ•ʔ${name}`, N: 'st' });
        if (enc.encode(met).byteLength > MAX_SIZE) throw new Error('Large File Name');
        send(met);
        let i = 0;
        while (i < size) {
            const readsize = Math.min(SAFE_SIZE,size - i)
            const packet = await RNFS.read(stat.path,readsize,i,'base64');
            if(!packet || !packet.length)break;
            send(packet);
            i += readsize;
            await new Promise(res => setTimeout(res, 1));
        }
        send('{"N":"en"}' );
        return true;
    } catch (e){
        console.warn(e)
        return false;
    }
};

export const addChunk = (path: string): writeFunction => {
    let fsize = 0, fpath = '', dow = 0;
    return async (chunk: string):Promise<string|number> => {
        try {
            const met = JSON.parse(chunk) as meta;
            switch (met.N) {
                case 'st':
                    fsize = met.s?Math.ceil(met.s * 4 / 3):0;
                    fpath = `${path}${met.n??''}`;
                    dow = 0;
                    return 0;
                case 'en':
                    return fpath;
            }
        } catch {
            await RNFS.appendFile(fpath,chunk,'base64')
            dow += chunk.length;
            return dow/fsize*100;
        }
    };
};

