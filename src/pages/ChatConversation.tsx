import { useParams } from "react-router-dom";
import ChatView from "./Chat";

export default function ChatConversation() {
  const { chatId } = useParams<{ chatId: string }>();
  return <ChatView chatId={chatId} />;
}
