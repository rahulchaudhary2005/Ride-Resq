import { useEffect, useState } from "react";
import { View, Text, TextInput, Pressable, FlatList, StyleSheet } from "react-native";
import { getSocket } from "../../services/socket";
import { useAuth } from "../../store/authStore";
import type { ChatMessage } from "@roadguard/shared-types";

export function ChatScreen({ route }: any) {
  const { requestId } = route.params;
  const { user } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");

  useEffect(() => {
    let socketRef: any;
    (async () => {
      const socket = await getSocket();
      socketRef = socket;
      socket.emit("chat:join", { requestId });
      socket.on("chat:message", (msg: ChatMessage) => setMessages((prev) => [...prev, msg]));
    })();
    return () => socketRef?.off("chat:message");
  }, [requestId]);

  async function send() {
    if (!input.trim()) return;
    const socket = await getSocket();
    socket.emit("chat:message", { requestId, message: input.trim() });
    setInput("");
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={{ padding: 16 }}
        renderItem={({ item }) => (
          <View style={[styles.bubble, item.senderId === user?.id ? styles.mine : styles.theirs]}>
            <Text style={styles.bubbleText}>{item.message}</Text>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message"
          placeholderTextColor="#64748B"
        />
        <Pressable style={styles.sendButton} onPress={send}>
          <Text style={styles.sendText}>Send</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#0F172A" },
  bubble: { maxWidth: "75%", borderRadius: 14, padding: 10, marginBottom: 8 },
  mine: { backgroundColor: "#EF4444", alignSelf: "flex-end" },
  theirs: { backgroundColor: "#1E293B", alignSelf: "flex-start" },
  bubbleText: { color: "#fff" },
  inputRow: { flexDirection: "row", padding: 12, gap: 8 },
  input: { flex: 1, backgroundColor: "#1E293B", color: "#fff", borderRadius: 10, padding: 12 },
  sendButton: { backgroundColor: "#EF4444", borderRadius: 10, padding: 12, justifyContent: "center" },
  sendText: { color: "#fff", fontWeight: "600" },
});
