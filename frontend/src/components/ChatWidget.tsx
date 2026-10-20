import { ChefHat, Mic, Square, SendHorizontal, Paperclip, X, Volume2, VolumeX } from "lucide-react";
import { useState, useRef } from "react";
import type { FormEvent } from "react";
import { useChat } from "../context/ChatContext";

const quickReplies = ["Show menu", "Recommend", "Spicy dishes", "Track order"];

export default function ChatWidget({ compact = false }: { compact?: boolean }) {
  const [input, setInput] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const { messages, typing, activity, speechEnabled, toggleSpeech, sendMessage } = useChat();

  const submit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!input.trim() && !isRecording && !selectedImage) return;
    sendMessage(input.trim(), null, selectedImage);
    setInput("");
    setSelectedImage(null);
  };

  const sendQuick = (text: string) => sendMessage(text);

  const toggleRecording = async () => {
    if (isRecording) {
      if (mediaRecorderRef.current) {
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
    } else {
      setError(null);
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        mediaRecorderRef.current = mediaRecorder;
        audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" });
          sendMessage("", audioBlob);
          stream.getTracks().forEach((track) => track.stop());
        };

        mediaRecorder.start();
        setIsRecording(true);
      } catch (err) {
        console.error("Error accessing microphone:", err);
        setError("Microphone access denied or unavailable.");
      }
    }
  };

  return (
    <section className={`card-3d overflow-hidden rounded-[20px] p-0 ${compact ? "h-[28rem]" : "h-[34rem]"}`}>
      <header className="flex items-center justify-between bg-dhaba-hero p-4 text-white">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-white/20">
            <ChefHat size={20} aria-hidden="true" />
          </span>
          <div>
            <p className="text-sm font-semibold">Veera Bot</p>
            <p className="text-xs text-white/70">Your AI Waiter</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={toggleSpeech}
            aria-pressed={speechEnabled}
            aria-label={speechEnabled ? "Disable voice replies" : "Enable voice replies"}
            title={speechEnabled ? "Disable voice replies" : "Enable voice replies"}
            className={`inline-flex h-8 w-8 items-center justify-center rounded-full ${speechEnabled ? "bg-white/25" : "bg-white/10"}`}
          >
            {speechEnabled ? <Volume2 size={16} aria-hidden="true" /> : <VolumeX size={16} aria-hidden="true" />}
          </button>
          <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" aria-hidden="true" />
        </div>
      </header>
      <div
        role="log"
        aria-live="polite"
        aria-label="Conversation with Veera"
        className="h-[65%] space-y-3 overflow-y-auto bg-cream p-3 scroll-smooth"
      >
        {messages.map((message) => (
          <div key={message.id} className={`flex ${message.sender === "bot" ? "justify-start" : "justify-end"}`}>
            {message.sender === "bot" ? (
              <div className="flex max-w-[80%] items-start gap-2">
                <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-white text-primary">
                  <ChefHat size={14} aria-hidden="true" />
                </span>
                <p className="rounded-[4px_16px_16px_16px] bg-white p-3 text-sm text-ink shadow-sm">
                  {message.text}
                  {message.streaming && <span className="ml-0.5 animate-pulse">▍</span>}
                </p>
              </div>
            ) : (
              <p className="max-w-[80%] rounded-[16px_4px_16px_16px] bg-gradient-to-r from-primary to-primary/80 p-3 text-sm text-white shadow-btn-primary">
                {message.text}
              </p>
            )}
          </div>
        ))}

        {typing && (
          <div
            role="status"
            aria-label={activity ? `Veera is ${activity}` : "Veera is typing"}
            className="inline-flex items-center gap-2 rounded-[4px_16px_16px_16px] bg-white px-3 py-2"
          >
            {[0, 1, 2].map((index) => (
              <span
                key={index}
                aria-hidden="true"
                className="h-2 w-2 rounded-full bg-primary/60"
                style={{ animation: `float 0.9s ease ${index * 0.15}s infinite` }}
              />
            ))}
            {activity && <span className="text-xs text-ink/60">{activity}</span>}
          </div>
        )}
      </div>

      <div
        role="group"
        aria-label="Quick replies"
        className="scrollbar-hide flex gap-2 overflow-x-auto border-t border-primary/10 bg-white px-3 py-2"
      >
        {quickReplies.map((chip) => (
          <button
            key={chip}
            type="button"
            onClick={() => sendQuick(chip)}
            className="category-chip whitespace-nowrap px-3 py-1 text-xs"
          >
            {chip}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="relative border-t border-primary/10 bg-white p-3">
        {selectedImage && (
          <div className="absolute bottom-full left-4 mb-2 z-10 transition-all">
            <div className="relative inline-block rounded-lg shadow-soft bg-white p-1 border border-primary/10">
              <img
                src={URL.createObjectURL(selectedImage)}
                alt="Selected attachment preview"
                className="h-16 w-16 rounded object-cover"
              />
              <button
                type="button"
                onClick={() => setSelectedImage(null)}
                aria-label="Remove attached image"
                className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white hover:bg-red-600 shadow"
              >
                <X size={12} aria-hidden="true" />
              </button>
            </div>
          </div>
        )}
        {error && (
          <p role="alert" className="mb-2 rounded-[10px] bg-danger/10 px-3 py-1.5 text-xs font-medium text-danger">
            {error}
          </p>
        )}
        <div className="relative w-full">
          <label htmlFor="chat-message" className="sr-only">
            Message Veera
          </label>
          <input
            id="chat-message"
            value={input}
            onChange={(event) => setInput(event.target.value)}
            placeholder="Ask or attach image..."
            className="w-full rounded-pill border border-primary/20 bg-cream py-3 pl-12 pr-24 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            aria-label="Attach an image"
            title="Attach an image"
            className="absolute left-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-cream text-primary"
          >
            <Paperclip size={16} aria-hidden="true" />
          </button>
          <input
            type="file"
            accept="image/*"
            ref={fileInputRef}
            aria-label="Attach an image"
            className="hidden"
            onChange={(e) => {
              if (e.target.files?.[0]) setSelectedImage(e.target.files[0]);
              e.target.value = "";
            }}
          />
          <button
            type="button"
            onClick={toggleRecording}
            aria-pressed={isRecording}
            aria-label={isRecording ? "Stop voice recording" : "Record a voice message"}
            title={isRecording ? "Stop voice recording" : "Record a voice message"}
            className={`absolute right-12 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full ${isRecording ? "bg-red-500 animate-pulse text-white" : "bg-cream text-primary"}`}
          >
            {isRecording ? (
              <Square size={14} fill="currentColor" aria-hidden="true" />
            ) : (
              <Mic size={14} aria-hidden="true" />
            )}
          </button>
          <button
            type="submit"
            aria-label="Send message"
            title="Send message"
            className="absolute right-2 top-1/2 inline-flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-primary text-white"
          >
            <SendHorizontal size={14} aria-hidden="true" />
          </button>
        </div>
      </form>
    </section>
  );
}
