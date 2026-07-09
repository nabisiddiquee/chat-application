package com.mdnabi.chat_application.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import javax.crypto.Cipher;
import javax.crypto.spec.GCMParameterSpec;
import javax.crypto.spec.SecretKeySpec;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.SecureRandom;
import java.util.Base64;

@Service
public class MessageEncryptionUtil {

    private static final String AES = "AES";
    private static final String AES_GCM_TRANSFORMATION = "AES/GCM/NoPadding";
    private static final int GCM_TAG_LENGTH = 128;
    private static final int IV_LENGTH = 12;
    private static final String ENCRYPTED_PREFIX = "ENC:";

    private final SecureRandom secureRandom = new SecureRandom();

    @Value("${message.encryption.secret}")
    private String encryptionSecret;

    public String encrypt(String plainText) {
        if (plainText == null || plainText.isBlank()) {
            return plainText;
        }

        try {
            byte[] iv = new byte[IV_LENGTH];
            secureRandom.nextBytes(iv);

            Cipher cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION);
            cipher.init(
                    Cipher.ENCRYPT_MODE,
                    getSecretKey(),
                    new GCMParameterSpec(GCM_TAG_LENGTH, iv)
            );

            byte[] encryptedBytes = cipher.doFinal(plainText.getBytes(StandardCharsets.UTF_8));

            String ivBase64 = Base64.getEncoder().encodeToString(iv);
            String encryptedBase64 = Base64.getEncoder().encodeToString(encryptedBytes);

            return ENCRYPTED_PREFIX + ivBase64 + ":" + encryptedBase64;
        } catch (Exception exception) {
            throw new RuntimeException("Message encryption failed");
        }
    }

    public String decrypt(String encryptedText) {
        if (encryptedText == null || encryptedText.isBlank()) {
            return encryptedText;
        }

        if (!encryptedText.startsWith(ENCRYPTED_PREFIX)) {
            return encryptedText;
        }

        try {
            String value = encryptedText.substring(ENCRYPTED_PREFIX.length());
            String[] parts = value.split(":");

            if (parts.length != 2) {
                return encryptedText;
            }

            byte[] iv = Base64.getDecoder().decode(parts[0]);
            byte[] encryptedBytes = Base64.getDecoder().decode(parts[1]);

            Cipher cipher = Cipher.getInstance(AES_GCM_TRANSFORMATION);
            cipher.init(
                    Cipher.DECRYPT_MODE,
                    getSecretKey(),
                    new GCMParameterSpec(GCM_TAG_LENGTH, iv)
            );

            byte[] decryptedBytes = cipher.doFinal(encryptedBytes);

            return new String(decryptedBytes, StandardCharsets.UTF_8);
        } catch (Exception exception) {
            return encryptedText;
        }
    }

    private SecretKeySpec getSecretKey() {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] keyBytes = digest.digest(encryptionSecret.getBytes(StandardCharsets.UTF_8));

            return new SecretKeySpec(keyBytes, AES);
        } catch (Exception exception) {
            throw new RuntimeException("Invalid encryption secret");
        }
    }
}