import * as FileSystem from 'expo-file-system';
const enc = new TextEncoder()
interface FileInfo {
  uri: string;
  name: string;
  size: number;
}
interface ChunkMessage {
  d: string;
  i: number;
  s: number;
  n: string;
}

type SendChunk = (data: string) => void;
type writeFunction = (chunk:ChunkMessage,path:string) => Promise<string|boolean>;
export type ChatMessage = {
      msg?: string;
    uri?:string;
    time:number;
      yar: string;
};
const pthEx = async (uid:string):Promise<{path: string; exist: boolean}> => {
        const path = `${FileSystem.documentDirectory}${uid}.nin`;
        const fileInfo = await FileSystem.getInfoAsync(path);
        return { path, exist:!fileInfo.exists };
}
export const addChat = async (uid:string,msg:ChatMessage|null):Promise<boolean|null> =>{
    const {path,exist} = await pthEx(uid);
    try {
        if (exist) {
            await FileSystem.writeAsStringAsync(path, JSON.stringify([msg??{msg:"INIT",yar:"mid"}]),{
                encoding: FileSystem.EncodingType.UTF8
            });
            return null;
        }
        const oldData = await FileSystem.readAsStringAsync(path, {
            encoding: FileSystem.EncodingType.UTF8
        });
        const parsedData = JSON.parse(oldData);
        await FileSystem.writeAsStringAsync(path, JSON.stringify([...parsedData, msg]), {
            encoding: FileSystem.EncodingType.UTF8
        });
        return true;
    } catch(err) {
        console.log("char not added\n",err)
        return false;
    }
};
export const readChat = async(uid:string):Promise<ChatMessage[]|null>=>{
    const {path,exist} = await pthEx(uid);
    try{
        if (exist) return null;
        const data = await FileSystem.readAsStringAsync(path, {
                  encoding: FileSystem.EncodingType.UTF8,
                });
        return JSON.parse(data || '[]') as ChatMessage[];
    }
    catch(err){
        console.log("char not readed\n",err)
        return null
    }
}
export const rmChat = async(uid:string):Promise<boolean>=>{
    const {path,exist} = await pthEx(uid);
    try{
        if (exist) return false;
        await FileSystem.deleteAsync(path);
        return true;
    }
    catch(err){
        console.log("char not deleted\n",err)
        return false
    }
}
export const splitSend = async(file: FileInfo, send: SendChunk): Promise<boolean> => {
    const { uri, name, size } = file;
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) return false;
    const occ = enc.encode(JSON.stringify({ d: '', i: Number.MAX_VALUE, s: size, n: name })).length;
    const CHUNK_SIZE = 1024 * 16 - occ;
    const totalChunks = Math.ceil(size / CHUNK_SIZE);
    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE, end = Math.min(start + CHUNK_SIZE, size);
        try {
            const chunk = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64, position: start, length: end - start });
            const payload = JSON.stringify({ d: chunk, i, s: totalChunks, n: name });
            if (enc.encode(payload).length > 1024 * 16) return false;
            send(payload);
        } catch (e) {
            return false;
        }
    }
    return true;
};
export const addChunk = (path: string): writeFunction => {
    const fileMap = new Map<number, string>();
    let fsize = 0, fname = '';

    return async (chunk: ChunkMessage): Promise<string | boolean> => {
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
        try {
            const base64 = order.join('');
            const fullPath = `${path}${fname}`;
            await FileSystem.writeAsStringAsync(fullPath, base64, { encoding: FileSystem.EncodingType.Base64 });
            fileMap.clear();
            return fullPath;
        } catch {
            return false;
        }
    };
};

