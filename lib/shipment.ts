import { ShipmentStatus } from "./api";

export const getShipmentProgressPercentage = (status: ShipmentStatus): string => {
  const steps: ShipmentStatus[] = [
    ShipmentStatus.RECEIVED,
    ShipmentStatus.INSPECTED,
    ShipmentStatus.LOADED,
    ShipmentStatus.IN_TRANSIT,
    ShipmentStatus.ARRIVED_GHANA,
    ShipmentStatus.DELIVERED,
  ];

  // Map extended statuses to base steps
  const statusMapping: Record<string, ShipmentStatus> = {
    [ShipmentStatus.RECEIVED_CHINA]: ShipmentStatus.RECEIVED,
    [ShipmentStatus.LOADED_CHINA]: ShipmentStatus.LOADED,
    [ShipmentStatus.RECEIVED_ACCRA]: ShipmentStatus.ARRIVED_GHANA,
    [ShipmentStatus.DELIVERED_ACCRA]: ShipmentStatus.DELIVERED,
    [ShipmentStatus.DISPATCHED_KUMASI]: ShipmentStatus.IN_TRANSIT,
    [ShipmentStatus.RECEIVED_KUMASI]: ShipmentStatus.ARRIVED_GHANA,
    [ShipmentStatus.DELIVERED_KUMASI]: ShipmentStatus.DELIVERED,
    [ShipmentStatus.DISPATCHED_NKORANZA]: ShipmentStatus.IN_TRANSIT,
    [ShipmentStatus.RECEIVED_NKORANZA]: ShipmentStatus.ARRIVED_GHANA,
    [ShipmentStatus.DELIVERED_NKORANZA]: ShipmentStatus.DELIVERED,
  };

  const baseStatus = statusMapping[status] || status;
  const index = steps.indexOf(baseStatus);
  
  if (index === -1) return "10%";
  
  const percentage = ((index + 1) / steps.length) * 100;
  return `${Math.round(percentage)}%`;
};

export const getShipmentStatusColor = (status: ShipmentStatus): string => {
  switch (status) {
    case ShipmentStatus.DELIVERED:
    case ShipmentStatus.DELIVERED_ACCRA:
    case ShipmentStatus.DELIVERED_KUMASI:
    case ShipmentStatus.DELIVERED_NKORANZA:
      return "bg-green-500";
    case ShipmentStatus.ARRIVED_GHANA:
    case ShipmentStatus.RECEIVED_ACCRA:
    case ShipmentStatus.RECEIVED_KUMASI:
    case ShipmentStatus.RECEIVED_NKORANZA:
      return "bg-blue-500";
    case ShipmentStatus.IN_TRANSIT:
    case ShipmentStatus.DISPATCHED_KUMASI:
    case ShipmentStatus.DISPATCHED_NKORANZA:
      return "bg-primary-blue";
    case ShipmentStatus.LOADED:
    case ShipmentStatus.LOADED_CHINA:
      return "bg-yellow-500";
    default:
      return "bg-gray-400";
  }
};
