import {useRoute} from "@react-navigation/native"
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
type RouteParams = {uri:string}
const DocViewer = () => {
    const { uri } = useRoute().params as RouteParams;
  return (
    <ThemedView style={{ flex: 1 }}>
            <ThemedText> not build yet for this file type </ThemedText>
    </ThemedView>
  );
};

export default DocViewer;

