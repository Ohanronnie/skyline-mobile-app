import {
  accessPartnerAsAdmin,
  clearTokens,
  getAccessToken,
  getCustomerProfile,
  getImpersonatingPartnerId,
  getPartnerProfile,
  getProfile,
  getUserType,
  restoreOriginalTokens,
  saveOriginalTokens,
  setImpersonatingPartnerId,
  setTokens,
} from "@/lib/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import React, { createContext, useContext, useEffect, useState } from "react";

interface User {
  id: string;
  email: string;
  name: string;
  role: string;
  organization: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isImpersonating: boolean;
  impersonatingPartnerId: string | null;
  refetchUser: () => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  accessPartner: (partnerId: string) => Promise<void>;
  exitImpersonation: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [impersonatingPartnerId, setImpersonatingPartnerIdState] = useState<
    string | null
  >(null);

  // Check for existing impersonation on mount
  useEffect(() => {
    const checkImpersonation = async () => {
      const partnerId = await getImpersonatingPartnerId();
      if (partnerId) {
        setImpersonatingPartnerIdState(partnerId);
      }
    };
    checkImpersonation();
  }, []);

  const {
    data: user,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["user"],
    queryFn: async () => {
      const token = await getAccessToken();
      if (!token) {
        return null;
      }

      const userType = await getUserType();

      try {
        if (userType === "customer") {
          const customerProfile = await getCustomerProfile();
          return { ...customerProfile, userType: "customer" };
        } else if (userType === "partner") {
          const partnerProfile = await getPartnerProfile();
          return { ...partnerProfile, userType: "partner" };
        } else {
          // Default to admin/staff profile
          const profile = await getProfile();
          return { ...profile, userType: "admin" };
        }
      } catch (error) {
        console.error("Profile fetch failed:", error);
        return null;
      }
    },
    retry: false,
  });

  const isAuthenticated = !!user;
  const isImpersonating = !!impersonatingPartnerId;

  const logout = async () => {
    try {
      // If impersonating, restore original tokens first (but we'll still logout)
      if (isImpersonating) {
        await restoreOriginalTokens();
        setImpersonatingPartnerIdState(null);
      }

      // Clear all tokens
      await clearTokens();

      // Clear all query data immediately
      queryClient.setQueryData(["user"], null);
      queryClient.clear(); // Clear all cached queries

      // Force navigation to auth screen immediately
      // Use a small delay to ensure state updates
      setTimeout(() => {
        router.replace("/(auth)");
      }, 50);
    } catch (error) {
      console.error("Logout error:", error);
      // Even if there's an error, try to clear and navigate
      try {
        await clearTokens();
        queryClient.setQueryData(["user"], null);
        queryClient.clear();
      } catch (clearError) {
        console.error("Failed to clear tokens:", clearError);
      }
      // Force navigation to auth
      router.replace("/(auth)");
    }
  };

  const checkAuth = async (): Promise<boolean> => {
    const result = await refetch();
    return !!result.data;
  };

  const refetchUser = async () => {
    await refetch();
  };

  const accessPartner = async (partnerId: string) => {
    try {
      // Save current admin tokens
      await saveOriginalTokens();

      // Call API to get partner tokens
      const response = await accessPartnerAsAdmin({ partnerId });

      // Set partner tokens
      await setTokens(response.accessToken, response.refreshToken, "partner");

      // Store impersonation state
      await setImpersonatingPartnerId(partnerId);
      setImpersonatingPartnerIdState(partnerId);

      // Navigate FIRST to prevent auth screen flash
      router.replace("/(partners)");

      // Then invalidate and refetch user data in the background
      // Don't clear user query - just invalidate to prevent auth redirect
      await queryClient.invalidateQueries({ queryKey: ["user"] });
      await refetch();
    } catch (error: any) {
      console.error("Failed to access partner:", error);
      throw error;
    }
  };

  const exitImpersonation = async () => {
    try {
      // Restore original admin tokens (this also clears IMPERSONATING_PARTNER_ID_KEY)
      await restoreOriginalTokens();

      // Clear impersonation state immediately
      setImpersonatingPartnerIdState(null);

      // Invalidate and refetch user data BEFORE navigation to ensure we have admin user
      await queryClient.invalidateQueries({ queryKey: ["user"] });

      // Refetch and wait for admin user data
      let attempts = 0;
      let result;
      do {
        result = await refetch();
        attempts++;

        // Check if we got admin user data
        if (
          result.data &&
          (result.data.userType === "admin" ||
            result.data.role === "admin" ||
            result.data.role === "staff")
        ) {
          break;
        }

        // Wait a bit before retrying
        if (attempts < 3) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      } while (
        attempts < 3 &&
        (!result.data || result.data.userType === "partner")
      );

      // Now navigate to admin dashboard
      router.replace("/(tabs)");

      // Clear other cached queries after navigation (but keep user query)
      const allQueries = queryClient.getQueryCache().getAll();
      allQueries.forEach((query) => {
        if (query.queryKey[0] !== "user") {
          queryClient.removeQueries({ queryKey: query.queryKey });
        }
      });
    } catch (error) {
      console.error("Failed to exit impersonation:", error);
      // Even if there's an error, try to restore and navigate back
      try {
        await restoreOriginalTokens();
        setImpersonatingPartnerIdState(null);
        // Force refetch
        await refetch();
        // Navigate to admin dashboard
        router.replace("/(tabs)");
      } catch (restoreError) {
        console.error("Failed to restore tokens:", restoreError);
        // Still navigate to prevent being stuck
        router.replace("/(tabs)");
      }
    }
  };

  const value: AuthContextType = {
    user: user || null,
    isLoading,
    isAuthenticated,
    isImpersonating,
    impersonatingPartnerId,
    refetchUser,
    logout,
    checkAuth,
    accessPartner,
    exitImpersonation,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

// Hook for protected screens: redirects to auth flow when user is not authenticated
export function useRequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/(auth)");
    }
  }, [isLoading, isAuthenticated, router]);
}
