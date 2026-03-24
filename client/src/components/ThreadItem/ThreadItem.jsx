import { useState } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { useUpdateChatMutation } from "../../features/chats/hooks/useUpdateChatMutation";
import { useDeleteChatMutation } from "../../features/chats/hooks/useDeleteChatMutation";
import "./threadItem.styles.scss";

const formatFallbackDate = (dateStr) => {
  if (!dateStr) return "Chat";
  try {
    return (
      "Chat – " +
      new Date(dateStr).toLocaleDateString(undefined, {
        day: "numeric",
        month: "short",
        year: "numeric",
      })
    );
  } catch {
    return "Chat";
  }
};

const formatRelativeTime = (dateStr) => {
  if (!dateStr) return "";
  try {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "Just now";
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    const days = Math.floor(hrs / 24);
    if (days < 7) return `${days}d ago`;
    const weeks = Math.floor(days / 7);
    if (weeks < 5) return `${weeks}w ago`;
    return new Date(dateStr).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
    });
  } catch {
    return "";
  }
};

const ThreadItem = ({ chat, isActive, onSelect }) => {
  const [isRenaming, setIsRenaming] = useState(false);
  const [renameValue, setRenameValue] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const { mutate: updateChat } = useUpdateChatMutation();
  const { mutate: deleteChat } = useDeleteChatMutation();

  const displayTitle = chat.title || formatFallbackDate(chat.createdAt);

  const handleRenameStart = (e) => {
    e.stopPropagation();
    setRenameValue(chat.title || "");
    setIsRenaming(true);
  };

  const handleRenameSave = () => {
    const trimmed = renameValue.trim();
    if (trimmed && trimmed !== chat.title) {
      updateChat({ chatId: chat.id, data: { title: trimmed } });
    }
    setIsRenaming(false);
  };

  const handleRenameKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleRenameSave();
    }
    if (e.key === "Escape") {
      setIsRenaming(false);
    }
  };

  const handleDeleteConfirm = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(true);
  };

  const handleDeleteExecute = (e) => {
    e.stopPropagation();
    deleteChat(chat.id);
    setShowDeleteConfirm(false);
  };

  const handleDeleteCancel = (e) => {
    e.stopPropagation();
    setShowDeleteConfirm(false);
  };

  const itemClass = `threadItem${isActive ? " threadItem--active" : ""}`;

  if (isRenaming) {
    return (
      <div className={itemClass}>
        <input
          autoFocus
          type="text"
          className="threadItem__renameInput"
          value={renameValue}
          onChange={(e) => setRenameValue(e.target.value)}
          onBlur={handleRenameSave}
          onKeyDown={handleRenameKeyDown}
          maxLength={120}
          aria-label="Rename thread"
        />
      </div>
    );
  }

  if (showDeleteConfirm) {
    return (
      <div className={itemClass}>
        <span className="threadItem__deletePrompt">Delete this chat?</span>
        <div className="threadItem__deleteActions">
          <button
            type="button"
            className="threadItem__confirmBtn"
            onClick={handleDeleteExecute}
          >
            Yes
          </button>
          <button
            type="button"
            className="threadItem__cancelBtn"
            onClick={handleDeleteCancel}
          >
            No
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      className={itemClass}
      onClick={onSelect}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-pressed={isActive}
    >
      <div className="threadItem__main">
        <span className="threadItem__title">{displayTitle}</span>
        <span className="threadItem__time">{formatRelativeTime(chat.updatedAt)}</span>
      </div>

      <div className="threadItem__actions" role="group" aria-label="Thread actions">
        <button
          type="button"
          className="threadItem__actionBtn"
          aria-label="Rename thread"
          title="Rename"
          onClick={handleRenameStart}
        >
          <FiEdit2 size={13} />
        </button>
        <button
          type="button"
          className="threadItem__actionBtn threadItem__actionBtn--danger"
          aria-label="Delete thread"
          title="Delete"
          onClick={handleDeleteConfirm}
        >
          <FiTrash2 size={13} />
        </button>
      </div>
    </div>
  );
};

export default ThreadItem;
