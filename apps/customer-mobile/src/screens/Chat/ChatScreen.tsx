import React, { useEffect, useRef, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";
import { connectSocket } from "../../services/socketClient";
import { useAuthStore } from "../../store/authStore";
import type { ChatMessage } from "@roadguard/shared-types";

export default function ChatScreen({ route }: any) {
  const { requestId } = route.params;
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [text, setText] = useState("");
  const user = useAuthStore((s) => s.user);
  const listRef = useRef<FlatList>(null);

  useEffect(() => {
    let socketRef: any;
    (async () => {
      const socket = await connectSocket();
      socketRef = socket;
      socket.emit("chat:join", { requestId });
      socket.on("chat:message", (msg: ChatMessage) => {
        setMessages((prev) => [...prev, msg]);
      });
    })();
    return () => socketRef?.off("chat:message");
  }, [requestId]);

  const send = async () => {
    if (!text.trim()) return;
    const socket = await connectSocket();
    socket.emit("chat:message", { requestId, message: text.trim() });
    setText("");
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <FlatList
        ref={listRef}
        data={messages}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => listRef.current?.scrollToEnd({ animated: true })}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.senderId === user?.id ? styles.bubbleMine : styles.bubbleTheirs]}>
            <Text style={styles.bubbleText}>{item.message}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={text}
          onChangeText={setText}
          placeholder="Type a message..."
          placeholderTextColor="#6B7280"
        />
        <TouchableOpacity style={styles.sendButton} onPress={send}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0B1220" },
  bubble: { maxWidth: "75%", padding: 12, borderRadius: 14, marginBottom: 8 },
  bubbleMine: { backgroundColor: "#F59E0B", alignSelf: "flex-end" },
  bubbleTheirs: { backgroundColor: "#111827", alignSelf: "flex-start" },
  bubbleText: { color: "#0B1220" },
  inputRow: { flexDirection: "row", padding: 12, borderTopWidth: 1, borderTopColor: "#1F2937" },
  input: { flex: 1, backgroundColor: "#111827", color: "#fff", borderRadius: 10, padding: 12, marginRight: 8 },
  sendButton: { backgroundColor: "#F59E0B", borderRadius: 10, paddingHorizontal: 18, justifyContent: "center" },
  sendButtonText: { color: "#0B1220", fontWeight: "700" },
});
