import React, { useState } from 'react';
import { View, Text, Pressable, Platform } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

interface DatePickerFieldProps {
  label: string;
  value: string; // YYYY-MM-DD string
  onChange: (value: string) => void;
  error?: string;
  placeholder?: string;
}

export function DatePickerField({
  label,
  value,
  onChange,
  error,
  placeholder = 'Select date',
}: DatePickerFieldProps) {
  const [show, setShow] = useState(false);

  // Convert YYYY-MM-DD string to Date object for the picker
  const getDateObject = (dateString: string) => {
    if (!dateString) return new Date();
    const [year, month, day] = dateString.split('-').map(Number);
    return new Date(year, month - 1, day);
  };

  // Convert Date object to YYYY-MM-DD string for the API
  const formatDateString = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    // On Android, the picker closes itself after selection
    if (Platform.OS === 'android') {
      setShow(false);
    }

    if (selectedDate) {
      onChange(formatDateString(selectedDate));
    }
  };

  const currentDate = getDateObject(value);

  return (
    <View className="mb-4">
      <Text className="text-gray-700 font-medium mb-2">{label}</Text>
      
      <Pressable
        onPress={() => setShow(true)}
        className={`flex-row items-center justify-between px-4 h-12 bg-white rounded-xl border ${
          error ? 'border-red-500' : 'border-gray-200'
        }`}
      >
        <Text className={value ? 'text-gray-900' : 'text-gray-400'}>
          {value || placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color="#9CA3AF" />
      </Pressable>

      {error && (
        <Text className="text-red-500 text-sm mt-1">{error}</Text>
      )}

      {show && (
        <>
          {Platform.OS === 'ios' ? (
            // iOS implementation (modal or inline)
            // For simplicity and matching common patterns, we use a Modal for iOS if needed or inline with a Close button
            <View className="bg-white rounded-xl mt-2 border border-gray-100 p-2">
               <DateTimePicker
                value={currentDate}
                mode="date"
                display="spinner"
                onChange={handleDateChange}
              />
              <Pressable 
                onPress={() => {
                  if (!value) {
                    onChange(formatDateString(currentDate));
                  }
                  setShow(false);
                }}
                className="bg-primary-blue py-2 rounded-lg items-center mt-2"
              >
                <Text className="text-white font-bold">Done</Text>
              </Pressable>
            </View>
          ) : (
            // Android implementation
            <DateTimePicker
              value={currentDate}
              mode="date"
              display="default"
              onChange={handleDateChange}
            />
          )}
        </>
      )}
    </View>
  );
}
