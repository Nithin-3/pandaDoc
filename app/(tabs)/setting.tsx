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
import { lang } from '@/constants/file';
export default function Setting() {
    const { t, i18n } = useTranslation();
    const route = useRoute();
    const nav = useNavigation();
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const forDoc = (route.params as { forDoc?: boolean })?.forDoc ?? false;

    const langs = [
        { label: 'English', value: 'en' },
        { label: 'தமிழ்', value: 'ta' },
        { label: 'മലയാളം', value: 'ml' },
    ];
    return (
        <ThemedView>
            <ThemedView style={styles.eventArea} darkColor="#151718">
                <TouchableOpacity onPress={nav.goBack} ><Ionicons name="arrow-back" size={28} color={borderColor} /></TouchableOpacity>
                <ThemedText style={{flex:0.8}} type="title">{t('setting')}</ThemedText>
            </ThemedView>
            <ScrollView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={langs} value={lang.getString('lang')} onChange={val=>{
                    i18n.changeLanguage(val);
                    lang.set('lang',val);
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
