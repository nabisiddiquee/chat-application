package com.mdnabi.chat_application.repository;

import com.mdnabi.chat_application.entity.User;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;

public interface UserRepository extends JpaRepository<User, Long> {

    Optional<User> findByEmail(String email);

    boolean existsByEmail(String email);

    List<User> findByEmailNot(String email);

    @Query("""
            SELECT u FROM User u
            WHERE u.email <> :currentEmail
            AND (
                LOWER(u.name) LIKE LOWER(CONCAT('%', :keyword, '%'))
                OR LOWER(u.email) LIKE LOWER(CONCAT('%', :keyword, '%'))
            )
            """)
    List<User> searchUsers(
            @Param("keyword") String keyword,
            @Param("currentEmail") String currentEmail
    );
}