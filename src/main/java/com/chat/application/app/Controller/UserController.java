package com.chat.application.app.Controller;

import com.chat.application.app.model.User;
import com.chat.application.app.repository.UserRepository;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
@RestController
@RequestMapping("/api/users")
@CrossOrigin(origins = "")
public class UserController {
    private final UserRepository userRepository;

    public UserController(UserRepository userRepository) {
        this.userRepository = userRepository;
    }

    @GetMapping
    public List<User> getAllUsers() {
        return userRepository.findAll();
    }
    @GetMapping("/add-test-users")
    public String addUsers() {
        userRepository.save(new User(null, "Rahul"));
        userRepository.save(new User(null, "Yash"));

        return "Users added";
    }
}
