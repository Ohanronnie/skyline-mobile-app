import { Box } from '@/components/ui/box';
import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
    Keyboard,
    KeyboardAvoidingView,
    Modal,
    Platform,
    ScrollView,
    Text,
    TextInput,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from 'react-native';

interface CompanyInfoModalProps {
  isVisible: boolean;
  onClose: () => void;
  onSave: (data: any) => void;
  initialData?: any;
}

export const CompanyInfoModal = ({
  isVisible,
  onClose,
  onSave,
  initialData,
}: CompanyInfoModalProps) => {
  const [formData, setFormData] = useState({
    companyName: '',
    registrationNumber: '',
    email: '',
    phone: '',
    address: '',
  });

  useEffect(() => {
    if (isVisible && initialData) {
      setFormData({
        companyName: initialData.companyName || '',
        registrationNumber: initialData.registrationNumber || '',
        email: initialData.email || '',
        phone: initialData.phone || '',
        address: initialData.address || '',
      });
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
                  Company Information
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons name="close" size={24} color="#6B7280" />
                </TouchableOpacity>
              </View>

              <ScrollView
                className="flex-1"
                showsVerticalScrollIndicator={false}
                contentContainerClassName="pb-6">
                <View onStartShouldSetResponder={() => true}>
                  {/* Company Name */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Company Name
                    </Text>
                    <TextInput
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                      placeholder="Enter company name"
                      value={formData.companyName}
                      onChangeText={(text) => handleChange('companyName', text)}
                    />
                  </View>

                  {/* Business Registration Number */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Business Registration Number
                    </Text>
                    <TextInput
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                      placeholder="Enter registration number"
                      value={formData.registrationNumber}
                      onChangeText={(text) =>
                        handleChange('registrationNumber', text)
                      }
                    />
                  </View>

                  {/* Contact Email */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Contact Email
                    </Text>
                    <TextInput
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                      placeholder="Enter email address"
                      keyboardType="email-address"
                      value={formData.email}
                      onChangeText={(text) => handleChange('email', text)}
                    />
                  </View>

                  {/* Contact Phone */}
                  <View className="mb-4">
                    <Text className="text-gray-700 font-medium mb-2">
                      Contact Phone
                    </Text>
                    <TextInput
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                      placeholder="Enter phone number"
                      keyboardType="phone-pad"
                      value={formData.phone}
                      onChangeText={(text) => handleChange('phone', text)}
                    />
                  </View>

                  {/* Business Address */}
                  <View className="mb-6">
                    <Text className="text-gray-700 font-medium mb-2">
                      Business Address
                    </Text>
                    <TextInput
                      className="w-full border border-gray-300 rounded-xl px-4 py-3 text-gray-900"
                      placeholder="Enter business address"
                      value={formData.address}
                      onChangeText={(text) => handleChange('address', text)}
                    />
                  </View>
                </View>

                {/* Actions */}
                <View className="flex-row gap-4 mb-6">
                  <TouchableOpacity
                    onPress={onClose}
                    className="flex-1 py-4 rounded-xl border border-gray-300 items-center">
                    <Text className="text-gray-700 font-bold text-lg">
                      Cancel
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => onSave(formData)}
                    className="flex-1 py-4 rounded-xl bg-primary-blue items-center flex-row justify-center">
                    <Ionicons
                      name="save"
                      size={24}
                      color="white"
                      className="mr-2"
                    />
                    <Text className="text-white font-bold text-lg ml-2">
                      Save Changes
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
