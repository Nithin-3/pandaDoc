import {StyleSheet, TouchableOpacity } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import Pdf from 'react-native-pdf';
import {useNavigation, useRoute} from "@react-navigation/native"
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedText } from '@/components/ThemedText';
import { Ionicons } from '@expo/vector-icons';
import {Routes} from '@/constants/navType'
const PDFViewer = () => {
    const nav = useNavigation();
    const borderColor=useThemeColor({},'text');
    const { uri } = useRoute().params as Routes['pdf'];
    const backgroundColor = useThemeColor({}, 'background');
  return (
    <ThemedView style={{ flex: 1 }}>
            <ThemedView style={styles.eventArea} darkColor="#151718">
                <TouchableOpacity onPress={nav.goBack} style={{flex:0.1}}><Ionicons name="arrow-back" size={28} color={borderColor} /></TouchableOpacity>
                <ThemedText style={{flex:0.8}} type="title">{uri.split('.').pop()}</ThemedText>
            </ThemedView>
      <Pdf source={{ uri }} style={{ flex: 1,backgroundColor, width:"100%"}} />
    </ThemedView>
  );
};
const styles = StyleSheet.create({
    eventArea:{ flexDirection:'row', position:'relative', padding:15, justifyContent:"space-between", alignItems: 'center', },
})

export default PDFViewer;

