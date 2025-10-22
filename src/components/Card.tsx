import React from 'react';
import { View, Text, StyleSheet, Platform } from 'react-native';
import { FONTS } from '../constants';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

interface CardHeaderProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

interface CardContentProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

interface CardTitleProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

interface CardDescriptionProps {
  children: React.ReactNode;
  className?: string;
  style?: any;
}

const Card = ({ children, className, style }: CardProps) => {
  return (
    <View style={[styles.card, style]}>
      {children}
    </View>
  );
};

const CardHeader = ({ children, className, style }: CardHeaderProps) => {
  return (
    <View style={[styles.cardHeader, style]}>
      {children}
    </View>
  );
};

const CardContent = ({ children, className, style }: CardContentProps) => {
  return (
    <View style={[styles.cardContent, style]}>
      {children}
    </View>
  );
};

const CardTitle = ({ children, className, style }: CardTitleProps) => {
  return (
    <Text style={[styles.cardTitle, style]}>
      {children}
    </Text>
  );
};

const CardDescription = ({ children, className, style }: CardDescriptionProps) => {
  return (
    <Text style={[styles.cardDescription, style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12, // rounded-xl
    borderWidth: 1,
    borderColor: '#E5E7EB', // border-gray-200
    paddingVertical: 24, // py-6
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1, // shadow-sm
  },
  cardHeader: {
    paddingHorizontal: 24, // px-6
    paddingBottom: 24, // pb-6
    gap: 6, // gap-1.5
  },
  cardContent: {
    paddingHorizontal: 24, // px-6
  },
  cardTitle: {
    fontSize: 18,
    fontFamily: FONTS.semiBold,
    color: '#111827', // text-gray-900
    lineHeight: 24,
  },
  cardDescription: {
    fontSize: 14,
    fontFamily: FONTS.regular,
    color: '#6B7280', // text-muted-foreground
    lineHeight: 20,
  },
});

export { Card, CardHeader, CardContent, CardTitle, CardDescription };
