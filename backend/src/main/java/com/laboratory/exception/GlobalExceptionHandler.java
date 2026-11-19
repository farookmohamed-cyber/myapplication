package com.laboratory.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.validation.FieldError;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.stream.Collectors;

/**
 * OOP CONCEPT 3 (EXCEPTION HANDLING):
 * Centralized exception handler translating custom domain exceptions and validation failures
 * into meaningful HTTP error responses.
 */
@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler({PatientNotFoundException.class, TestNotFoundException.class})
    public ResponseEntity<Map<String, Object>> handleNotFound(RuntimeException ex) {
        return buildError(HttpStatus.NOT_FOUND, ex.getClass().getSimpleName(), ex.getMessage());
    }

    @ExceptionHandler({InvalidSampleException.class, InvalidTestResultException.class, IllegalArgumentException.class})
    public ResponseEntity<Map<String, Object>> handleBadRequest(RuntimeException ex) {
        return buildError(HttpStatus.BAD_REQUEST, ex.getClass().getSimpleName(), ex.getMessage());
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<Map<String, Object>> handleValidation(MethodArgumentNotValidException ex) {
        String details = ex.getBindingResult()
                .getFieldErrors()
                .stream()
                .map(FieldError::getDefaultMessage)
                .collect(Collectors.joining("; "));
        return buildError(HttpStatus.BAD_REQUEST, "ValidationError", details);
    }

    @ExceptionHandler(Exception.class)
    public ResponseEntity<Map<String, Object>> handleGeneral(Exception ex) {
        return buildError(HttpStatus.INTERNAL_SERVER_ERROR, "InternalServerError", ex.getMessage());
    }

    private ResponseEntity<Map<String, Object>> buildError(HttpStatus status, String errorType, String message) {
        Map<String, Object> body = new LinkedHashMap<>();
        body.put("timestamp", LocalDateTime.now().toString());
        body.put("status", status.value());
        body.put("error", errorType);
        body.put("message", message);
        return ResponseEntity.status(status).body(body);
    }
}
