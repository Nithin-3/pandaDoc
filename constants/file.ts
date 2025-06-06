import * as FileSystem from 'expo-file-system';
const CHUNK_SIZE = 1024 * 64;

interface FileInfo {
  uri: string;
  name: string;
  size: number;
}
interface ChunkMessage {
  data: string;
  index: number;
  size: number;
  name: string;
}

type SendFunction = (data: ChunkMessage) => Promise<void>;
type writeFunction = (chunk:ChunkMessage,path:string) => Promise<string|boolean>;
type ChatMessage = {
      msg: string;
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
export const splitSend = async(file:FileInfo,send:SendFunction):Promise<boolean>=>{
    const {uri,name,size} = file;
    const fileInfo = await FileSystem.getInfoAsync(uri);
    if (!fileInfo.exists) return false;
    const totalChunks = Math.ceil(size / CHUNK_SIZE);
    for (let i = 0; i < totalChunks; i++) {
        const start = i * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, size);
        try{
            const chunk = await FileSystem.readAsStringAsync(uri, {encoding: FileSystem.EncodingType.Base64,position: start,length: end - start,});
            await send({data: chunk,index: i,size:totalChunks,name: name,});
        }catch(e){
            return false;
        }
    }
    return true;
}
export const addChunk = ():writeFunction=>{
    const fileMap = new Map< number, string >();
    let fsize = 0;
    let fname = '';
    return async(chunk:ChunkMessage,path:string):Promise<string|boolean>=>{
        const {data,size,name,index} = chunk;
        fileMap.set(index,data);
        fsize = size;
        fname = name;
        if( fileMap.size === fsize ){
          const order:string[] = [];
            for(let i=0;i<fsize;i++){
                const packet = fileMap.get(i);
                if(!packet) return false;
                order.push(packet);
            }
            const base64 = order.join('');
            try {
                await FileSystem.writeAsStringAsync(`${path}${fname}`, base64, {encoding: FileSystem.EncodingType.Base64,});
                fileMap.clear();
                return `${path}${fname}`;
            } catch (err) {
                return false;
            }
        }
        return true;
    }
}
