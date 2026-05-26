import { useEffect, useState } from "react";
import Alert from "@mui/material/Alert";
import { keyframes } from "@mui/system";

const slideIn = keyframes`
  from {
    transform: translateX(100%);
    opacity: 0;
  }
  to {
    transform: translateX(0);
    opacity: 1;
  }
`;

const slideOut = keyframes`
  from {
    transform: translateX(0);
    opacity: 1;
  }
  to {
    transform: translateX(100%);
    opacity: 0;
  }
`;

export default function AlertMessage({ message, color , duration = 3000, onClose }) {
  const [visible, setVisible] = useState(true);
  const [exiting, setExiting] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true);
      setTimeout(() => {
        setVisible(false);
        onClose && onClose(); 
      }, 300); 
    }, duration);

    return () => clearTimeout(timer);
  }, []);

  if (!visible) return null;

  return (
    <div
      style={{
        position: "fixed",
        top: "20px",
        left: "250px",
        zIndex: 9999,
        height:"30px",
        width:"400px",
        animation: `${exiting ? slideOut : slideIn} 0.3s ease`,
      }}
    >
      <Alert severity={color} variant="filled">
        {message}
      </Alert>
    </div>
  );
}