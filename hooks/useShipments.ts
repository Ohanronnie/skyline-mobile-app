import {
  assignCustomerToContainer,
  AssignCustomerToContainerDto,
  assignCustomerToShipment,
  AssignCustomerToShipmentDto,
  createContainer,
  createCustomer,
  createPartner,
  createShipment,
  CreateShipmentDto,
  createUser,
  createWarehouse,
  deleteContainer,
  deleteCustomer,
  deleteShipment,
  deleteUser,
  getCargo,
  getContainerDetails,
  getContainers,
  getCustomers,
  getDocuments,
  getPartnerContainers,
  getPartnerCustomers,
  getPartners,
  getPartnerShipments,
  getShipmentDetails,
  getShipments,
  getSMSTemplates,
  getTrackingSummary,
  getUsers,
  getWarehouses,
  updateContainer,
  updateCustomer,
  UpdatePartnerDto,
  updatePartnerProfile,
  updateShipment,
  updateSMSTemplate,
  UpdateSMSTemplateDto,
  updateWarehouse,
} from "@/lib/api";
import {
  useInfiniteQuery,
  UseInfiniteQueryOptions,
  useMutation,
  useQuery,
  useQueryClient,
  UseQueryOptions,
} from "@tanstack/react-query";

export const useShipments = (
  options?: Partial<UseInfiniteQueryOptions<any, any, any, any>>,
) => {
  return useInfiniteQuery({
    queryKey: ["shipments"],
    queryFn: ({ pageParam = 1 }) => getShipments(pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.lastPage ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    ...options,
  });
};

export const useShipmentDetails = (id: string) => {
  return useQuery({
    queryKey: ["shipment", id],
    queryFn: () => getShipmentDetails(id),
    enabled: !!id,
  });
};

export const useCustomers = (
  options?: Partial<UseQueryOptions<any, any, any, any>>,
) => {
  return useQuery({
    queryKey: ["customers"],
    queryFn: getCustomers,
    ...options,
  });
};

export const usePartnerCustomers = () => {
  return useQuery({
    queryKey: ["partner-customers"],
    queryFn: getPartnerCustomers,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["partner-customers"] });
    },
  });
};

export const useUpdateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateCustomer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["partner-customers"] });
    },
  });
};

export const useDeleteShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteShipment(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["partner-shipments"] });
    },
  });
};

export const useDeleteCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteCustomer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["partner-customers"] });
    },
  });
};

export const useWarehouses = (
  options?: Partial<UseQueryOptions<any, any, any, any>>,
) => {
  return useQuery({
    queryKey: ["warehouses"],
    queryFn: getWarehouses,
    ...options,
  });
};

export const useCreateWarehouse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => createWarehouse(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
};

export const useUpdateWarehouse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) => {
      return updateWarehouse(id, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
    },
  });
};

export const useContainers = (
  options?: Partial<UseInfiniteQueryOptions<any, any, any, any>>,
) => {
  return useInfiniteQuery({
    queryKey: ["containers"],
    queryFn: ({ pageParam = 1 }) => getContainers(pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage?.page < lastPage?.lastPage ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
    ...options,
  });
};

export const useAllContainers = (
  options?: Partial<UseQueryOptions<any, any, any, any>>,
) => {
  return useQuery({
    queryKey: ["all-containers"],
    queryFn: async () => {
      console.log("[useAllContainers] Fetching containers...");
      try {
        const response = await getContainers(1, 100, true);
        console.log("[useAllContainers] Response type:", typeof response);
        console.log(
          "[useAllContainers] Response keys:",
          response ? Object.keys(response) : "none",
        );
        console.log("[useAllContainers] Is array:", Array.isArray(response));
        console.log(
          "[useAllContainers] Response data length:",
          Array.isArray(response) ? response.length : response?.data?.length,
        );
        const data = Array.isArray(response) ? response : response?.data || [];
        console.log("[useAllContainers] Returning data length:", data.length);
        return data;
      } catch (error) {
        console.error("[useAllContainers] Error fetching containers:", error);
        throw error;
      }
    },
    ...options,
  });
};

export const useContainerDetails = (id: string) => {
  return useQuery({
    queryKey: ["container", id],
    queryFn: () => getContainerDetails(id),
    enabled: !!id,
  });
};

export const useCargo = () => {
  return useQuery({
    queryKey: ["cargo"],
    queryFn: getCargo,
  });
};

export const usePartnerContainers = () => {
  return useInfiniteQuery({
    queryKey: ["partner-containers"],
    queryFn: ({ pageParam = 1 }) => getPartnerContainers(pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.lastPage ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
};

export const usePartners = (
  options?: Partial<UseQueryOptions<any, any, any, any>>,
) => {
  return useQuery({
    queryKey: ["partners"],
    queryFn: getPartners,
    ...options,
  });
};

export const useUpdatePartnerProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdatePartnerDto) => updatePartnerProfile(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["partner-home"] });
      queryClient.invalidateQueries({ queryKey: ["user"] });
    },
  });
};

export const useSMSTemplates = () => {
  return useQuery({
    queryKey: ["sms-templates"],
    queryFn: getSMSTemplates,
  });
};

export const useUpdateSMSTemplate = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateSMSTemplateDto }) =>
      updateSMSTemplate(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sms-templates"] });
    },
  });
};

export const usePartnerShipments = () => {
  return useInfiniteQuery({
    queryKey: ["partner-shipments"],
    queryFn: ({ pageParam = 1 }) => getPartnerShipments(pageParam as number),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.lastPage ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
};

export const useCreatePartner = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createPartner,
    onSuccess: () => {
      // Refetch partners so UI reflects the newly created partner
      queryClient.invalidateQueries({ queryKey: ["partners"] });
    },
  });
};

export const useCreateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateShipmentDto) => createShipment(data),
    onSuccess: () => {
      // Invalidate shipments query to refetch data
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
};

export const useUpdateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateShipmentDto>;
    }) => updateShipment(id, data),
    onSuccess: () => {
      // Invalidate shipments query to refetch data
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
    },
  });
};

export const useAssignCustomerToShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      shipmentId,
      data,
    }: {
      shipmentId: string;
      data: AssignCustomerToShipmentDto;
    }) => assignCustomerToShipment(shipmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shipments"] });
      queryClient.invalidateQueries({ queryKey: ["shipment"] });
    },
  });
};

export const useAssignCustomerToContainer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({
      containerId,
      data,
    }: {
      containerId: string;
      data: AssignCustomerToContainerDto;
    }) => assignCustomerToContainer(containerId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["containers"] });
      queryClient.invalidateQueries({ queryKey: ["container"] });
    },
  });
};

export const useCreateContainer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => createContainer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["containers"] });
    },
  });
};

export const useUpdateContainer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      updateContainer(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["containers"] });
    },
  });
};

export const useDeleteContainer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["containers"] });
    },
  });
};

export const useDocuments = () => {
  return useQuery({
    queryKey: ["documents"],
    queryFn: getDocuments,
  });
};

// Users / Staff
export const useUsers = () => {
  return useQuery({
    queryKey: ["users"],
    queryFn: getUsers,
  });
};

export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => createUser(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useDeleteUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteUser(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["users"] });
    },
  });
};

export const useTrackingSummary = () => {
  return useQuery({
    queryKey: ["tracking-summary"],
    queryFn: getTrackingSummary,
  });
};
