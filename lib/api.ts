import axios from "axios";
import * as SecureStore from "expo-secure-store";

/** Public API origin — use everywhere file URLs or downloads must match the authenticated API. */
export const API_BASE_URL = __DEV__ ? "http://localhost:3000/api" : "https://api.skyinventories.com/api";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// Public API instance without auth interceptors for unauthenticated endpoints
const publicApi = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

const ACCESS_TOKEN_KEY = "access_token";
const REFRESH_TOKEN_KEY = "refresh_token";
const USER_TYPE_KEY = "user_type";
const ORIGINAL_ACCESS_TOKEN_KEY = "original_access_token";
const ORIGINAL_REFRESH_TOKEN_KEY = "original_refresh_token";
const ORIGINAL_USER_TYPE_KEY = "original_user_type";
const IMPERSONATING_PARTNER_ID_KEY = "impersonating_partner_id";

export const setTokens = async (
  accessToken: string,
  refreshToken: string,
  userType?: "customer" | "admin" | "partner",
) => {
  console.log("[auth] setTokens", {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    userType,
  });
  await SecureStore.setItemAsync(ACCESS_TOKEN_KEY, accessToken);
  await SecureStore.setItemAsync(REFRESH_TOKEN_KEY, refreshToken);
  if (userType) {
    await SecureStore.setItemAsync(USER_TYPE_KEY, userType);
  }
};

export const getAccessToken = async () => {
  const token = await SecureStore.getItemAsync(ACCESS_TOKEN_KEY);
  console.log("[auth] getAccessToken", token ? "token-present" : "no-token");
  return token;
};

export const getRefreshToken = async () => {
  return await SecureStore.getItemAsync(REFRESH_TOKEN_KEY);
};

export const getUserType = async () => {
  return await SecureStore.getItemAsync(USER_TYPE_KEY);
};

export const clearTokens = async () => {
  console.log("[auth] clearing tokens");
  await SecureStore.deleteItemAsync(ACCESS_TOKEN_KEY);
  await SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_TYPE_KEY);
  // Also clear impersonation tokens if they exist
  await SecureStore.deleteItemAsync(ORIGINAL_ACCESS_TOKEN_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(ORIGINAL_REFRESH_TOKEN_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(ORIGINAL_USER_TYPE_KEY).catch(() => {});
  await SecureStore.deleteItemAsync(IMPERSONATING_PARTNER_ID_KEY).catch(
    () => {},
  );
};

// Request interceptor to add Bearer token
api.interceptors.request.use(
  async (config) => {
    const token = await getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log("[api] attaching token to", config.url);
    } else {
      console.log("[api] no token for", config.url);
    }
    return config;
  },
  (error) => Promise.reject(error),
);

// Response interceptor for refresh token logic
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't retried yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = await getRefreshToken();
        if (!refreshToken) {
          console.log("[auth] no refresh token");
          // No refresh token: treat as logged out, clear tokens and reject original error
          await clearTokens();
          return Promise.reject(error);
        }

        // Attempt to refresh token
        // We use a separate axios instance or the base axios to avoid interceptor loops if this fails,
        // but since we are checking _retry, it should be fine.
        // Using raw axios to avoid attaching the old access token if possible, though it doesn't hurt.
        const response = await axios.post(
          `${API_BASE_URL}/auth/refresh`,
          {},
          {
            headers: {
              Authorization: `Bearer ${refreshToken}`,
            },
          },
        );

        const { accessToken: newAccessToken, refreshToken: newRefreshToken } =
          response.data;

        await setTokens(newAccessToken, newRefreshToken || refreshToken);

        // Update header and retry original request
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        console.log(
          "[auth] refresh token failed",
          JSON.stringify(refreshError, null, 2),
        );
        // Refresh failed - clear tokens and reject
        await clearTokens();
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

// Helper function to make GET requests and return data
async function fetcher<T>(endpoint: string, params?: any): Promise<T> {
  const response = await api.get<T>(endpoint, { params });
  return response.data;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  agentsCount: number;
}

