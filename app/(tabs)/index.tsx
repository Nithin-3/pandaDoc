import { useEffect,useState } from 'react';
import { StyleSheet, TouchableOpacity, FlatList,Modal,Image} from 'react-native';
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from '@/components/ThemedText';
import { useNavigation } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import RNFS from 'react-native-fs';
import  ManageExternalStorage  from 'react-native-external-storage-permission';
import socket from '@/constants/Socket';
export default function HomeScreen() {
    const nav = useNavigation();
    const [file, setfile] = useState<{ path: string; name: string }[]>([]);
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const [cht,sCht] = useState(false);
    const [vis,svis] = useState(false);
    useEffect(() => {
        const unsubscribe = nav.addListener('focus', () => {
            sCht(false);
            socket.emit('exit')
        });
        return unsubscribe;
    }, [nav]);
    const reqPer = async () => {
        try {
            const granted = await ManageExternalStorage.checkAndGrantPermission();
            if (granted) {
                svis(false)
                getFiles();
            }else{
                svis(true)
            }
        } catch (err) {
            console.error(err);
        }
    }

    useEffect(() => {
        reqPer()
    }, []);
    const getFiles = async () => {
        try {
            const rootDir = RNFS.ExternalStorageDirectoryPath;
            let files = [];
            let queue = [rootDir];
            while (queue.length > 0) {
                const currentDir:String = queue.shift() || '';
                try {
                    const items = await RNFS.readDir(`${currentDir}`);
                    for (const item of items) {
                        if (item.isFile() && item.name.match(/\.(pdf|txt|xml|csv|json|html|md|log)$/i)) {
                            files.push({path:item.path,name:item.name});
                        } else if (item.isDirectory()) {
                            if (currentDir.includes('/Android')) continue;
                            if (currentDir.includes('/.')) continue;
                            queue.push(item.path);
                        }
                    }
                } catch (err) {
                    console.error(currentDir, err);
                }
            }
            files.length || files.push({path:"NA",name:"empty"}) 
            setfile(files)

        } catch (err) {
            console.error('Error reading directory:', err);
        }
    };
    const openFile=async(uri:string)=>{
        uri = `file://${uri}`
        try {
            nav.navigate(uri.match(/\.(pdf)$/i) ? "pdf" : "doc", { uri });
        } catch (error) {
            console.error('Error opening file:', error);
        }

    }
    const list = ({item}: { item: { path: string; name: string } })=>(
        <TouchableOpacity style={[styles.lisTxt,{borderColor}]} onPress={() =>{cht? nav.navigate('list' as never):openFile(item.path)}} onLongPress={()=>{sCht(p=>!p)}}>
            <ThemedText>{item.name}</ThemedText>
        </TouchableOpacity>
    )

    return (
        <ThemedView style={styles.root}>
            {file.length?
            <FlatList data={file} keyExtractor={i=>i.path} renderItem={list}/>:
                <ThemedView style={styles.loadSceen}>
                    <ThemedText>Read all document it may take  some time...</ThemedText>
                    <Image resizeMode="contain" source={require('../../assets/images/read.gif')}/> 
                </ThemedView>
            }
            <Modal animationType="fade" transparent={true} visible={vis}>
                <ThemedView style={styles.loadSceen}>
                    <ThemedView style={[styles.allert,{borderColor}]}>
                        <ThemedText>pandaPdf needs access to your storage to function properly. Please grant permission.</ThemedText>
                        <ThemedView style={styles.buttonViw}>
                            <TouchableOpacity style={[styles.lisTxt,{borderColor}]} onPress={reqPer}>
                                <ThemedText>ok 👍</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.lisTxt,{borderColor}]} onPress={()=>svis(false)}>
                                <ThemedText>cancel 👎</ThemedText>
                            </TouchableOpacity>
                        </ThemedView>
                    </ThemedView>
                </ThemedView>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    root:{
        flex:1,
        position:"relative",
        },
    loadSceen:{
        flex:1,
        justifyContent:"center",
        alignItems: 'center',
    },
    lisTxt:{
        alignSelf: 'flex-start',
        justifyContent:"center",
        padding:7,
        borderRadius:15,
        borderWidth:1,
        width:'auto',
    },
    allert : {
        margin: 20,
        borderRadius: 12,
        padding: 20,
        elevation: 5,
    },
    buttonViw:{
        flexDirection: 'row',    
        justifyContent: 'space-between'
    }
});

