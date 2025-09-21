import { createSlice } from "@reduxjs/toolkit";

const loadChatHistory = () => {
  try {
    const saved = localStorage.getItem("chatHistory");
    return saved ? JSON.parse(saved) : [];
  } catch (error) {
    console.error("Error loading chat history:", error);
    return [];
  }
};

const saveChatHistory = (history) => {
  try {
    localStorage.setItem("chatHistory", JSON.stringify(history));
  } catch (error) {
    console.error("Error saving chat history:", error);
  }
};

const initialState = {
  chatHistory: loadChatHistory(),
  isTyping: false,
  typingMsgId: null,
};

const chatSlice = createSlice({
  name: "chat",
  initialState,
  reducers: {
    addUserMessage: (state, action) => {
      const message = {
        id: Date.now(),
        type: "user",
        content: action.payload,
        timestamp: new Date().toISOString(),
      };
      state.chatHistory.push(message);
      saveChatHistory(state.chatHistory);
    },
    addAssistantMessage: (state, action) => {
      const message = {
        id: Date.now(),
        type: "assistant",
        content: action.payload,
        timestamp: new Date().toISOString(),
      };
      state.chatHistory.push(message);
      state.typingMsgId = message.id;
      saveChatHistory(state.chatHistory);
    },
    addTriageMessage: (state, action) => {
      const message = {
        id: Date.now(),
        type: "triage",
        content: action.payload,
        timestamp: new Date().toISOString(),
      };
      state.chatHistory.push(message);
      saveChatHistory(state.chatHistory);
    },
    addErrorMessage: (state, action) => {
      const message = {
        id: Date.now(),
        type: "error",
        content: action.payload,
        timestamp: new Date().toISOString(),
      };
      state.chatHistory.push(message);
      saveChatHistory(state.chatHistory);
    },
    clearHistory: (state) => {
      state.chatHistory = [];
      saveChatHistory(state.chatHistory);
    },
    setTyping: (state, action) => {
      state.isTyping = action.payload;
    },
    setTypingMsgId: (state, action) => {
      state.typingMsgId = action.payload;
    },
  },
});

export const {
  addUserMessage,
  addAssistantMessage,
  addTriageMessage,
  addErrorMessage,
  clearHistory,
  setTyping,
  setTypingMsgId,
} = chatSlice.actions;

export default chatSlice.reducer;
