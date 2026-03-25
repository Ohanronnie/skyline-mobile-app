import { Box } from '@/components/ui/box';
import React from 'react';
import { Image, ImageSourcePropType, Text } from 'react-native';

interface StatCardProps {
  icon: ImageSourcePropType;
  count: string | number;
  label: string;
}

export const StatCard = ({ icon, count, label }: StatCardProps) => {
  return (
    <Box className="bg-white p-4 rounded-xl w-[48%] mb-4 items-start">
      <Image source={icon} className="w-8 h-8 mb-3" resizeMode="contain" />
      <Text className="text-2xl font-bold text-gray-900 mb-1">{count}</Text>
      <Text className="text-sm text-gray-500">{label}</Text>
    </Box>
  );
};
