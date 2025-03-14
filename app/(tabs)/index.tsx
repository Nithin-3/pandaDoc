import { useEffect,useState } from 'react';
import { StyleSheet, TouchableOpacity, Platform, FlatList} from 'react-native';
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from '@/components/ThemedText';
import { useNavigation } from 'expo-router';
import RNFS from 'react-native-fs';
import  ManageExternalStorage  from 'react-native-external-storage-permission';
export default function HomeScreen() {
    const nav = useNavigation();
    const [file, setfile] = useState<{ path: string; name: string }[]>([]);
    useEffect(() => {

        (async () => {
            try {
                const granted = await ManageExternalStorage.checkAndGrantPermission();
                if (granted) {
                    getFiles();
                }
            } catch (err) {
                console.error(err);
            }
        })();

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
                        if (item.isFile() && item.name.match(/\.(pdf|docx|txt|xlsx|pptx)$/i)) {
                            files.push({path:item.path,name:item.name});
                        } else if (item.isDirectory()) {
                            if (currentDir.includes('/Android')) continue;
                            queue.push(item.path);
                        }
                    }
                } catch (err) {
                    console.error(currentDir, err);
                }
            }
                setfile(files)

        } catch (err) {
            console.error('Error reading directory:', err);
        }
    };

    return (
        <ThemedView>
            <TouchableOpacity onPress={() => nav.navigate('list' as never)}>
                <ThemedText>chat</ThemedText>
            </TouchableOpacity>
            <FlatList data={file} keyExtractor={(_,i)=>i.toString()} renderItem={({item})=><ThemedText>{item.name}</ThemedText>}/>
        </ThemedView>
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

