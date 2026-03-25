import { Box } from '@/components/ui/box';
import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Keyboard, KeyboardAvoidingView, Modal, Platform, ScrollView, Text, TextInput, TouchableOpacity, TouchableWithoutFeedback, View } from 'react-native';

import { useEffect } from 'react';

interface AddCustomerModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export const AddCustomerModal = ({
  isVisible,
  onClose,
  onSave,
  initialData,
}: AddCustomerModalProps) => {
  const [formData, setFormData] = useState({
    name: '',
    type: '',
    location: '',
    email: '',
    phone: '',
    address: '',
    paymentTerms: '',
    notes: '',
  });

  useEffect(() => {
    if (isVisible) {
      if (initialData) {
        setFormData({
          name: initialData.name || '',
          type: initialData.type || '',
          location: initialData.location || '',
          email: initialData.email || '',
          phone: initialData.phone || '',
          address: initialData.address || '',
          paymentTerms: initialData.paymentTerms || '',
          notes: initialData.notes || '',
        });
      } else {
        setFormData({
          name: '',
          type: '',
          location: '',
          email: '',
          phone: '',
          address: '',
          paymentTerms: '',
          notes: '',
        });
      }
    }
  }, [isVisible, initialData]);

  const handleChange = (key: string, value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1 justify-end bg-black/50">
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <Box className="bg-white rounded-t-3xl h-[85%]">
            <View className="p-6 flex-1">
              {/* Header */}
              <View className="flex-row justify-between items-center mb-6">
                <Text className="text-xl font-bold text-gray-900">
                  {initialData ? 'Edit customer' : 'Add new customer'}
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-6">
                {/* Form */}
                <View onStartShouldSetResponder={() => true}>
                  {/* Customer Name */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Customer name
                    </Text>
                    <TextInput
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                      placeholder="Enter full name"
                      value={formData.name}
                      onChangeText={(text) => handleChange('name', text)}
                    />
                  </View>

                  {/* Type & Location */}
                  <View className="flex-row gap-4 mb-4">
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">Type</Text>
                      <TextInput
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                        placeholder="Type"
                        value={formData.type}
                        onChangeText={(text) => handleChange('type', text)}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Location
                      </Text>
                      <TextInput
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                        placeholder="Location"
                        value={formData.location}
                        onChangeText={(text) => handleChange('location', text)}
                      />
                    </View>
                  </View>

                  {/* Email & Phone */}
                  <View className="flex-row gap-4 mb-4">
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">Email</Text>
                      <TextInput
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                        placeholder="Email"
                        keyboardType="email-address"
                        value={formData.email}
                        onChangeText={(text) => handleChange('email', text)}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">Phone</Text>
                      <TextInput
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                        placeholder="Phone"
                        keyboardType="phone-pad"
                        value={formData.phone}
                        onChangeText={(text) => handleChange('phone', text)}
                      />
                    </View>
                  </View>

                  {/* Address & Payment Terms */}
                  <View className="flex-row gap-4 mb-4">
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Address
                      </Text>
                      <TextInput
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                        placeholder="Address"
                        value={formData.address}
                        onChangeText={(text) => handleChange('address', text)}
                      />
                    </View>
                    <View className="flex-1">
                      <Text className="text-gray-700 font-medium mb-2">
                        Payment terms
                      </Text>
                      <TextInput
                        className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                        placeholder="Terms"
                        value={formData.paymentTerms}
                        onChangeText={(text) => handleChange('paymentTerms', text)}
                      />
                    </View>
                  </View>

                  {/* Notes */}
                  <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2">Notes</Text>
                    <TextInput
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900 h-24"
                      placeholder="Add notes..."
                      multiline
                      textAlignVertical="top"
                      value={formData.notes}
                      onChangeText={(text) => handleChange('notes', text)}
                    />
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row gap-4 mb-6">
                  <TouchableOpacity
                    onPress={onClose}
                    className="flex-1 py-4 rounded-xl border border-gray-300 items-center">
                    <Text className="text-gray-700 font-bold text-lg">Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onSave(formData)}
                    className="flex-1 py-4 rounded-xl bg-primary-blue items-center flex-row justify-center">
                    <Ionicons
                      name={initialData ? 'save' : 'add'}
                      size={24}
                      color="white"
                      className="mr-2"
                    />
                    <Text className="text-white font-bold text-lg ml-2">
                      {initialData ? 'Update customer' : 'Save customer'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          </Box>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};
