import { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(
    JSON.parse(localStorage.getItem("user")) || null
  );

  function loginAsStudent() {
    const fakeStudent = {
      id: 1,
      role: "student",
      name: "أحمد بن علي",
      email: "student@test.com",
    };

    localStorage.setItem(
      "user",
      JSON.stringify(fakeStudent)
    );

    setUser(fakeStudent);
  }

  function logout() {
    localStorage.removeItem("user");
    setUser(null);
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        loginAsStudent,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}