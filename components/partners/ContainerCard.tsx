import { Box } from '@/components/ui/box';
import { Image, Text, TouchableOpacity, View } from 'react-native';

interface ContainerCardProps {
  containerNumber: string;
  status: 'Delivered' | 'Loading' | 'In Transit' | 'Pending';
  type: string;
  vessel: string;
  eta: string;
  customerName?: string;
  customerStatus?: 'Assigned' | 'Pending';
  shipmentCount: number;
  onViewDetails: () => void;
  onNotify?: () => void;
  onAssignCustomer?: () => void;
}

const StatusPill = ({ status }: { status: string }) => {
  let bg = 'bg-gray-100';
  let text = 'text-gray-800';

  switch (status) {
    case 'Delivered':
      bg = 'bg-green-100';
      text = 'text-green-800';
      break;
    case 'Loading':
      bg = 'bg-blue-100';
      text = 'text-blue-800';
      break;
    case 'In Transit':
      bg = 'bg-orange-100';
      text = 'text-orange-800';
      break;
    default:
      break;
  }

  return (
    <View className={`px-3 py-1 rounded-full ${bg}`}>
      <Text className={`text-xs font-medium ${text}`}>{status}</Text>
    </View>
  );
};

export const ContainerCard = ({
  containerNumber,
  status,
  type,
  vessel,
  eta,
  customerName,
  customerStatus,
  shipmentCount,
  onViewDetails,
  onNotify,
  onAssignCustomer,
}: ContainerCardProps) => {
  const isAssigned = !!customerName;

  return (
    <Box className="bg-white p-4 rounded-xl mb-4">
      {/* Header: Number & Status */}
      <View className="flex-row justify-between items-center mb-3">
        <Text className="text-lg font-bold text-gray-900">
          {containerNumber}
        </Text>
        <StatusPill status={status} />
      </View>

      {/* Type Info */}
      <View className="flex-row items-center mb-4">
        <Image
          source={require('@/assets/images/box-icon.png')}
          className="w-5 h-5 mr-2"
          resizeMode="contain"
        />
        <Text className="text-gray-600 font-medium">{type}</Text>
      </View>

      {/* Details Table */}
      <View className="mb-4 space-y-2">
        <View className="flex-row justify-between">
          <Text className="text-gray-500">Vessel</Text>
          <Text className="text-gray-900 font-medium">{vessel}</Text>
        </View>
        <View className="flex-row justify-between">
          <Text className="text-gray-500">ETA Ghana</Text>
          <Text className="text-gray-900 font-medium">{eta}</Text>
        </View>
        <View className="flex-row justify-between items-center mt-2">
          <Text className="text-gray-500">Customer</Text>
          <View className="flex-row items-center">
            {isAssigned ? (
              <>
                <Text className="text-gray-900 font-medium mr-2">
                  {customerName}
                </Text>
                <View className="bg-green-100 px-2 py-0.5 rounded-full">
                  <Text className="text-green-800 text-[10px] font-medium">
                    Assigned
                  </Text>
                </View>
              </>
            ) : (
              <Text className="text-gray-400 italic">Not assigned</Text>
            )}
          </View>
        </View>
      </View>

      {/* Shipment Count Box */}
      <View className="bg-gray-100 p-3 rounded-lg mb-4 items-center">
        <Text className="text-gray-700 font-medium">
          Shipments in container: {shipmentCount}
        </Text>
      </View>

      {/* Actions */}
      <View className="flex-row gap-3">
        <TouchableOpacity
          onPress={onViewDetails}
          className="flex-1 bg-[#1A293B] py-3 rounded-lg items-center">
          <Text className="text-white font-medium">View details</Text>
        </TouchableOpacity>

        {isAssigned ? (
          <TouchableOpacity
            onPress={onNotify}
            className="flex-1 border border-gray-300 py-3 rounded-lg items-center">
            <Text className="text-gray-700 font-medium">Notify</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            onPress={onAssignCustomer}
            className="flex-1 bg-primary-blue py-3 rounded-lg items-center border border-primary-blue">
            <Text className="text-white font-medium">Assign customer</Text>
          </TouchableOpacity>
        )}
      </View>
    </Box>
  );
};
