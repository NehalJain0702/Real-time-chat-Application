package com.chat.application.app.repository;

import com.chat.application.app.model.ChatMessage;
import com.chat.application.app.model.MessageStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.messaging.handler.annotation.MessageMapping;

import java.util.List;

public interface ChatMessageRepository extends JpaRepository<ChatMessage, Long> {
    @Query("SELECT m FROM ChatMessage m WHERE " +
            "(m.sender = :sender AND m.receiver = :receiver) OR " +
            "(m.sender = :receiver AND m.receiver = :sender)")
    List<ChatMessage> findChatMessages(@Param("sender") String sender,
                                       @Param("receiver") String receiver);
}
