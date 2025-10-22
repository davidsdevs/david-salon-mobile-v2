import React from 'react';
import { Text, StyleSheet, Platform, TextStyle } from 'react-native';
import { FONTS } from '../../constants';

interface StylistPageTitleProps {
  title: string;
  style?: TextStyle;
}

export default function StylistPageTitle({ title, style }: StylistPageTitleProps) {
  return <Text style={[styles.pageTitle, style]}>{title}</Text>;
}

const styles = StyleSheet.create({
  pageTitle: {
    fontSize: Platform.OS === 'web' ? 25 : 18,
    color: '#160B53',
    fontFamily: FONTS.bold,
    marginBottom: 8,
  },
});
