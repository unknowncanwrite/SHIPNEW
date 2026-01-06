import { useQuery, useMutation } from "@tanstack/react-query";
import { Contact, InsertContact } from "@shared/schema";
import { apiRequest, queryClient } from "../lib/queryClient";

export function useContacts() {
  return useQuery<Contact[]>({
    queryKey: ["/api/contacts"],
  });
}

export function useCreateContact() {
  return useMutation({
    mutationFn: async (contact: InsertContact) => {
      const res = await apiRequest("POST", "/api/contacts", contact);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });
}

export function useUpdateContact() {
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<InsertContact> }) => {
      const res = await apiRequest("PATCH", `/api/contacts/${id}`, data);
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });
}

export function useDeleteContact() {
  return useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/contacts/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/contacts"] });
    },
  });
}
