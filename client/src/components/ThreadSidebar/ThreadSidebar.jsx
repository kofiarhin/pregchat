import { FiPlus } from "react-icons/fi";
import { useChatsQuery } from "../../features/chats/hooks/useChatsQuery";
import { useCreateChatMutation } from "../../features/chats/hooks/useCreateChatMutation";
import ThreadItem from "../ThreadItem/ThreadItem";
import "./threadSidebar.styles.scss";

const SkeletonRow = () => (
  <div className="threadSidebar__skeleton" aria-hidden="true">
    <div className="threadSidebar__skeletonTitle" />
    <div className="threadSidebar__skeletonTime" />
  </div>
);

const ThreadSidebar = ({ activeThreadId, onSelectThread, onNewThread }) => {
  const { data: threads = [], isLoading, isError } = useChatsQuery();

  const { mutate: createChat, isPending: isCreating } = useCreateChatMutation({
    onSuccess: (chat) => {
      if (chat?.id) {
        onNewThread(chat.id);
      }
    },
  });

  const handleNewChat = () => {
    createChat({});
  };

  return (
    <aside className="threadSidebar" aria-label="Conversation threads">
      <div className="threadSidebar__header">
        <span className="threadSidebar__heading">Chats</span>
        <button
          type="button"
          className="threadSidebar__newBtn"
          onClick={handleNewChat}
          disabled={isCreating}
          aria-label="New chat"
          title="New chat"
        >
          <FiPlus size={16} aria-hidden="true" />
          <span>New Chat</span>
        </button>
      </div>

      <div className="threadSidebar__list" role="list">
        {isLoading && (
          <>
            <SkeletonRow />
            <SkeletonRow />
            <SkeletonRow />
          </>
        )}

        {isError && !isLoading && (
          <p className="threadSidebar__error" role="alert">
            Could not load conversations.
          </p>
        )}

        {!isLoading && !isError && threads.length === 0 && (
          <p className="threadSidebar__empty">
            No conversations yet.
            <br />
            Start a new chat.
          </p>
        )}

        {!isLoading &&
          threads.map((chat) => (
            <div key={chat.id} role="listitem">
              <ThreadItem
                chat={chat}
                isActive={chat.id === activeThreadId}
                onSelect={() => onSelectThread(chat.id)}
              />
            </div>
          ))}
      </div>
    </aside>
  );
};

export default ThreadSidebar;
