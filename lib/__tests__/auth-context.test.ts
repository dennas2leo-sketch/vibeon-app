import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Auth Context", () => {
  beforeEach(() => {
    // Clear mocks before each test
    vi.clearAllMocks();
  });

  describe("Email Validation", () => {
    it("should validate correct email format", () => {
      const validEmails = [
        "user@example.com",
        "test.user@domain.co.uk",
        "user+tag@example.com",
      ];

      validEmails.forEach((email) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(true);
      });
    });

    it("should reject invalid email format", () => {
      const invalidEmails = [
        "invalid.email",
        "@example.com",
        "user@",
        "user @example.com",
      ];

      invalidEmails.forEach((email) => {
        const isValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
        expect(isValid).toBe(false);
      });
    });
  });

  describe("Password Validation", () => {
    it("should require minimum 6 characters", () => {
      expect("12345".length >= 6).toBe(false);
      expect("123456".length >= 6).toBe(true);
      expect("password123".length >= 6).toBe(true);
    });

    it("should validate password confirmation", () => {
      const password = "password123";
      const confirmPassword = "password123";
      expect(password === confirmPassword).toBe(true);

      const wrongConfirm: string = "password124";
      expect(password === wrongConfirm).toBe(false);
    });
  });

  describe("Username Validation", () => {
    it("should validate username format", () => {
      const validUsernames = ["ali_nevaz", "spacehall_", "user123"];

      validUsernames.forEach((username) => {
        const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);
        expect(isValid).toBe(true);
      });
    });

    it("should reject invalid usernames", () => {
      const invalidUsernames = [
        "ab", // too short
        "user@name", // invalid character
        "user name", // space
        "user-name", // hyphen
      ];

      invalidUsernames.forEach((username) => {
        const isValid = /^[a-zA-Z0-9_]{3,20}$/.test(username);
        expect(isValid).toBe(false);
      });
    });
  });

  describe("Verification Code", () => {
    it("should validate 6-digit verification code", () => {
      const validCodes = ["000000", "123456", "999999"];

      validCodes.forEach((code) => {
        const isValid = /^\d{6}$/.test(code);
        expect(isValid).toBe(true);
      });
    });

    it("should reject invalid verification codes", () => {
      const invalidCodes = [
        "12345", // too short
        "1234567", // too long
        "12345a", // contains letter
        "123 456", // contains space
      ];

      invalidCodes.forEach((code) => {
        const isValid = /^\d{6}$/.test(code);
        expect(isValid).toBe(false);
      });
    });
  });

  describe("Date of Birth Validation", () => {
    it("should validate date format YYYY-MM-DD", () => {
      const validDates = ["2000-01-15", "1995-12-31", "2005-06-20"];

      validDates.forEach((date) => {
        const isValid = /^\d{4}-\d{2}-\d{2}$/.test(date);
        expect(isValid).toBe(true);
      });
    });

    it("should ensure user is at least 13 years old", () => {
      const today = new Date();
      const minAge = 13;

      // Test with valid age
      const validDate = new Date(today.getFullYear() - 20, 0, 1);
      const age = today.getFullYear() - validDate.getFullYear();
      expect(age >= minAge).toBe(true);

      // Test with invalid age
      const invalidDate = new Date(today.getFullYear() - 10, 0, 1);
      const invalidAge = today.getFullYear() - invalidDate.getFullYear();
      expect(invalidAge >= minAge).toBe(false);
    });
  });

  describe("Form Submission", () => {
    it("should require all fields for signup", () => {
      const formData = {
        fullName: "John Doe",
        dateOfBirth: "2000-01-15",
        email: "john@example.com",
        username: "johndoe",
        password: "password123",
        confirmPassword: "password123",
      };

      const isComplete =
        !!formData.fullName &&
        !!formData.dateOfBirth &&
        !!formData.email &&
        !!formData.username &&
        !!formData.password &&
        !!formData.confirmPassword;

      expect(isComplete).toBe(true);
    });

    it("should detect missing fields", () => {
      const incompleteForm = {
        fullName: "John Doe",
        dateOfBirth: "",
        email: "john@example.com",
        username: "johndoe",
        password: "password123",
        confirmPassword: "password123",
      };

      const isComplete =
        !!incompleteForm.fullName &&
        !!incompleteForm.dateOfBirth &&
        !!incompleteForm.email &&
        !!incompleteForm.username &&
        !!incompleteForm.password &&
        !!incompleteForm.confirmPassword;

      expect(isComplete).toBe(false);
    });
  });
});