// Shipments
export enum ShipmentStatus {
  RECEIVED = "received",
  INSPECTED = "inspected",
  LOADED = "loaded",
  IN_TRANSIT = "in_transit",
  ARRIVED_GHANA = "arrived_ghana",
  DELIVERED = "delivered",
  // Extended granular statuses by location (non-breaking additions)
  RECEIVED_CHINA = "received_china",
  LOADED_CHINA = "loaded_china",
  RECEIVED_ACCRA = "received_accra",
  DELIVERED_ACCRA = "delivered_accra",
  DISPATCHED_KUMASI = "dispatched_kumasi",
  RECEIVED_KUMASI = "received_kumasi",
  DELIVERED_KUMASI = "delivered_kumasi",
  DISPATCHED_NKORANZA = "dispatched_nkoranza",
  RECEIVED_NKORANZA = "received_nkoranza",
  DELIVERED_NKORANZA = "delivered_nkoranza",
}

export interface CreateShipmentDto {
  trackingNumber: string;
  customerId?: string;
  customerIds?: string[];
  partnerId?: string;
  partnerIds?: string[];
  partnerCustomerId?: string;
  description?: string;
  cbm?: number;
  quantity?: number;
  receivedQuantity?: number;
  status?: ShipmentStatus;
  originWarehouseId?: string;
  currentWarehouseId?: string;
  containerId?: string;
}

export enum Organization {
  SKYLINE = "skyline",
  PARTNER = "partner",
}

export interface Shipment {
  _id: string;
  organization: Organization;
  trackingNumber: string;
  customerId?:
    | string
    | {
        name: string;
        phone?: string;
        email?: string;
        location?: string;
        _id: string;
      };
  customerIds?: (
    | string
    | {
        name: string;
        phone?: string;
        email?: string;
        location?: string;
        _id: string;
      }
  )[];
  partnerId?:
    | string
    | {
        name: string;
        phone?: string;
        email?: string;
        _id: string;
      };
  partnerIds?: (
    | string
    | {
        name: string;
        phone?: string;
        email?: string;
        _id: string;
      }
  )[];
  partnerCustomerId?: string | Customer;
  description?: string;
  cbm?: number;
  quantity?: number;
  receivedQuantity?: number;
  status: ShipmentStatus;
  originWarehouseId?: string;
  currentWarehouseId?: string;
  containerId?: string | { containerNumber: string; _id: string };
  receivedAt?: string;
  deliveredAt?: string;
  createdAt: string;
}

export const getShipments = (
  page: number = 1,
  limit: number = 10,
  search?: string,
) =>
  fetcher<PaginatedResponse<Shipment>>("/shipments", {
    page,
    limit,
    paginate: true,
    search,
  });
export const getPartnerShipments = (
  page: number = 1,
  limit: number = 10,
  search?: string,
) =>
  fetcher<PaginatedResponse<Shipment>>("/shipments", {
    page,
    limit,
    paginate: true,
    search,
  });

export const getShipmentDetails = (id: string) =>
  fetcher<any>(`/shipments/${id}`);
export const getShipmentTimeline = (id: string) =>
  fetcher<any>(`/shipments/${id}/timeline`);
export const getShipmentTracking = (id: string) =>
  fetcher<any>(`/shipments/${id}/tracking`);
export const createShipment = (data: CreateShipmentDto) =>
  api.post("/shipments", data).then((res) => res.data);
export const updateShipment = (id: string, data: Partial<CreateShipmentDto>) =>
  api.put(`/shipments/${id}`, data).then((res) => res.data);
export const deleteShipment = (id: string) =>
  api.delete(`/shipments/${id}`).then((res) => res.data);

export interface AssignCustomerToShipmentDto {
  trackingNumber: string;
  customerId: string;
}

export const assignCustomerToShipment = (
  shipmentId: string,
  data: AssignCustomerToShipmentDto,
) => api.put(`/shipments/${shipmentId}`, data).then((res) => res.data);

// Customers
export enum CustomerType {
  AGENT = "agent",
  CLIENT = "client",
}

