import { createContext, useState } from "react";

const RoomContext = createContext();

export function RoomProvider({ children }) {
  const [roomId, setRoomId] = useState("");
  const [joined, setJoined] = useState(false);
  const [name, setName] = useState("");
  return (
    <RoomContext.Provider
      value={{
        roomId,
        setRoomId,
        joined,
        setJoined,
        name,
        setName,
      }}
    >
      {children}
    </RoomContext.Provider>
  );
}

export { RoomContext };
