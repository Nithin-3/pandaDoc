import React, { forwardRef, memo } from 'react';
import { TextInput, type TextInputProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedInputProps = TextInputProps & {
  lightColor?: string;
  darkColor?: string;
};

export const ThemedInput = memo(
    forwardRef<TextInput, ThemedInputProps>(({ style, lightColor, darkColor, ...rest }, ref) => {
        const color = useThemeColor({ light: lightColor, dark: darkColor }, 'text');
        return (
            <TextInput
                ref={ref}
                style={[{ color }, style]}
                placeholderTextColor="grey"
                {...rest} 
            />
        );
    })
);
