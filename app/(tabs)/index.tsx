import '@/lang/i18n';
import { useEffect,useState } from 'react';
import { StyleSheet, TouchableOpacity, FlatList,Modal,Image} from 'react-native';
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from '@/components/ThemedText';
import { useNavigation } from '@react-navigation/native';
import { useThemeColor } from '@/hooks/useThemeColor';
import RNFS from 'react-native-fs';
import  ManageExternalStorage  from 'react-native-external-storage-permission';
import socket from '@/constants/Socket';
import {useTranslation} from 'react-i18next';
import { MaterialIcons, } from '@expo/vector-icons';
import { allProp } from './navType';
export default function HomeScreen() {
    const {t} = useTranslation();
    const nav = useNavigation<allProp>();
    const [file, setfile] = useState<{ path: string; name: string }[]>([]);
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const [cht,sCht] = useState(false);
    const [vis,svis] = useState(false);
    useEffect(() => {
        nav.setOptions({headerShown:false,});
        const unsubscribe = nav.addListener('focus', () => {
            sCht(false);
            socket.emit('exit');
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
        const rootDir = RNFS.ExternalStorageDirectoryPath;
        let files = [];
        let queue = [rootDir];
        while (queue.length > 0) {
            const currentDir:String = queue.shift() || '';
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
        }
        files.length || files.push({path:"NA",name:"empty"}) 
        setfile(files)

    };
    const openFile=async(uri:string)=>{
        uri = `file://${uri}`
            nav.navigate(uri.match(/\.(pdf)$/i) ? "pdf" : "doc", { uri });

    }
    const list = ({item}: { item: { path: string; name: string } })=>(
        <TouchableOpacity style={[styles.lisTxt,{borderColor}]} onPress={() =>{cht? nav.navigate('list' as never):openFile(item.path)}} onLongPress={()=>{sCht(p=>!p)}}>
            <ThemedText>{item.name}</ThemedText>
        </TouchableOpacity>
    )

    return (
        <ThemedView style={styles.root}>
                    <ThemedView style={styles.eventArea} darkColor="#151718">
                        <ThemedText style={{flex:0.8}} type="title">{t('doc')}</ThemedText>
                        <TouchableOpacity onPress={()=>{nav.navigate('setting',{forDoc:true})}} style={{flex:0.1}}><MaterialIcons name="settings" size={28} color={borderColor} /></TouchableOpacity>
                    </ThemedView>
            {file.length?
            <FlatList data={file} keyExtractor={i=>i.path} renderItem={list}/>:
                <ThemedView style={styles.loadSceen}>
                    <ThemedText>{t('read')}</ThemedText>
                    <Image resizeMode="contain" source={require('../../assets/images/read.gif')}/> 
                </ThemedView>
            }
            <Modal animationType="fade" transparent={true} visible={vis}>
                <ThemedView style={styles.loadSceen}>
                    <ThemedView style={[styles.allert,{borderColor}]}>
                        <ThemedText>{t('rq-per')}</ThemedText>
                        <ThemedView style={styles.buttonViw}>
                            <TouchableOpacity style={[styles.lisTxt,{borderColor}]} onPress={reqPer}>
                                <ThemedText>{t('ok')}</ThemedText>
                            </TouchableOpacity>
                            <TouchableOpacity style={[styles.lisTxt,{borderColor}]} onPress={()=>svis(false)}>
                                <ThemedText>{t('cancel')}</ThemedText>
                            </TouchableOpacity>
                        </ThemedView>
                    </ThemedView>
                </ThemedView>
            </Modal>
        </ThemedView>
    );
}

const styles = StyleSheet.create({
    root:{ flex:1, position:"relative", },
    eventArea:{ flexDirection:'row', position:'relative', padding:15, justifyContent:"space-between", alignItems: 'center', },
    loadSceen:{ flex:1, justifyContent:"center", alignItems: 'center', },
    lisTxt:{ alignSelf: 'flex-start', justifyContent:"center", padding:7, borderRadius:15, borderWidth:1, width:'auto', },
    allert : { margin: 20, borderRadius: 12, padding: 20, elevation: 5, },
    buttonViw:{ flexDirection: 'row',     justifyContent: 'space-between' }
});

