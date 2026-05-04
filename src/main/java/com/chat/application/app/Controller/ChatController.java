package com.chat.application.app.Controller;

import com.chat.application.app.model.ChatMessage;
import com.chat.application.app.model.MessageStatus;
import com.chat.application.app.repository.ChatMessageRepository;
import org.springframework.messaging.handler.annotation.MessageMapping;
import org.springframework.messaging.handler.annotation.SendTo;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.GetMapping;

import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ChatController {
    private final ChatMessageRepository messageRepository;

    public ChatController(SimpMessagingTemplate messagingTemplate,
                          ChatMessageRepository messageRepository) {
        this.messagingTemplate = messagingTemplate;
        this.messageRepository = messageRepository;
    }
    private final SimpMessagingTemplate messagingTemplate;



    // SEND MESSAGE
    @MessageMapping("/sendMessage")
    public void sendMessage(ChatMessage message) {

        // Step 1: mark as SENT
        message.setStatus(MessageStatus.SENT);
        messageRepository.save(message);
        // send to receiver
        messagingTemplate.convertAndSend("/topic/messages", message);
    }
        @MessageMapping("/delivered")
        public void markDelivered(Long id) {

            ChatMessage msg = messageRepository.findById(id).orElse(null);

            if (msg != null) {
                msg.setStatus(MessageStatus.DELIVERED);
                messageRepository.save(msg);

                messagingTemplate.convertAndSend("/topic/messages", msg);
            }
        }



    // MARK AS SEEN
    @MessageMapping("/seen")
    public void markAsSeen(Long id) {

        ChatMessage msg = messageRepository.findById(id).orElse(null);
        
        if (msg != null) {
            msg.setStatus(MessageStatus.SEEN);
            messageRepository.save(msg);
            // notify sender that message is seen
            messagingTemplate.convertAndSend("/topic/messages", msg);
        }
    }
    @GetMapping("/messages/{sender}/{receiver}")
    public List<ChatMessage> getMessages(
            @PathVariable String sender,
            @PathVariable String receiver) {

        return messageRepository.findChatMessages(sender, receiver);
    }
    @GetMapping("/")
    public String chat() {
        return "Chat App Backend is Running ";
    }
}
