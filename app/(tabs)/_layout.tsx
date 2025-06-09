import {Stack} from 'expo-router';

export default function TabLayout() {

  return (
        <Stack >
            <Stack.Screen name="index" />
            <Stack.Screen name="pdf" />
            <Stack.Screen name="doc" />
            <Stack.Screen name='list' />
            <Stack.Screen name='chating' />
            <Stack.Screen name='call' />
        </Stack>
  );
}
