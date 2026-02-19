import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// Jest provides describe, it, expect, beforeEach as globals

// Mock gtag before importing the component
jest.mock("@/lib/gtag", () => ({
  trackEvent: jest.fn(),
}));

import CardPage from "../page";

beforeEach(() => {
  jest.restoreAllMocks();
});

describe("K-Card Waitlist Form", () => {
  it("renders the form with fullName and phone inputs", () => {
    render(<CardPage />);
    expect(screen.getByPlaceholderText("Full name")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Phone number")).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    render(<CardPage />);
    expect(
      screen.getByRole("button", { name: /join waitlist/i }),
    ).toBeInTheDocument();
  });

  it("submits POST to /v1/kcard/waitlist and shows success", async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ position: 42 }),
    });
    global.fetch = mockFetch;

    render(<CardPage />);

    await user.type(screen.getByPlaceholderText("Full name"), "Jean Dupont");
    await user.type(screen.getByPlaceholderText("Phone number"), "+50912345678");
    await user.click(screen.getByRole("button", { name: /join waitlist/i }));

    await waitFor(() => {
      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining("/v1/kcard/waitlist"),
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
        }),
      );
    });

    // Should show success state
    await waitFor(() => {
      expect(screen.getByText(/you're on the list/i)).toBeInTheDocument();
    });

    // Should show position
    expect(screen.getByText(/#42/)).toBeInTheDocument();
  });

  it("shows error message when API fails", async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: false,
      json: () => Promise.resolve({ message: "Server error" }),
    });
    global.fetch = mockFetch;

    render(<CardPage />);

    await user.type(screen.getByPlaceholderText("Full name"), "Jean Dupont");
    await user.type(screen.getByPlaceholderText("Phone number"), "+50912345678");
    await user.click(screen.getByRole("button", { name: /join waitlist/i }));

    await waitFor(() => {
      expect(screen.getByText("Server error")).toBeInTheDocument();
    });
  });

  it("handles 'already joined' response — still shows success with position", async () => {
    const user = userEvent.setup();
    const mockFetch = jest.fn().mockResolvedValueOnce({
      ok: true,
      json: () =>
        Promise.resolve({ alreadyJoined: true, position: 10 }),
    });
    global.fetch = mockFetch;

    render(<CardPage />);

    await user.type(screen.getByPlaceholderText("Full name"), "Jean Dupont");
    await user.type(screen.getByPlaceholderText("Phone number"), "+50912345678");
    await user.click(screen.getByRole("button", { name: /join waitlist/i }));

    // alreadyJoined sets formError AND submitted=true, so success view renders
    await waitFor(() => {
      expect(screen.getByText(/you're on the list/i)).toBeInTheDocument();
    });
    expect(screen.getByText(/#10/)).toBeInTheDocument();
  });

  it("disables button while submitting", async () => {
    const user = userEvent.setup();
    // Hang the fetch so we can check the disabled state
    const mockFetch = jest.fn().mockImplementation(
      () => new Promise(() => {}), // never resolves
    );
    global.fetch = mockFetch;

    render(<CardPage />);

    await user.type(screen.getByPlaceholderText("Full name"), "Jean Dupont");
    await user.type(screen.getByPlaceholderText("Phone number"), "+50912345678");
    await user.click(screen.getByRole("button", { name: /join waitlist/i }));

    await waitFor(() => {
      expect(screen.getByText("Submitting...")).toBeInTheDocument();
      expect(screen.getByRole("button", { name: /submitting/i })).toBeDisabled();
    });
  });
});
