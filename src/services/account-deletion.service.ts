import axios from "axios";
import Cookies from "js-cookie";
import { AccountDeletionRequest, DeletionRequestResponse } from "@/types/account-deletion";

// Using the same environment variable as used in ProfilePage
const API_URL = process.env.NEXT_PUBLIC_BACKEND_URL;

const getAuthHeaders = () => {
    const token = Cookies.get("auth_token");
    return {
        headers: {
            Authorization: `Bearer ${token}`
        }
    };
};

export const getMyDeletionRequest = async (): Promise<{ request: AccountDeletionRequest | null }> => {
    try {
        const response = await axios.get(`${API_URL}/api/account/deletion-request`, getAuthHeaders());
        return response.data.data;
    } catch (error: any) {
        console.error("Error fetching deletion request:", error);
        // Return null if 404 or other error to avoid breaking UI that expects a possible null
        return { request: null };
    }
};

export const requestAccountDeletion = async (reason: string) => {
    const response = await axios.post(`${API_URL}/api/account/deletion-request`, { reason }, getAuthHeaders());
    return response.data;
};

export const getAllDeletionRequests = async (status: string = 'pending', page: number = 1, limit: number = 10): Promise<DeletionRequestResponse> => {
    const response = await axios.get(`${API_URL}/api/admin/deletion-requests`, {
        ...getAuthHeaders(),
        params: { status, page, limit }
    });
    return response.data.data;
};

export const reviewDeletionRequest = async (requestId: number, action: 'approve' | 'reject', remarks?: string) => {
    const response = await axios.patch(
        `${API_URL}/api/admin/deletion-requests/${requestId}/review`,
        { action, remarks },
        getAuthHeaders()
    );
    return response.data;
};
