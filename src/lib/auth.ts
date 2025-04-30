
import { supabase } from "@/integrations/supabase/client";

// Function to get user role based on email
export const getUserRole = async (userId: string): Promise<string> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', userId)
      .single();
    
    if (error) throw error;
    
    return data?.role || "BH"; // Default to BH if not found
  } catch (error) {
    console.error("Error getting user role:", error);
    return "BH"; // Default role
  }
};

// Function to check if a user is authenticated
export const isAuthenticated = async (): Promise<boolean> => {
  const { data } = await supabase.auth.getSession();
  return !!data.session;
};

// Function to get the current user
export const getCurrentUser = async () => {
  const { data } = await supabase.auth.getUser();
  return data?.user || null;
};
