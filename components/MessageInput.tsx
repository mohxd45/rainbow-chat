"use client";

import dynamic from "next/dynamic";
import { useMemo, useRef, useState, useEffect } from "react";
import { Send, Smile, Image, Mic, X, Loader2, Ghost, BarChart3, Plus } from "lucide-react";
import { RainbowButton } from "./RainbowButton";
import { uploadFile } from "@/lib/firebase";

const EmojiPicker = dynamic(() => import("emoji-picker-react"), { ssr: false });

interface MessageInputProps {
  onSend: (
    text: string,
    media?: { imageUrl?: string; audioUrl?: string; audioDuration?: number },
    options?: { 
      replyTo?: { id: string; text: string; senderName: string } | null; 
      selfDestruct?: boolean;
      poll?: { question: string; options: string[] } | null;
      viewOnce?: boolean;
    }
  ) => Promise<string | void>;
  onTyping: (typing: boolean) => void;
  disabled?: boolean;
  replyTo?: { id: string; text: string; senderName: string } | null;
  onCancelReply?: () => void;
}

export function MessageInput({ onSend, onTyping, disabled, replyTo, onCancelReply }: MessageInputProps) {
  const [text, setText] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [error, setError] = useState("");
  const [stealthMode, setStealthMode] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (text) {
      setMenuOpen(false);
    }
  }, [text]);

  // Image Upload State
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [attachedImage, setAttachedImage] = useState<File | null>(null);
  const [attachedImageUrl, setAttachedImageUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [viewOnceMode, setViewOnceMode] = useState(false);

  // Poll State
  const [pollOpen, setPollOpen] = useState(false);
  const [pollQuestion, setPollQuestion] = useState("");
  const [pollOptions, setPollOptions] = useState<string[]>(["", ""]);

  // Automatically close other panels when one opens
  useEffect(() => {
    if (pollOpen) {
      setPickerOpen(false);
    }
  }, [pollOpen]);

  useEffect(() => {
    if (pickerOpen) {
      setPollOpen(false);
    }
  }, [pickerOpen]);

  const addPollOption = () => {
    if (pollOptions.length < 6) {
      setPollOptions([...pollOptions, ""]);
    }
  };

  const removePollOption = (index: number) => {
    if (pollOptions.length > 2) {
      setPollOptions(pollOptions.filter((_, idx) => idx !== index));
    }
  };

  const handlePollOptionChange = (index: number, val: string) => {
    const newOptions = [...pollOptions];
    newOptions[index] = val;
    setPollOptions(newOptions);
  };

  const handleCreatePollSubmit = async () => {
    const trimmedQuestion = pollQuestion.trim();
    const validOptions = pollOptions.map(o => o.trim()).filter(Boolean);
    
    if (!trimmedQuestion) {
      setError("Please enter a question for the poll.");
      return;
    }
    if (validOptions.length < 2) {
      setError("Please add at least 2 valid options.");
      return;
    }

    setIsUploading(true);
    setError("");
    try {
      const result = await onSend("", undefined, {
        poll: {
          question: trimmedQuestion,
          options: validOptions
        }
      });
      
      if (result) {
        setError(result);
      } else {
        setPollQuestion("");
        setPollOptions(["", ""]);
        setPollOpen(false);
      }
    } catch (err: any) {
      setError(err.message || "Failed to create poll.");
    } finally {
      setIsUploading(false);
    }
  };

  // Voice Recording State
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const isCancelledRef = useRef(false);
  const recordingDurationRef = useRef(0);

  const remaining = useMemo(() => 500 - text.length, [text]);

  // Clean up object URL when component unmounts or image changes
  useEffect(() => {
    return () => {
      if (attachedImageUrl && attachedImageUrl.startsWith("blob:")) {
        URL.revokeObjectURL(attachedImageUrl);
      }
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, [attachedImageUrl]);

  function handleChange(value: string) {
    setText(value);
    setError("");
    onTyping(true);
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    timeoutRef.current = setTimeout(() => onTyping(false), 1200);
  }

  // --- Image Handlers ---
  const triggerImageSelect = () => {
    fileInputRef.current?.click();
  };

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Image size must be less than 5MB.");
      return;
    }

    setAttachedImage(file);
    const localUrl = URL.createObjectURL(file);
    setAttachedImageUrl(localUrl);
    setError("");
  };

  const clearAttachedImage = () => {
    if (attachedImageUrl && attachedImageUrl.startsWith("blob:")) {
      URL.revokeObjectURL(attachedImageUrl);
    }
    setAttachedImage(null);
    setAttachedImageUrl(null);
    setViewOnceMode(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // --- Recording Handlers ---
  const startRecording = async () => {
    setError("");
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError("Microphone recording is not supported in this browser.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];
      isCancelledRef.current = false;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks to release microphone
        stream.getTracks().forEach((track) => track.stop());

        if (isCancelledRef.current) {
          chunksRef.current = [];
          return;
        }

        const recordedMimeType = mediaRecorder.mimeType || "audio/webm";
        let extension = "webm";
        if (recordedMimeType.includes("mp4")) {
          extension = "mp4";
        } else if (recordedMimeType.includes("aac")) {
          extension = "aac";
        } else if (recordedMimeType.includes("ogg")) {
          extension = "ogg";
        }

        const audioBlob = new Blob(chunksRef.current, { type: recordedMimeType });
        if (audioBlob.size === 0) return;

        const audioFile = new File([audioBlob], `voice-message.${extension}`, {
          type: recordedMimeType,
        });

        setIsUploading(true);
        try {
          const audioUrl = await uploadFile(audioFile);
          await onSend("", { audioUrl, audioDuration: recordingDurationRef.current });
        } catch (err: any) {
          setError(err.message || "Failed to send voice message.");
        } finally {
          setIsUploading(false);
          setIsRecording(false);
          setRecordingDuration(0);
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingDuration(0);
      recordingDurationRef.current = 0;

      recordingIntervalRef.current = setInterval(() => {
        recordingDurationRef.current += 1;
        setRecordingDuration(recordingDurationRef.current);
      }, 1000);
    } catch (err: any) {
      console.error("Microphone access error:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const cancelRecording = () => {
    if (!mediaRecorderRef.current) return;
    isCancelledRef.current = true;
    mediaRecorderRef.current.stop();
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
    setIsRecording(false);
    setRecordingDuration(0);
  };

  const stopAndSendRecording = () => {
    if (!mediaRecorderRef.current) return;
    isCancelledRef.current = false;
    mediaRecorderRef.current.stop();
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
    }
  };

  const formatRecordingTime = (secs: number) => {
    const mins = Math.floor(secs / 60);
    const remainder = secs % 60;
    return `${mins}:${remainder < 10 ? "0" : ""}${remainder}`;
  };

  // --- Submit Message ---
  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() && !attachedImage) return;

    setIsUploading(true);
    setError("");

    try {
      let uploadedImageUrl = undefined;
      if (attachedImage) {
        uploadedImageUrl = await uploadFile(attachedImage);
      }

      const result = await onSend(
        text,
        uploadedImageUrl ? { imageUrl: uploadedImageUrl } : undefined,
        { replyTo, selfDestruct: stealthMode, viewOnce: viewOnceMode }
      );

      if (result) {
        setError(result);
      } else {
        setText("");
        setAttachedImage(null);
        setAttachedImageUrl(null);
        setViewOnceMode(false);
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        if (onCancelReply) onCancelReply();
      }
    } catch (err: any) {
      setError(err.message || "Failed to upload image.");
    } finally {
      setIsUploading(false);
      onTyping(false);
    }
  }

  const isControlsDisabled = disabled || isUploading;

  return (
    <div className="glass rounded-none sm:rounded-3xl p-3 pb-6 sm:pb-3 relative border-x-0 border-b-0 border-t border-white/10 sm:border sm:neon-border">
      {/* Backdrop for click-away */}
      {menuOpen && (
        <div className="fixed inset-0 z-20 cursor-default" onClick={() => setMenuOpen(false)} />
      )}

      {/* Floating Action Menu (+ click options) */}
      {menuOpen && (
        <div className="absolute bottom-16 left-3 z-30 flex gap-3 rounded-2xl border border-white/10 bg-black/95 p-3 shadow-[0_10px_30px_rgba(0,0,0,0.6)] backdrop-blur-md animate-in slide-in-from-bottom duration-200">
          {/* Action: Photo */}
          <button
            type="button"
            onClick={() => {
              triggerImageSelect();
              setMenuOpen(false);
            }}
            disabled={isControlsDisabled}
            className="flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition"
            title="Attach Photo"
          >
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-cyan-500/10 text-cyan-300 hover:bg-cyan-500/20 transition">
              <Image className="h-5 w-5" />
            </div>
            <span className="text-[9px] text-white/70 font-bold">Photo</span>
          </button>

          {/* Action: Voice */}
          <button
            type="button"
            onClick={() => {
              startRecording();
              setMenuOpen(false);
            }}
            disabled={isControlsDisabled}
            className="flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition"
            title="Record Voice Note"
          >
            <div className="grid h-10 w-10 place-items-center rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition">
              <Mic className="h-5 w-5" />
            </div>
            <span className="text-[9px] text-white/70 font-bold">Voice</span>
          </button>

          {/* Action: Stealth */}
          <button
            type="button"
            onClick={() => {
              setStealthMode((v) => !v);
              setMenuOpen(false);
            }}
            disabled={isControlsDisabled}
            className="flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition"
            title="Toggle Stealth Mode"
          >
            <div className={`grid h-10 w-10 place-items-center rounded-2xl transition ${
              stealthMode
                ? "bg-pink-500/35 text-pink-300 border border-pink-500/50 shadow-[0_0_10px_rgba(244,114,182,0.3)] animate-pulse"
                : "bg-pink-500/10 text-pink-400 hover:bg-pink-500/20"
            }`}>
              <Ghost className="h-5 w-5" />
            </div>
            <span className="text-[9px] text-white/70 font-bold">Stealth</span>
          </button>

          {/* Action: Poll */}
          <button
            type="button"
            onClick={() => {
              setPollOpen((v) => !v);
              setMenuOpen(false);
            }}
            disabled={isControlsDisabled}
            className="flex flex-col items-center gap-1 hover:scale-105 active:scale-95 transition"
            title="Create Poll"
          >
            <div className={`grid h-10 w-10 place-items-center rounded-2xl transition ${
              pollOpen
                ? "bg-cyan-500/35 text-cyan-300 border border-cyan-500/50 shadow-[0_0_10px_rgba(34,211,238,0.3)] animate-pulse"
                : "bg-cyan-500/10 text-cyan-400 hover:bg-cyan-500/20"
            }`}>
              <BarChart3 className="h-5 w-5" />
            </div>
            <span className="text-[9px] text-white/70 font-bold">Poll</span>
          </button>
        </div>
      )}
      {/* Reply Preview */}
      {replyTo && (
        <div className="mb-3 flex items-center justify-between rounded-2xl border border-cyan-400/25 bg-cyan-950/20 px-4 py-2.5 text-xs animate-in slide-in-from-bottom duration-200">
          <div className="flex flex-col min-w-0">
            <span className="font-semibold text-cyan-300">Replying to {replyTo.senderName}</span>
            <span className="truncate text-white/60 mt-0.5">{replyTo.text}</span>
          </div>
          <button
            type="button"
            onClick={onCancelReply}
            className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white transition"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      )}
      {/* Hidden file input */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleImageSelect}
        accept="image/*"
        className="hidden"
        disabled={isControlsDisabled}
      />

      {/* Image Preview */}
      {attachedImageUrl && (
        <div className="relative mb-3 flex w-fit items-center gap-3 rounded-2xl border border-white/10 bg-white/5 p-2 pr-10">
          <img
            src={attachedImageUrl}
            alt="Upload Preview"
            className="h-16 w-16 rounded-xl object-cover border border-white/5"
          />
          <div className="flex flex-col justify-center">
            <button
              type="button"
              onClick={() => setViewOnceMode(!viewOnceMode)}
              className={`flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold border transition ${
                viewOnceMode
                  ? "border-pink-500/35 bg-pink-500/15 text-pink-300 shadow-[0_0_10px_rgba(244,114,182,0.25)] animate-pulse"
                  : "border-white/10 bg-white/5 text-white/70 hover:bg-white/10 hover:text-white"
              }`}
            >
              <span>🔥 Burn After Reading</span>
            </button>
          </div>
          <button
            type="button"
            onClick={clearAttachedImage}
            className="absolute right-2 top-2 rounded-full bg-black/50 p-1 text-white hover:bg-black/80 transition"
            disabled={isControlsDisabled}
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>
      )}

      {/* Poll Creator Builder panel */}
      {pollOpen && (
        <div className="mb-3 rounded-2xl border border-cyan-400/20 bg-[#0d1527]/90 p-4 space-y-3 shadow-[0_0_15px_rgba(34,211,238,0.15)] animate-in slide-in-from-bottom duration-200">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider flex items-center gap-1.5">
              <BarChart3 className="h-4 w-4" /> Create Anonymous Poll
            </span>
            <button
              type="button"
              onClick={() => setPollOpen(false)}
              className="rounded-full p-1 text-white/40 hover:bg-white/10 hover:text-white transition"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          
          <input
            type="text"
            value={pollQuestion}
            onChange={(e) => setPollQuestion(e.target.value)}
            placeholder="Ask a question..."
            maxLength={100}
            className="w-full rounded-xl border border-white/10 bg-black/40 px-3.5 py-2.5 text-xs outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40 text-white"
          />

          <div className="space-y-2 max-h-40 overflow-y-auto pr-1">
            {pollOptions.map((opt, index) => (
              <div key={index} className="flex items-center gap-2">
                <input
                  type="text"
                  value={opt}
                  onChange={(e) => handlePollOptionChange(index, e.target.value)}
                  placeholder={`Option ${index + 1}`}
                  maxLength={50}
                  className="flex-1 rounded-xl border border-white/10 bg-black/40 px-3.5 py-2 text-xs outline-none focus:border-cyan-300/40 focus:ring-1 focus:ring-cyan-300/40 text-white"
                />
                {pollOptions.length > 2 && (
                  <button
                    type="button"
                    onClick={() => removePollOption(index)}
                    className="p-1.5 text-red-400 hover:bg-red-500/10 rounded-lg transition"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="flex justify-between items-center pt-1">
            {pollOptions.length < 6 ? (
              <button
                type="button"
                onClick={addPollOption}
                className="text-xs text-cyan-300 hover:text-cyan-200 hover:underline transition font-semibold"
              >
                + Add Option
              </button>
            ) : (
              <span className="text-[10px] text-white/30">Maximum 6 options</span>
            )}
            
            <button
              type="button"
              onClick={handleCreatePollSubmit}
              disabled={!pollQuestion.trim() || pollOptions.filter(o => o.trim()).length < 2}
              className="rounded-xl bg-cyan-400 hover:bg-cyan-500 active:scale-95 disabled:opacity-50 disabled:active:scale-100 text-black font-bold text-xs px-3.5 py-2 transition"
            >
              Post Poll
            </button>
          </div>
        </div>
      )}

      {/* Emoji Picker */}
      {pickerOpen && !isRecording && (
        <div className="mb-3 overflow-hidden rounded-3xl">
          <EmojiPicker
            width="100%"
            height={360}
            onEmojiClick={(emoji) => handleChange(text + emoji.emoji)}
          />
        </div>
      )}

      {/* Inputs Section */}
      {isRecording ? (
        /* VOICE RECORDING VIEW */
        <div className="flex items-center justify-between gap-4 py-2 px-3 bg-red-500/10 rounded-2xl border border-red-500/20">
          <div className="flex items-center gap-2 text-red-200">
            <span className="h-2.5 w-2.5 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs font-semibold uppercase tracking-wider">Recording Voice</span>
            <span className="font-mono text-sm font-semibold">{formatRecordingTime(recordingDuration)}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={cancelRecording}
              className="rounded-xl bg-white/10 p-2.5 text-white/70 hover:bg-white/15 hover:text-white transition"
              title="Cancel Recording"
            >
              <X className="h-5 w-5" />
            </button>
            <button
              type="button"
              onClick={stopAndSendRecording}
              disabled={isUploading}
              className="flex h-11 w-11 items-center justify-center rounded-xl bg-red-500 text-white hover:bg-red-600 transition disabled:opacity-50"
              title="Send Voice Note"
            >
              {isUploading ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </button>
          </div>
        </div>
      ) : (
        /* STANDARD INPUT VIEW */
        <form onSubmit={submit} className="flex items-end gap-2 relative z-30">
          {/* Emoji Button */}
          <button
            type="button"
            onClick={() => setPickerOpen((v) => !v)}
            disabled={isControlsDisabled}
            className="rounded-2xl bg-white/10 p-3 hover:bg-white/15 transition disabled:opacity-50 shrink-0"
            title="Emoji Picker"
          >
            <Smile className="h-5 w-5" />
          </button>

          {/* Plus Actions Button */}
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            disabled={isControlsDisabled}
            className={`rounded-2xl p-3 transition disabled:opacity-50 shrink-0 ${
              menuOpen
                ? "bg-cyan-500/25 text-cyan-300 border border-cyan-500/40"
                : "bg-white/10 text-white/70 hover:bg-white/15"
            }`}
            title="Attach/Actions"
          >
            <Plus className={`h-5 w-5 transition duration-200 ${menuOpen ? "rotate-45" : ""}`} />
          </button>

          {/* Text Area */}
          <textarea
            value={text}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={
              isUploading
                ? "Uploading attachment..."
                : attachedImage
                ? "Send with image..."
                : stealthMode
                ? "Send disappearing message..."
                : "Send an anonymous message..."
            }
            rows={1}
            maxLength={500}
            disabled={isControlsDisabled}
            className="max-h-32 min-h-12 flex-1 resize-none rounded-2xl border border-white/10 bg-black/30 px-4 py-3 text-sm outline-none ring-cyan-300/40 focus:ring-2 disabled:opacity-50"
          />

          {/* Send Button */}
          <RainbowButton
            disabled={isControlsDisabled || (!text.trim() && !attachedImage)}
            type="submit"
            className="px-4 py-3 shrink-0 flex items-center justify-center"
          >
            {isUploading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <Send className="h-5 w-5" />
            )}
          </RainbowButton>
        </form>
      )}

      {/* Error & Character Count footer */}
      <div className="mt-2 flex justify-between items-center px-2 text-xs">
        <span className="text-red-200/80">
          {error || (stealthMode && (
            <span className="text-pink-300 flex items-center gap-1 font-semibold">
              <Ghost className="h-3.5 w-3.5" /> Stealth Mode: messages self-destruct in 15 seconds
            </span>
          ))}
        </span>
        {!isRecording && (
          <span className={remaining < 50 ? "text-yellow-200" : "text-white/35"}>
            {remaining}
          </span>
        )}
      </div>
    </div>
  );
}
