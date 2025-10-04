import { useEffect } from "react";
import { BASE_URL } from "../../constants/baseUrl";

const ChatBox = () => {
  useEffect(() => {
    const getData = async () => {
      const res = await fetch(`${BASE_URL}/health`);
      const data = await res.json();
      console.log({ data });
    };
    getData();
  }, []);
  return <div>ChatBox</div>;
};

export default ChatBox;
