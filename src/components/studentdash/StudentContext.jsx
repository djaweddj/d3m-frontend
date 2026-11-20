import { createContext, useContext } from "react";
import useStudentData from "./useStudentData";

const StudentContext = createContext(null);

// Loads everything the student pages need once, so switching routes never refetches.
// useStudent() -> { resources, schoolCount, isLoading, reloadAll }
export function StudentProvider({ children }) {
  const data = useStudentData();
  return <StudentContext.Provider value={data}>{children}</StudentContext.Provider>;
}

export const useStudent = () => useContext(StudentContext);
