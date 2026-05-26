package com.chat.application.app.Controller;


import com.chat.application.app.Service.UserService;
import com.chat.application.app.model.User;

import org.springframework.web.bind.annotation.*;

import java.util.List;
@RestController
@RequestMapping("/api/users")

public class UserController {
   private final UserService userService;


    public UserController( UserService userService) {
        this.userService = userService;

    }
    @PostMapping("/login")
    public User login(@RequestBody User loginUser) {

        return userService.loginUser(
                loginUser.getUsername(),
                loginUser.getPassword()
        );
    }
    @GetMapping
    public List<User> getAllUsers() {

        return userService.getAllUsers();
    }
    @PostMapping("/register")
    public User registerUser(@RequestBody User user) {
        return userService.saveUser(user);
    }
}
