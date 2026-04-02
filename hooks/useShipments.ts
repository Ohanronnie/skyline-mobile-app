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
  deleteWarehouse,
  getCargo,
  getContainerDetails,
  getContainers,
  getCustomers,
  getDocuments,
  getPaginatedItems,
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
  PaginatedResponse,
  Partner,
  Customer,
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
  search?: string,
  options?: Partial<UseInfiniteQueryOptions<any, any, any, any>>,
) => {
  return useInfiniteQuery({
    queryKey: ["shipments", search],
    queryFn: ({ pageParam = 1 }) => getShipments(pageParam as number, 10, search),
    getNextPageParam: (lastPageData) => {
      const totalP = lastPageData?.totalPages;
      return lastPageData?.page < totalP ? lastPageData.page + 1 : undefined;
    },
    initialPageParam: 1,
    ...options,
  });
};

export const usePartnerShipments = (
  search?: string,
  options?: Partial<UseInfiniteQueryOptions<any, any, any, any>>,
) => {
  return useInfiniteQuery({
    queryKey: ["partner-shipments", search],
    queryFn: ({ pageParam = 1 }) =>
      getPartnerShipments(pageParam as number, 10, search),
    getNextPageParam: (lastPageData) => {
      const totalP = lastPageData?.totalPages;
      return lastPageData?.page < totalP ? lastPageData.page + 1 : undefined;
    },
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
    queryFn: () => getCustomers().then((res) => getPaginatedItems(res)).catch(() => []),
    ...options,
  });
};

export const useInfiniteCustomers = (search?: string) => {
  return useInfiniteQuery({
    queryKey: ["customers-infinite", search],
    queryFn: ({ pageParam = 1 }) =>
      getCustomers(pageParam as number, 20, search).then((res) => {
        if (Array.isArray(res)) {
          return {
            data: res,
            total: res.length,
            page: 1,
            limit: res.length,
            totalPages: 1,
          };
        }
        return res as PaginatedResponse<Customer>;
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
};

export const usePartnerCustomers = (
  options?: Partial<UseQueryOptions<any, any, any, any>>,
) => {
  return useQuery({
    queryKey: ["partner-customers"],
    queryFn: () =>
      getPartnerCustomers().then((res) => getPaginatedItems(res)).catch(() => []),
    ...options,
  });
};

export const useInfinitePartnerCustomers = (search?: string) => {
  return useInfiniteQuery({
    queryKey: ["partner-customers-infinite", search],
    queryFn: ({ pageParam = 1 }) =>
      getPartnerCustomers(pageParam as number, 20, search).then((res) => {
        if (Array.isArray(res)) {
          return {
            data: res,
            total: res.length,
            page: 1,
            limit: res.length,
            totalPages: 1,
          };
        }
        return res as PaginatedResponse<Customer>;
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
  });
};

export const useCreateCustomer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: any) => createCustomer(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["customers"] });
      queryClient.invalidateQueries({ queryKey: ["customers-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["partner-customers"] });
      queryClient.invalidateQueries({ queryKey: ["partner-customers-infinite"] });
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
      queryClient.invalidateQueries({ queryKey: ["customers-infinite"] });
      queryClient.invalidateQueries({ queryKey: ["partner-customers"] });
      queryClient.invalidateQueries({ queryKey: ["partner-customers-infinite"] });
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

export const useDeleteWarehouse = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteWarehouse(id),
    onSuccess: (_, id) => {
      queryClient.invalidateQueries({ queryKey: ["warehouses"] });
      queryClient.removeQueries({ queryKey: ["warehouse", id] });
    },
  });
};

export const useContainers = (
  search?: string,
  options?: Partial<UseInfiniteQueryOptions<any, any, any, any>>,
) => {
  return useInfiniteQuery({
    queryKey: ["containers", search],
    queryFn: ({ pageParam = 1 }) =>
      getContainers(pageParam as number, 10, true, search),
    getNextPageParam: (lastPageData: any) => {
      const totalP = lastPageData?.totalPages;
      return lastPageData?.page < totalP ? lastPageData.page + 1 : undefined;
    },
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

export const usePartnerContainers = (
  search?: string,
  options?: Partial<UseInfiniteQueryOptions<any, any, any, any>>,
) => {
  return useInfiniteQuery({
    queryKey: ["partner-containers", search],
    queryFn: ({ pageParam = 1 }) =>
      getPartnerContainers(pageParam as number, 10, search),
    getNextPageParam: (lastPageData: any) => {
      const totalP = lastPageData?.totalPages;
      return lastPageData?.page < totalP ? lastPageData.page + 1 : undefined;
    },
    initialPageParam: 1,
    ...options,
  });
};

export const usePartners = (
  options?: Partial<UseQueryOptions<any, any, any, any>>,
) => {
  return useQuery({
    queryKey: ["partners"],
    queryFn: () => getPartners().then(res => (Array.isArray(res) ? res : (res as any).data || [])),
    ...options,
  });
};

export const useInfinitePartners = (search?: string) => {
  return useInfiniteQuery({
    queryKey: ["partners-infinite", search],
    queryFn: ({ pageParam = 1 }) =>
      getPartners(pageParam as number, 20, search).then((res) => {
        if (Array.isArray(res)) {
          return {
            data: res,
            total: res.length,
            page: 1,
            limit: res.length,
            totalPages: 1,
          };
        }
        return res as PaginatedResponse<Partner>;
      }),
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
    initialPageParam: 1,
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
      queryClient.invalidateQueries({ queryKey: ["partner-shipments"] });
      queryClient.invalidateQueries({ queryKey: ["partner-home"] });
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
      queryClient.invalidateQueries({ queryKey: ["partner-containers"] });
      queryClient.invalidateQueries({ queryKey: ["partner-home"] });
      queryClient.invalidateQueries({ queryKey: ["all-containers"] });
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
      queryClient.invalidateQueries({ queryKey: ["all-containers"] });
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
      queryClient.invalidateQueries({ queryKey: ["all-containers"] });
    },
  });
};

export const useDeleteContainer = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteContainer(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["containers"] });
      queryClient.invalidateQueries({ queryKey: ["all-containers"] });
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
