package com.laboratory.exception;

public class InvalidTestResultException extends RuntimeException {
    public InvalidTestResultException(String message) {
        super(message);
    }
}