export enum CustomerLocation {
  // International
  CHINA = "china",
  // Ghana Regions
  GREATER_ACCRA = "greater_accra",
  ASHANTI = "ashanti",
  WESTERN = "western",
  CENTRAL = "central",
  EASTERN = "eastern",
  VOLTA = "volta",
  OTI = "oti",
  NORTHERN = "northern",
  SAVANNAH = "savannah",
  NORTH_EAST = "north_east",
  UPPER_EAST = "upper_east",
  UPPER_WEST = "upper_west",
  BONO = "bono",
  BONO_EAST = "bono_east",
  AHAFO = "ahafo",
  WESTERN_NORTH = "western_north",
}

export interface Customer {
  _id: string;
  organization: Organization;
  name: string;
  type: CustomerType;
  email?: string;
  phone?: string;
  address?: string;
  location: CustomerLocation;
  paymentTerms?: string;
  notes?: string;
  partnerId?: string;
  agentsCount?: number;
  shipmentsCount?: number;
  createdAt: string;
}

export interface CreateCustomerDto {
  name: string;
  type: CustomerType;
  email?: string;
  phone?: string;
  address?: string;
  location: CustomerLocation;
  paymentTerms?: string;
  notes?: string;
  partnerId?: string;
}

export const getCustomers = (
  page: number = 1,
  limit: number = 20,
  search?: string,
) =>
  fetcher<PaginatedResponse<Customer>>("/customers", {
    page,
    limit,
    paginate: true,
    search,
  });

export const getPartnerCustomers = (
  page: number = 1,
  limit: number = 20,
  search?: string,
) =>
  fetcher<PaginatedResponse<Customer>>("/partners/me/customers", {
    page,
    limit,
    paginate: true,
    search,
  });


export const getCustomerDetails = (id: string) =>
  fetcher<any>(`/customers/${id}`);
export const createCustomer = (data: CreateCustomerDto) =>
  api.post("/customers", data).then((res) => res.data);
export const updateCustomer = (id: string, data: Partial<CreateCustomerDto>) =>
  api.put(`/customers/${id}`, data).then((res) => res.data);
export const deleteCustomer = (id: string) =>
  api.delete(`/customers/${id}`).then((res) => res.data);
export const getCustomerShipments = (id: string) =>
  fetcher<Shipment[]>(`/customers/${id}/shipments`);

// Containers
export enum ContainerStatus {
  REGISTERED = "registered",
  RECEIVED = "received",
  LOADING = "loading",
  LOADED = "loaded",
  SENDING = "sending",
  IN_TRANSIT = "in_transit",
  ARRIVED = "arrived",
  UNLOADED = "unloaded",
  DELIVERED = "delivered",
}

