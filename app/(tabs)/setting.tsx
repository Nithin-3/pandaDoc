import '@/lang/i18n';
import { useTranslation } from 'react-i18next';
import { ThemedView } from "@/components/ThemedView";
import { ThemedText } from '@/components/ThemedText';
import { useRoute } from '@react-navigation/native';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from 'expo-router';
import { useThemeColor } from '@/hooks/useThemeColor';
import Drop from "@/components/Drop";
export default function Setting() {
    const { t } = useTranslation();
    const route = useRoute();
    const nav = useNavigation();
    const borderColor=useThemeColor({light:undefined,dark:undefined},'text');
    const forDoc = (route.params as { forDoc?: boolean })?.forDoc ?? false;

    const options = [
  { label: 'Apple', value: 'apple' },
  { label: 'Banana', value: 'banana' },
  { label: 'Cherry', value: 'cherry' },
  { label: 'Date', value: 'date' },
  { label: 'Elderberry', value: 'elderberry' },
  { label: 'Fig', value: 'fig' },
  { label: 'Grape', value: 'grape' },
  { label: 'Honeydew', value: 'honeydew' },
  { label: 'Iced Tea', value: 'iced_tea' },
  { label: 'Jackfruit', value: 'jackfruit' },
  { label: 'Kiwi', value: 'kiwi' },
  { label: 'Lemon', value: 'lemon' },
  { label: 'Mango', value: 'mango' },
  { label: 'Nectarine', value: 'nectarine' },
  { label: 'Orange', value: 'orange' },
  { label: 'Papaya', value: 'papaya' },
  { label: 'Quince', value: 'quince' },
  { label: 'Raspberry', value: 'raspberry' },
  { label: 'Strawberry', value: 'strawberry' },
];
    return (
        <ThemedView>
            <ThemedView style={styles.eventArea} darkColor="#151718">
                <TouchableOpacity onPress={nav.goBack} ><Ionicons name="arrow-back" size={28} color={borderColor} /></TouchableOpacity>
                <ThemedText style={{flex:0.8}} type="title">{t('setting')}</ThemedText>
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
            <ThemedView style={styles.dropRoot}>
                <ThemedText>{t('lang')}</ThemedText>
                <Drop options={options} placeHolder='select lang' onChange={console.log} />
            </ThemedView>
        </ThemedView>
    );
}

const styles=StyleSheet.create({
    eventArea:{
        flexDirection:'row',
        position:'relative',
        padding:15,
        justifyContent:"flex-start",
        alignItems: 'center',
    },
    dropRoot:{
        flexDirection:'row',
        justifyContent:'space-between',
        alignItems:'center'
    }
})
