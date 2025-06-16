import {useRoute} from "@react-navigation/native"
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { useState } from "react";
import RNFS from 'react-native-fs'
import { ScrollView } from "react-native";
type RouteParams = {uri:string}
const DocViewer = () => {
    const { uri } = useRoute().params as RouteParams;
    const [dat,sdat] = useState('');
    uri!="NA"&&RNFS.readFile(uri.replace('file://', ''), 'utf8').then(sdat)
  return (
        <ScrollView style={{flex:1}}>
            <ThemedView style={{ flex: 1 }}>
                {uri=='NA'&&<ThemedText type="title">onnu illa </ThemedText>}
                <ThemedText>{dat}</ThemedText>
            </ThemedView>
        </ScrollView>
  );
};

export default DocViewer;

