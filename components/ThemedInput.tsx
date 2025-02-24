import { TextInput, type TextInputProps, } from 'react-native';

import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
};

export function ThemedInput({style,lightColor,darkColor,...rest}: ThemedInputProps) {
  const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
  return (<TextInput style={[{ color },style,]} placeholderTextColor='grey' {...rest} />);
}


