import { useEffect } from 'react';
import { StyleSheet, ScrollView,PermissionsAndroid,  TouchableOpacity} from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import {useNavigation} from 'expo-router'
// import RNFS from "react-native-fs"
;
export default function HomeScreen() {
    const nav = useNavigation()
    useEffect(()=>{
        // (async ()=>{
        //     try {
        //         const granted = await PermissionsAndroid.request(
        //             PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE
        //         );
        //         if (granted == PermissionsAndroid.RESULTS.GRANTED) {
        //             getfile()
        //         }
        //     } catch (err) {
        //         console.error(err);
        //     }})();
    },[])
    // const getfile = async ()=>{
    //     const dirs = [RNFS.ExternalStorageDirectoryPath];
    //     let files = [];

    //     for (const dir of dirs) {
    //         try {
    //             const items = await RNFS.readDir(dir);
    //             items.forEach((item) => {
    //                 if (item.isFile() && item.name.match(/\.(pdf|docx|txt|xlsx|pptx)$/i)) {
    //                     files.push(item.path);
    //                 }
    //             });
    //         } catch (err) {
    //             console.error('Error reading directory:', err);
    //         }
    //     }

    //     console.log('Documents:', files);
    // }
    return (
        <ScrollView>
            <TouchableOpacity onPress={()=>{nav.navigate('list')}}><ThemedText>
            chat</ThemedText> 
            </TouchableOpacity>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    titleContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    stepContainer: {
        gap: 8,
        marginBottom: 8,
    },
    reactLogo: {
        height: 20,
        width: 200,
        bottom: 0,
        left: 0,
        position: 'absolute',
    },
});
