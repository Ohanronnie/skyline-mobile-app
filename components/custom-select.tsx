import { Ionicons } from "@expo/vector-icons";
import { useEffect, useRef, useState } from "react";
import { Pressable, ScrollView, Text, View } from "react-native";

interface Option {
  label: string;
  value: string;
}

interface CustomSelectProps {
  options: Option[];
  selectedValue?: string;
  onValueChange?: (value: string) => void;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
  direction?: "up" | "down";
  variant?: "outline" | "filled";
}

export function CustomSelect({
  options,
  selectedValue,
  onValueChange,
  placeholder = "Select...",
  className = "",
  disabled = false,
  direction = "down",
  variant = "outline",
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<View>(null);

  const selectedOption = options.find((opt) => opt.value === selectedValue);

  const handleSelect = (value: string) => {
    if (onValueChange) {
      onValueChange(value);
    }
    setIsOpen(false);
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    if (!isOpen) return;

    const handlePressOutside = () => {
      setIsOpen(false);
    };

    // Use a small timeout to avoid closing immediately when opening
    const timeout = setTimeout(() => {
      // This will be handled by the backdrop pressable
    }, 100);

    return () => clearTimeout(timeout);
  }, [isOpen]);

  return (
    <View className={`relative ${className}`} ref={dropdownRef}>
      <Pressable
        onPress={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        android_ripple={disabled ? null : { color: "rgba(0,0,0,0.1)" }}
        className={`rounded-xl border h-11 px-3 flex-row items-center justify-between ${
          disabled
            ? "bg-gray-100 border-gray-200"
            : variant === "filled"
            ? "bg-gray-100 border-gray-200"
            : "bg-white border-gray-200"
        }`}>
        <Text
          className={`flex-1 text-base ${
            disabled
              ? "text-gray-500"
              : selectedOption
              ? "text-gray-900"
              : "text-gray-500"
          }`}
          numberOfLines={1}>
          {selectedOption ? selectedOption.label : placeholder}
        </Text>
        {!disabled && (
          <Ionicons
            name={isOpen ? "chevron-up" : "chevron-down"}
            size={20}
            color="#666"
            style={{ marginLeft: 8 }}
          />
        )}
      </Pressable>

      {isOpen && (
        <>
          {/* Backdrop to close on outside click */}
          <Pressable
            style={{
              position: "absolute",
              top: -1000,
              left: -1000,
              right: -1000,
              bottom: -1000,
              zIndex: 998,
            }}
            onPress={() => setIsOpen(false)}
          />

          {/* Dropdown */}
          <View
            className={`absolute left-0 right-0 bg-white border border-gray-200 rounded-xl shadow-lg overflow-hidden ${
              direction === "up" ? "bottom-full mb-1" : "top-full mt-1"
            }`}
            style={{ zIndex: 999, elevation: 1000, maxHeight: 200 }}>
            <ScrollView
              nestedScrollEnabled={true}
              showsVerticalScrollIndicator={true}
              style={{ maxHeight: 200 }}
              bounces={false}>
              {options.map((option, index) => (
                <Pressable
                  key={option.value}
                  onPress={() => handleSelect(option.value)}
                  android_ripple={{ color: "rgba(0,0,0,0.1)" }}
                  className={`px-4 py-3 ${
                    index < options.length - 1 ? "border-b border-gray-100" : ""
                  } ${
                    selectedValue === option.value
                      ? "bg-blue-50"
                      : "bg-white active:bg-gray-50"
                  }`}>
                  <Text
                    className={`text-base ${
                      selectedValue === option.value
                        ? "text-[#1A293B] font-medium"
                        : "text-gray-900"
                    }`}>
                    {option.label}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </>
      )}
    </View>
  );
}
