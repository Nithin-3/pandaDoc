import * as FileSystem from 'expo-file-system';
type ChatMessage = {
      msg: string;
      yar: string;
};
const pthEx = async (uid:string):Promise<{string,boolean}> => {
        const path = `${FileSystem.documentDirectory}${uid}.nin`;
        const fileInfo = await FileSystem.getInfoAsync(path);
        return { path, exist:!fileInfo.exists };
}
export const addChat = async (uid:string,msg:ChatMessage|null):Promise<boolean|null> =>{
    const {path,exist} = await pthEx(uid);
    try {
        if (exist) {
            await FileSystem.writeAsStringAsync(path, JSON.stringify([msg??'']),{
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
        const data = await FileSystem.deleteAsync(path);
        return true;
    }
    catch(err){
        console.log("char not deleted\n",err)
        return false
    }
}
