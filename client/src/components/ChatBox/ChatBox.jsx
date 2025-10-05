import { useEffect, useState } from "react";
import { BASE_URL } from "../../constants/baseUrl";
import useChatMutation from "../../hooks/useChatMutation";
import "./chatBox.styles.scss";

const ChatBox = () => {
  const [text, setText] = useState("give me a 5 day meal plan");
  const [messages, setMessages] = useState([]);
  const { data, mutate, isLoading, isError, error, isPending } =
    useChatMutation();

  useEffect(() => {
    // remove if not needed
    (async () => {
      const res = await fetch(`${BASE_URL}/health`);
      const json = await res.json();
      // console.log(json);
    })();
  }, []);

  const handleChange = (e) => setText(e.target.value);

  const handleSubmit = (e) => {
    e.preventDefault();
    setMessages((prev) => [...prev, { role: "user", text }]);
    setText("");
    mutate(
      { text }, // or just `text` if your hook expects a string
      {
        onSuccess: (res) => {
          // console.log("we out here", res);
          setMessages((prev) => [
            ...prev,
            { role: "system", text: res.content },
          ]);
        },
        onError: (err) => {
          console.error("chat failed", err);
        },
      }
    );
  };

  return (
    <div id="chat-box">
      <div className="form-wrapper">
        <div className="messages-wrapper">
          {messages &&
            messages.map((message, index) => {
              return (
                <div
                  key={index}
                  className={`message-unit  ${
                    message.role == "system" ? "system" : "user"
                  } `}
                >
                  {" "}
                  {message.text}{" "}
                </div>
              );
            })}
        </div>
        <p> {isPending ? "Thinking...." : ""} </p>
        <form onSubmit={handleSubmit}>
          <div className="input-wrapper">
            <input
              type="text"
              name="text"
              placeholder="Ask your question..."
              value={text}
              onChange={handleChange}
            />
            {/* <button disabled={isLoading}>
              {isLoading ? "Sending..." : "Send"}
            </button> */}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ChatBox;
