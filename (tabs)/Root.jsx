import React, { useEffect, useState } from 'react';
import { View, Text, FlatList,TouchableOpacity,} from 'react-native';
import * as Doc from "expo-document-picker";
import {useIsFocused} from "@react-navigation/native"
export default function App({navigation}) {
    const [pdfs, setPdfs] = useState([]);
    const [chat,setchat] = useState(false);
    const isf = useIsFocused();
    useEffect(() => {
        loadFiles();
    }, []);
    useEffect(()=>{
        setchat(false);
    },[isf])
    const loadFiles = async () => {
        try {
            const doc = await Doc.getDocumentAsync({
                type: 'application/pdf',
                copyToCacheDirectory: true,
                multiple:true,
            });
            setPdfs(p=>[...p,...doc.assets]);
        } catch (error) {
            console.error('Error fetching files:', error);
        }
    };

    return (
        <View style={{flex:1}}>
            <Text>PDF Files:</Text>
            <FlatList
                data={pdfs}
                keyExtractor={(item) => item.uri}
                renderItem={({ item }) => (
                    <TouchableOpacity
                        onLongPress={()=>{setchat(l=>!l)}}
                        style={{ margin: 5, borderColor: "#000", borderWidth: 1, borderRadius: 15, padding: 5 }}
                        onPress={() => {
                            chat? navigation.navigate("List") :
                            navigation.navigate('pdf',item.uri); // Pass the uri correctly
                        }}>
                        <Text>{item.name}</Text>
                    </TouchableOpacity>
                )}
                ListEmptyComponent={<Text>No PDFs found.</Text>}
            />
            <TouchableOpacity
                        style={{ margin: 5, borderColor: "#000", borderWidth: 1, borderRadius: 15, padding: 5,justifyContent:'center',alignItems:'center' }}
                onPress={loadFiles}
            >
                <Text>Add Temp pdf file </Text>
            </TouchableOpacity>
        </View>
    );
}

