import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { RoomProvider } from "./context/RoomContext.jsx";

createRoot(document.getElementById("root")).render(
  <RoomProvider>
    <StrictMode>
      <App />
    </StrictMode>
  </RoomProvider>
);
