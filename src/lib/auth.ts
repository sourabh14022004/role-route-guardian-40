
// Mock user data - in a real application, this would come from your backend
const mockUsers = [
  { email: "admin@example.com", role: "admin" },
  { email: "bh@example.com", role: "BH" },
  { email: "zh@example.com", role: "ZH" },
  { email: "ch@example.com", role: "CH" },
];

// Function to get user role based on email
export const getUserRole = (email: string): string => {
  const user = mockUsers.find(user => user.email === email);
  return user?.role || "BH"; // Default to BH if not found
};

// Mock function to check if a user is authenticated
export const isAuthenticated = (): boolean => {
  // In a real application, check localStorage, cookies, or a state management solution
  return false;
};

// Mock function to get the current user
export const getCurrentUser = () => {
  // In a real application, retrieve user data from storage or state
  return null;
};
