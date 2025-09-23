import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

const ChatSessionContext = createContext({
  messagesSetter: null,
  setMessagesSetter: () => {},
});

const ChatSessionProvider = ({ children }) => {
  const [messagesSetter, setMessagesSetterState] = useState(null);

  const setMessagesSetter = useCallback((setter) => {
    if (!setter) {
      setMessagesSetterState(null);
      return;
    }

    setMessagesSetterState(() => setter);
  }, []);

  const value = useMemo(
    () => ({
      messagesSetter,
      setMessagesSetter,
    }),
    [messagesSetter, setMessagesSetter]
  );

  return (
    <ChatSessionContext.Provider value={value}>
      {children}
    </ChatSessionContext.Provider>
  );
};

export const useChatSession = () => useContext(ChatSessionContext);

export default ChatSessionProvider;
