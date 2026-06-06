export const MOCK_USER = {
  id:      "s1",
  name:    "أحمد بن يوسف",
  email:   "ahmed@example.com",
  role:    "guest",           // "student" | "guest"
  avatar:  "أي",                // initials
};

// Drop-in hook — returns the logged-in student directly.
// Set to `null` to simulate a guest visitor.
export const useAuth = () => ({ user: MOCK_USER });