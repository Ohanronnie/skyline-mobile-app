import { Text, TouchableOpacity, View } from 'react-native';

interface ActivityItemProps {
  containerNumber: string;
  date: string;
  customerName: string;
  status: 'Assigned' | 'Pending assignment';
  isLast?: boolean;
}

const StatusPill = ({ status }: { status: ActivityItemProps['status'] }) => {
  const isAssigned = status === 'Assigned';
  return (
    <View
      className={`px-3 py-1 rounded-full ${
        isAssigned ? 'bg-green-100' : 'bg-yellow-100'
      }`}>
      <Text
        className={`text-xs font-medium ${
          isAssigned ? 'text-green-800' : 'text-yellow-800'
        }`}>
        {status}
      </Text>
    </View>
  );
};

export const RecentActivityItem = ({
  containerNumber,
  date,
  customerName,
  status,
  isLast,
}: ActivityItemProps) => {
  return (
    <View>
      <View className="py-4">
        <View className="flex-row justify-between items-start mb-2">
          <View>
            <Text className="font-bold text-gray-900 text-base">
              {containerNumber}
            </Text>
            <Text className="text-gray-900 font-medium mt-1">{customerName}</Text>
          </View>
          <Text className="text-gray-500 text-xs">{date}</Text>
        </View>

        <View className="flex-row justify-between items-center mt-2">
          <StatusPill status={status} />
          <TouchableOpacity className="bg-gray-100 px-4 py-1.5 rounded-full">
            <Text className="text-gray-700 text-xs font-medium">View</Text>
          </TouchableOpacity>
        </View>
      </View>
      {!isLast && <View className="h-[1px] bg-gray-100 w-full" />}
    </View>
  );
};
