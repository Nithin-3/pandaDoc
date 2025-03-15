import {Dimensions } from 'react-native';
import { ThemedView } from '@/components/ThemedView';
import Pdf from 'react-native-pdf';
import {useRoute} from "@react-navigation/native"
import { useThemeColor } from '@/hooks/useThemeColor';
type RouteParams = {uri:string}
const PDFViewer = () => {
    const { uri } = useRoute().params as RouteParams;
  const backgroundColor = useThemeColor({}, 'background');
  return (
    <ThemedView style={{ flex: 1 }}>
      <Pdf
        source={{ uri }}
        style={{ flex: 1,backgroundColor, width: Dimensions.get('window').width}}
      />
    </ThemedView>
  );
};

export default PDFViewer;

