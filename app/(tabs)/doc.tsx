import {useNavigation, useRoute} from "@react-navigation/native"
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useEffect, useState } from "react";
import RNFS from 'react-native-fs'
import { ScrollView, StyleSheet } from "react-native";
import { TouchableOpacity } from "react-native";
import { Ionicons, } from "@expo/vector-icons";
import { useThemeColor } from "@/hooks/useThemeColor";
type RouteParams = {uri:string}
const DocViewer = () => {
    const nav = useNavigation();
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const { uri } = useRoute().params as RouteParams;
    const [dat,sdat] = useState('');
    useEffect(()=>{
        const path = uri.replace('file://','');
        path=='NA'||RNFS.readFile(path,'utf8').then(sdat);
    },[])
  return (
        <ThemedView style={{flex:1}}>
            <ThemedView style={styles.eventArea} darkColor="#151718">
                <TouchableOpacity onPress={nav.goBack} style={{flex:0.1}}><Ionicons name="arrow-back" size={28} color={borderColor} /></TouchableOpacity>
                <ThemedText style={{flex:0.8}} type="title">{uri.split('.').pop()}</ThemedText>
            </ThemedView>
        <ScrollView style={{flex:1}}>
            <ThemedView style={{ flex: 1 }}>
                {uri.replace('file://','')=='NA'&&<ThemedText type="title">onnu illa </ThemedText>}
                <ThemedText>{dat}</ThemedText>
            </ThemedView>
        </ScrollView>
        </ThemedView>
  );
};
const styles = StyleSheet.create({
    eventArea:{ flexDirection:'row', position:'relative', padding:15, justifyContent:"space-between", alignItems: 'center', },
})

export default DocViewer;