export interface Container {
  _id: string;
  organization: Organization;
  containerNumber: string;
  sizeType?: string;
  vesselName?: string;
  status: ContainerStatus;
  departureDate?: string;
  etaGhana?: string;
  arrivalDate?: string;
  currentLocation?: string;
  customerId?:
    | string
    | {
        _id: string;
        name: string;
        email?: string;
        phone?: string;
        location?: string;
        type?: string;
      };
  customerIds?: (
    | string
    | {
        _id: string;
        name: string;
        email?: string;
        phone?: string;
        location?: string;
        type?: string;
      }
  )[];
  partnerId?:
    | string
    | {
        _id: string;
        name: string;
        email?: string;
        phone?: string;
      };
  partnerIds?: (
    | string
    | {
        _id: string;
        name: string;
        email?: string;
        phone?: string;
      }
  )[];
  partnerCustomerId?: string | Customer;
  shipments?: Shipment[];
  customers?: Customer[];
  customer?: Customer;
  shipmentCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const getContainers = (
  page: number = 1,
  limit: number = 10,
  paginate: boolean = true,
  search?: string,
) =>
  fetcher<PaginatedResponse<Container> | Container[]>("/containers", {
    page,
    limit,
    paginate,
    search,
  });
export const getPartnerContainers = (
  page: number = 1,
  limit: number = 10,
  search?: string,
) =>
  fetcher<PaginatedResponse<Container>>("/partners/me/containers", {
    page,
    limit,
    paginate: true,
    search,
  });


export const getContainerDetails = (id: string) =>
  fetcher<Container>(`/containers/${id}`);
export const getContainerShipments = (id: string) =>
  fetcher<Shipment[]>(`/containers/${id}/shipments`);

export interface CreateContainerDto {
  containerNumber: string;
  sizeType?: string;
  vesselName?: string;
  status?: ContainerStatus;
  departureDate?: string;
  etaGhana?: string;
  arrivalDate?: string;
  currentLocation?: string;
  customerId?: string;
  partnerId?: string;
  customerIds?: string[];
  partnerIds?: string[];
  partnerCustomerId?: string;
}

export const createContainer = (data: CreateContainerDto) =>
  api.post("/containers", data).then((res) => res.data);
export const updateContainer = (id: string, data: Partial<CreateContainerDto>) =>
  api.put(`/containers/${id}`, data).then((res) => res.data);

export interface AssignCustomerToContainerDto {
  customerId: string;
}

export const assignCustomerToContainer = (
  containerId: string,
  data: AssignCustomerToContainerDto,
) =>
  api
    .put(`/containers/${containerId}/assign-customer`, data)
    .then((res) => res.data);

export const deleteContainer = (id: string) =>
  api.delete(`/containers/${id}`).then((res) => res.data);

// Cargo
export enum CargoType {
  FCL = "fcl",
  LCL = "lcl",
  AIR = "air",
}

export interface Cargo {
  _id: string;
  organization: Organization;
  cargoId: string;
  type: CargoType;
  weight?: number;
  origin?: string;
  destination?: string;
  vesselName?: string;
  eta?: string;
  containerId?: string | { _id: string; containerNumber: string };
  customerId?:
    | string
    | {
        _id: string;
        name: string;
        email?: string;
        phone?: string;
        location?: string;
        type?: string;
      };
  partnerId?:
    | string
    | {
        _id: string;
        name: string;
        email?: string;
        phone?: string;
      };
  createdAt: string;
  updatedAt: string;
}

export interface CreateCargoDto {
  cargoId: string;
  type: CargoType;
  weight?: number;
  origin?: string;
  destination?: string;
  vesselName?: string;
  eta?: string;
  containerId?: string;
  customerId?: string;
  partnerId?: string;
}

export const getCargo = () => fetcher<Cargo[]>("/cargo");
export const createCargo = (data: CreateCargoDto) =>
  api.post("/cargo", data).then((res) => res.data);
export const updateCargo = (id: string, data: Partial<CreateCargoDto>) =>
  api.put(`/cargo/${id}`, data).then((res) => res.data);
export const deleteCargo = (id: string) =>
  api.delete(`/cargo/${id}`).then((res) => res.data);

// Warehouses
export enum WarehouseLocation {
  CHINA = "china",
  ACCRA = "accra",
  KUMASI = "kumasi",
}

export interface Warehouse {
  _id: string;
  organization: Organization;
  name: string;
  location: WarehouseLocation;
  address: string;
  contactPerson: string;
  phone: string;
  capacity: number;
  currentUtilization: number;
  isActive: boolean;
  shipments?: Shipment[];
  customers?: Customer[];
  shipmentCount?: number;
  customerCount?: number;
  createdAt: string;
  updatedAt: string;
}

export const getWarehouses = () => fetcher<Warehouse[]>("/warehouses");
export const getWarehouseDetails = (id: string) =>
  fetcher<Warehouse>(`/warehouses/${id}`);

export interface CreateWarehouseDto {
  name: string;
  location: WarehouseLocation;
  address?: string;
  contactPerson?: string;
  phone?: string;
  capacity?: number;
  currentUtilization?: number;
}

export const createWarehouse = (data: CreateWarehouseDto) =>
  api.post("/warehouses", data).then((res) => res.data);
export const updateWarehouse = (id: string, data: Partial<CreateWarehouseDto>) =>
  api.patch(`/warehouses/${id}`, data).then((res) => res.data);
export const deleteWarehouse = (id: string) =>
  api.delete(`/warehouses/${id}`).then((res) => res.data);

// Partners
export interface Partner {
  _id: string;
  organization: Organization;
  name: string;
  email?: string;
  phoneNumber: string;
  isActive: boolean;
  role?: string;
  shipmentCount: number;
  customerCount: number;
  containerCount: number;
  createdAt: string;
  updatedAt: string;
}

export const getPartners = (
  page?: number,
  limit?: number,
  search?: string,
) =>
  fetcher<PaginatedResponse<Partner> | Partner[]>("/partners", {
    page,
    limit,
    paginate: !!page,
    search,
  });
export const getPartnerProfile = () => fetcher<any>("/partners/me");

export interface UpdatePartnerDto {
  name?: string;
  businessRegistrationNumber?: string;
  email?: string;
  phoneNumber?: string;
  businessAddress?: string;
}

export const updatePartnerProfile = (data: UpdatePartnerDto) =>
  api.put("/partners/me", data).then((res) => res.data);

export interface CreatePartnerDto {
  name: string;
  phoneNumber: string;
  email?: string;
  // use string here to stay compatible with backend enum values
  organization: string;
}

export const createPartner = (data: CreatePartnerDto) =>
  api.post("/partners", data).then((res) => res.data);

// Admin access partner (impersonation)
export interface AccessPartnerDto {
  partnerId: string;
}

export interface AccessPartnerResponse {
  user: any;
  accessToken: string;
  refreshToken: string;
}

export const accessPartnerAsAdmin = async (
  data: AccessPartnerDto,
): Promise<AccessPartnerResponse> => {
  const response = await api.post<AccessPartnerResponse>(
    "/partners/admin/access",
    data,
  );
  return response.data;
};

// Impersonation helpers
export const saveOriginalTokens = async () => {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();
  const userType = await getUserType();

  if (accessToken) {
    await SecureStore.setItemAsync(ORIGINAL_ACCESS_TOKEN_KEY, accessToken);
  }
  if (refreshToken) {
    await SecureStore.setItemAsync(ORIGINAL_REFRESH_TOKEN_KEY, refreshToken);
  }
  if (userType) {
    await SecureStore.setItemAsync(ORIGINAL_USER_TYPE_KEY, userType);
  }
};

export const restoreOriginalTokens = async () => {
  const originalAccessToken = await SecureStore.getItemAsync(
    ORIGINAL_ACCESS_TOKEN_KEY,
  );
  const originalRefreshToken = await SecureStore.getItemAsync(
    ORIGINAL_REFRESH_TOKEN_KEY,
  );
  const originalUserType = await SecureStore.getItemAsync(
    ORIGINAL_USER_TYPE_KEY,
  );

  if (originalAccessToken && originalRefreshToken) {
    await setTokens(
      originalAccessToken,
      originalRefreshToken,
      originalUserType as any,
    );
    await SecureStore.deleteItemAsync(ORIGINAL_ACCESS_TOKEN_KEY);
    await SecureStore.deleteItemAsync(ORIGINAL_REFRESH_TOKEN_KEY);
    await SecureStore.deleteItemAsync(ORIGINAL_USER_TYPE_KEY);
    await SecureStore.deleteItemAsync(IMPERSONATING_PARTNER_ID_KEY);
  }
};

export const getImpersonatingPartnerId = async () => {
  return await SecureStore.getItemAsync(IMPERSONATING_PARTNER_ID_KEY);
};

export const setImpersonatingPartnerId = async (partnerId: string) => {
  await SecureStore.setItemAsync(IMPERSONATING_PARTNER_ID_KEY, partnerId);
};

// Documents
export interface Document {
  _id: string;
  name: string;
  type: string;
  fileUrl: string;
  fileSize?: number;
  shipmentId?: string;
  containerId?: string;
  description?: string;
  createdAt: string;
}

export interface CreateDocumentDto {
  name: string;
  type: string;
  fileUrl?: string;
  fileSize?: number;
  shipmentId?: string;
  containerId?: string;
  description?: string;
}

export const getDocuments = () => fetcher<Document[]>("/documents");
export const createDocument = (data: CreateDocumentDto) =>
  api.post("/documents", data).then((res) => res.data);

// Reports (Excel export)
export type ReportType = "shipments" | "customers" | "containers";
export type ReportMode = "summary" | "detailed";

export interface GenerateExcelReportPayload {
  type: ReportType;
  mode: ReportMode;
  fromDate?: string;
  toDate?: string;
  partnerId?: string;
  customerId?: string;
  containerId?: string;
  shipmentStatuses?: ShipmentStatus[];
  customerTypes?: CustomerType[];
  locations?: CustomerLocation[];
  onlyWithShipments?: boolean;
}

// Note: response is an Excel file (binary). We request it as an arraybuffer,
// and let the caller handle actual file saving / download.
export const exportExcelReport = (payload: GenerateExcelReportPayload) => {
  console.log("[api] exportExcelReport - Sending request with payload:", {
    payload,
    payloadStringified: JSON.stringify(payload, null, 2),
  });

  return api
    .post<ArrayBuffer>("/reports/export-excel", payload, {
      responseType: "arraybuffer",
    })
    .then((res) => {
      console.log("[api] exportExcelReport - Response received:", {
        status: res.status,
        headers: res.headers,
        dataSize: res.data.byteLength,
        dataType: typeof res.data,
      });
      return res.data;
    })
    .catch((error) => {
      console.error("[api] exportExcelReport - Error:", {
        error,
        response: error?.response?.data,
        status: error?.response?.status,
        message: error?.message,
      });
      throw error;
    });
};

export const getCustomer = (id: string) => {
  console.log(`[api] getCustomer id: ${id}`);
  return fetcher<Customer>(`/customers/${id}`).catch(err => {
    console.error(`[api] getCustomer error for ${id}:`, err?.response?.status, err?.response?.data);
    throw err;
  });
};

// SMS Templates
export interface SMSTemplate {
  _id: string;
  name: string;
  title: string;
  content: string;
  statusMapping: string[];
  organization: Organization;
  partnerId?: string | null;
  userId?: string | null;
  isDefault: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UpdateSMSTemplateDto {
  title?: string;
  content?: string;
  statusMapping?: string[];
  isActive?: boolean;
}

export const getSMSTemplates = () => fetcher<SMSTemplate[]>("/sms-templates");
export const updateSMSTemplate = (id: string, data: UpdateSMSTemplateDto) =>
  api.put(`/sms-templates/${id}`, data).then((res) => res.data);

export const uploadDocument = (formData: FormData) =>
  api
    .post("/documents/upload", formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    })
    .then((res) => res.data);

// Profile
export const getProfile = () => fetcher<any>("/users/me");

// Dashboard
export interface DashboardStatsDto {
  totals: {
    shipments: number;
    containers: number;
    customers: number;
    warehouses: number;
    inTransitContainers: number;
  };
  recentActivity: {
    recentShipments: Array<{
      _id: string;
      trackingNumber: string;
      status: string;
      createdAt: string;
      customerId?: string;
      partnerId?: string;
    }>;
  };
}

export const getDashboardStats = () =>
  fetcher<DashboardStatsDto>("/dashboard/stats");

// Partner Home
export interface PartnerHomeStatsDto {
  partner: {
    shipmentCount: number;
    customerCount: number;
    containerCount: number;
    [key: string]: any;
  };
  recentActivity: {
    recentShipments: Array<{
      _id: string;
      trackingNumber: string;
      status: string;
      createdAt: string;
      customerId?: string | { name: string; _id: string };
    }>;
  };
}

export const getPartnerHomeStats = () =>
  fetcher<PartnerHomeStatsDto>("/partners/home");



// Users (Staff/Admin)
export enum UserRole {
  ADMIN = "admin",
  CHINA_STAFF = "china_staff",
  GHANA_STAFF = "ghana_staff",
}

export enum UserOrganization {
  SKYLINE = "skyline",
  SKYRAK = "skyrak",
}

export interface CreateUserDto {
  name: string;
  email: string;
  password: string;
  organization: UserOrganization;
  role?: UserRole;
}

export interface User {
  _id: string;
  name: string;
  email: string;
  organization: UserOrganization;
  role: UserRole;
  warehouseId?: string | null;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export const getUsers = () => fetcher<User[]>("/users");
export const createUser = (data: CreateUserDto) =>
  api.post("/users", data).then((res) => res.data);
export const deleteUser = (id: string) =>
  api.delete(`/users/${id}`).then((res) => res.data);

// Broadcasts
export const getBroadcasts = () => fetcher<any[]>("/broadcasts");

export type BroadcastTarget =
  | "all"
  | "customers"
  | "partners"
  | "customer"
  | "partner";

export interface BroadcastPayload {
  target: BroadcastTarget;
  recipientId?: string;
  title: string;
  message: string;
  type?: NotificationType;
  sendSms?: boolean;
  sendNotification?: boolean;
}

export const sendBroadcast = (payload: BroadcastPayload) =>
  api
    .post<{ count: number }>("/notifications/broadcast", payload)
    .then((res) => res.data);

// Auth
export const login = async (data: any) => {
  console.log(data);
  const response = await api.post("/auth/login", data);
  return response.data;
};

// Tracking
export interface TrackingEntryDto {
  id: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export type TrackingEntityResponse =
  | { type: "shipment"; data: Shipment }
  | { type: "container"; data: Container }
  | { type: "unknown"; data: null };

export type TrackingTimelineResponseDto = TrackingEntityResponse & {
  tracking: TrackingEntryDto[];
};

export const trackNumber = (number: string) =>
  fetcher<TrackingTimelineResponseDto>(`/tracking/${number}`);

// Tracking Summary
export interface TrackingSummaryDto {
  stats: {
    inTransit: number;
    delivered: number;
    pending: number;
    atWarehouse: number;
  };
  recent: Shipment[];
}

export const getTrackingSummary = () =>
  fetcher<TrackingSummaryDto>("/shipments/tracking-summary");

// Customer Auth
export const sendCustomerOtp = async (phoneNumber: string) => {
  const response = await publicApi.post("/customers/auth/otp", { phoneNumber });
  return response.data;
};

export const customerLogin = async (
  phoneNumber: string,
  otp: string,
  organization: string,
) => {
  const response = await publicApi.post("/customers/auth/login", {
    phoneNumber,
    otp,
    organization,
  });
  return response.data;
};

export const getCustomerProfile = () => fetcher<any>("/customers/me");

// Partner Auth
export const sendPartnerOtp = async (phoneNumber: string) => {
  const response = await publicApi.post("/partners/auth/otp", { phoneNumber });
  return response.data;
};

export const partnerLogin = async (
  phoneNumber: string,
  otp: string,
  organization: string,
) => {
  const response = await publicApi.post("/partners/auth/login", {
    phoneNumber,
    otp,
    organization,
  });
  return response.data;
};

// Notifications
export type NotificationRecipientType = "user" | "customer" | "partner";
export type NotificationType = "info" | "success" | "warning" | "error";

export interface Notification {
  _id: string;
  organization: UserOrganization;
  recipientId: string;
  recipientType: NotificationRecipientType;
  title: string;
  message: string;
  type: NotificationType;
  read: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
  updatedAt: string;
}

export const getNotifications = () => fetcher<Notification[]>("/notifications");
export const markNotificationRead = (id: string) =>
  api.patch(`/notifications/${id}/read`).then((res) => res.data);
export const markAllNotificationsRead = () =>
  api.patch("/notifications/mark-all-read").then((res) => res.data);
export const getUnreadCount = () =>
  fetcher<{ count: number }>("/notifications/unread-count");

export default api;
