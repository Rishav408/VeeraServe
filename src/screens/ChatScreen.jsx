import ChatWidget from "../components/ChatWidget";
import ScreenHeader from "../components/ScreenHeader";

export default function ChatScreen() {
  return (
    <div>
      <ScreenHeader title="Talk to Veera Bot" subtitle="Get recommendations, menu help, and order tracking assistance." />
      <ChatWidget />
    </div>
  );
}
