import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { chatAPI } from "@/api/services";
import { useAuth } from "@/contexts/AuthContext";
import { colors, spacing, radius } from "@/utils/theme";
import Toast from "react-native-toast-message";
import type { Message } from "@/types";

export default function ChatRoomScreen() {
  const route = useRoute<any>();
  const { user } = useAuth();
  const conversationId = route.params.conversationId;

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMsg, setNewMsg] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const typingTimeout = useRef<NodeJS.Timeout | null>(null);

  // Load initial messages
  useEffect(() => {
    chatAPI.getMessages(conversationId).then((data) => {
      setMessages(data.results);
      chatAPI.markAsRead(conversationId);
    });
  }, [conversationId]);

  // WebSocket
  useEffect(() => {
    const ws = chatAPI.connectWebSocket(conversationId);
    wsRef.current = ws;

    ws.onerror = () => {
      Toast.show({ type: "error", text1: "Erreur de connexion au chat" });
    };
    ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      if (data.type === "message") {
        setMessages((prev) => [
          ...prev,
          {
            id: data.data.id,
            conversation: conversationId,
            sender: {
              id: data.data.sender_id,
              first_name: data.data.sender_name?.split(" ")[0] || "",
              last_name: data.data.sender_name?.split(" ")[1] || "",
              avatar: null,
              role: "",
            },
            content: data.data.content,
            message_type: "text",
            attachment: null,
            is_read: false,
            created_at: data.data.created_at,
          },
        ]);
      }
      if (data.type === "typing") setIsTyping(data.is_typing);
    };

    return () => {
      if (typingTimeout.current) clearTimeout(typingTimeout.current);
      ws.close();
    };
  }, [conversationId]);

  const sendMessage = () => {
    const content = newMsg.trim();
    if (!content || !wsRef.current) return;
    wsRef.current.send(JSON.stringify({ type: "text", content }));
    setNewMsg("");
  };

  const handleTyping = () => {
    wsRef.current?.send(JSON.stringify({ type: "typing", is_typing: true }));
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => {
      wsRef.current?.send(JSON.stringify({ type: "typing", is_typing: false }));
    }, 2000);
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMine = item.sender.id === user?.id;
    return (
      <View style={[styles.msgRow, isMine && styles.msgRowMine]}>
        <View style={[styles.msgBubble, isMine ? styles.bubbleMine : styles.bubbleOther]}>
          <Text style={[styles.msgText, isMine && { color: colors.white }]}>
            {item.content}
          </Text>
          <Text style={[styles.msgTime, isMine && { color: colors.primary[200] }]}>
            {new Date(item.created_at).toLocaleTimeString("fr-FR", {
              hour: "2-digit",
              minute: "2-digit",
            })}
            {isMine && (item.is_read ? " ✓✓" : " ✓")}
          </Text>
        </View>
      </View>
    );
  };

  const insets = useSafeAreaInsets();

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={90}
    >
      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderMessage}
        contentContainerStyle={styles.messagesList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
      />

      {/* Typing indicator */}
      {isTyping && (
        <View style={styles.typingRow}>
          <Text style={styles.typingText}>En train d'écrire...</Text>
        </View>
      )}

      {/* Input */}
      <View style={[styles.inputBar, { paddingBottom: Math.max(insets.bottom, spacing.sm) }]}>
        <TextInput
          value={newMsg}
          onChangeText={(t) => { setNewMsg(t); handleTyping(); }}
          placeholder="Votre message..."
          placeholderTextColor={colors.gray[400]}
          style={styles.input}
          multiline
          maxLength={2000}
        />
        <TouchableOpacity
          onPress={sendMessage}
          disabled={!newMsg.trim()}
          style={[styles.sendBtn, !newMsg.trim() && { opacity: 0.4 }]}
        >
          <Ionicons name="send" size={20} color={colors.white} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.gray[50] },
  messagesList: { paddingHorizontal: spacing.lg, paddingVertical: spacing.md },
  msgRow: { marginBottom: spacing.sm, alignItems: "flex-start" },
  msgRowMine: { alignItems: "flex-end" },
  msgBubble: { maxWidth: "78%", borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: colors.primary[500], borderBottomRightRadius: 4 },
  bubbleOther: { backgroundColor: colors.gray[100], borderBottomLeftRadius: 4 },
  msgText: { fontSize: 14, color: colors.gray[800], lineHeight: 20 },
  msgTime: { fontSize: 10, color: colors.gray[400], marginTop: 4, textAlign: "right" },
  typingRow: { paddingHorizontal: spacing.xl, paddingBottom: spacing.xs },
  typingText: { fontSize: 12, color: colors.primary[500], fontStyle: "italic" },
  inputBar: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderTopWidth: 1,
    borderTopColor: colors.gray[100],
    backgroundColor: colors.white,
    gap: spacing.sm,
  },
  input: {
    flex: 1,
    backgroundColor: colors.gray[50],
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 14,
    maxHeight: 100,
    color: colors.gray[900],
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary[500],
    alignItems: "center",
    justifyContent: "center",
  },
});
