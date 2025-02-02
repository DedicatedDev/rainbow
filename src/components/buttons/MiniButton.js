import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { darkModeThemeColors, lightModeThemeColors } from '../../styles/colors';
import { ButtonPressAnimation } from '../animations';
import { RowWithMargins } from '../layout';
import { Text } from '../text';
import styled from '@rainbow-me/styled-components';
import { padding, position } from '@rainbow-me/styles';
import ShadowStack from 'react-native-shadow-stack';

const shadowsFactory = darkMode => ({
  default: [
    [
      0,
      4,
      12,
      darkMode ? darkModeThemeColors.shadow : lightModeThemeColors.appleBlue,
      0.4,
    ],
  ],
  disabled: [
    [
      0,
      4,
      12,
      darkMode ? darkModeThemeColors.lightGrey : lightModeThemeColors.lightGrey,
      darkMode ? 0 : 0.4,
    ],
  ],
  none: [[0, 0, 0, lightModeThemeColors.transparent, 0]],
});

const shadowLight = shadowsFactory(false);
const shadowsDark = shadowsFactory(true);

const Content = styled(RowWithMargins).attrs({
  align: 'center',
  margin: 5,
})(({ hasLeadingIcon, small }) => ({
  ...padding.object(0, small ? 8 : 10, 0, hasLeadingIcon ? 6 : small ? 8 : 10),
  borderRadius: 15,
  height: small ? 27 : 30,
  zIndex: 1,
}));

export default function MiniButton({
  backgroundColor,
  borderRadius = 15,
  children,
  color,
  disabled,
  hasLeadingIcon,
  height,
  hideShadow,
  letterSpacing,
  onPress,
  scaleTo = 0.82,
  small,
  weight,
  width,
  ...props
}) {
  const { isDarkMode, colors } = useTheme();

  const shadows = isDarkMode ? shadowsDark : shadowLight;

  return (
    <ButtonPressAnimation
      disabled={disabled}
      onPress={onPress}
      opacity={isDarkMode && disabled ? 0.6 : 1}
      radiusAndroid={borderRadius}
      scaleTo={scaleTo}
      {...props}
    >
      <View style={{ borderRadius }}>
        <ShadowStack
          {...position.coverAsObject}
          backgroundColor={
            android
              ? 'none'
              : disabled
              ? colors.lightGrey
              : backgroundColor || colors.appleBlue
          }
          borderRadius={borderRadius}
          height={height}
          shadows={
            hideShadow
              ? shadows.none
              : disabled
              ? shadows.disabled
              : shadows.default
          }
          width={width}
        />
        <Content
          backgroundColor={
            android
              ? disabled
                ? colors.lightGrey
                : backgroundColor || colors.appleBlue
              : 'none'
          }
          hasLeadingIcon={hasLeadingIcon}
          small={small}
        >
          {typeof children === 'string' ? (
            <Text
              align="center"
              color={color || colors.whiteLabel}
              letterSpacing={letterSpacing}
              lineHeight={android ? 19 : null}
              weight={weight || 'bold'}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </Content>
      </View>
    </ButtonPressAnimation>
  );
}
