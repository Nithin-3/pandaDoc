import '@/lang/i18n';
import { useTranslation } from 'react-i18next';
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from '@/components/ThemedText';
import { useRoute } from '@react-navigation/native';
import { ScrollView, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import Drop from "@/components/Drop";
import { settingC } from '@/constants/file';
import { Routes } from '@/constants/navType';
export default function Setting() {
    const { t, i18n } = useTranslation();
    const nav = useNavigation();
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const forDoc = (useRoute().params as Routes['setting'])?.forDoc ?? false;

    const langs = [
        { label: 'English', value: 'en' },
        { label: 'Français', value: 'fr' },
        { label: '日本語', value: 'ja' },
        { label: 'മലയാളം', value: 'ml' },
        { label: 'ಕನ್ನಡ', value: 'kn' },
        { label: 'తెలుగు', value: 'te' },
        { label: 'தமிழ்', value: 'ta' },
    ];
    return (
        <ThemedView>
            <ThemedView style={styles.eventArea} darkColor="#151718">
                <TouchableOpacity onPress={nav.goBack} ><Ionicons name="arrow-back" size={28} color={borderColor} /></TouchableOpacity>
                <ThemedText style={{flex:0.8}} type="title">{t('setting')}</ThemedText>
            </ThemedView>
            <ScrollView >
                <TouchableOpacity>
                    <ThemedText></ThemedText>
                    <ThemedText></ThemedText>
                </TouchableOpacity>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={langs} value={settingC.getString('lang')} onChange={val=>{
                    i18n.changeLanguage(val);
                    settingC.set('lang',val);
                }} />
            </ThemedView>
            </ScrollView>
        </ThemedView>
    );
}

const styles=StyleSheet.create({
    eventArea:{ flexDirection:'row', position:'relative', padding:15, justifyContent:"flex-start", alignItems: 'center', },
    dropRoot:{ flexDirection:'row', justifyContent:'space-between', alignItems:'center' }
})
