import React from 'react';
import { View, TextInput, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { FONTS } from '../../constants';

interface StylistSearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
}

export default function StylistSearchBar({
  value,
  onChangeText,
  placeholder = 'Search...',
}: StylistSearchBarProps) {
  return (
    <View style={styles.searchContainer}>
      <View style={styles.searchIcon}>
        <Ionicons name="search" size={20} color="#999" />
      </View>
      <TextInput
        style={styles.searchInput}
        placeholder={placeholder}
        placeholderTextColor="#999"
        value={value}
        onChangeText={onChangeText}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    paddingHorizontal: 12,
    height: Platform.OS === 'web' ? 44 : 42,
    marginBottom: 16,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#160B53',
    fontFamily: FONTS.regular,
  },
});
