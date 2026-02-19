import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// Jest provides describe, it, expect as globals
import ContactPage from "../page";

describe("ContactPage — Form", () => {
  it("renders all form fields", () => {
    render(<ContactPage />);
    expect(screen.getByPlaceholderText("Jean-Pierre Dupont")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("you@example.com")).toBeInTheDocument();
    expect(
      screen.getByPlaceholderText("Tell us how we can help..."),
    ).toBeInTheDocument();
    // Subject select
    expect(screen.getByText("Select Subject")).toBeInTheDocument();
  });

  it("renders the submit button", () => {
    render(<ContactPage />);
    expect(
      screen.getByRole("button", { name: /send message/i }),
    ).toBeInTheDocument();
  });

  it("shows success state after submit", async () => {
    const user = userEvent.setup();
    render(<ContactPage />);

    // Fill out the form
    await user.type(
      screen.getByPlaceholderText("Jean-Pierre Dupont"),
      "Marie Claire",
    );
    await user.type(
      screen.getByPlaceholderText("you@example.com"),
      "marie@example.com",
    );
    await user.type(
      screen.getByPlaceholderText("Tell us how we can help..."),
      "I need help with my account",
    );

    // Submit the form
    await user.click(screen.getByRole("button", { name: /send message/i }));

    // Success state should appear
    expect(screen.getByText(/message sent/i)).toBeInTheDocument();
  });

  it("renders office locations", () => {
    render(<ContactPage />);
    // Office names appear alongside country in the same element, use substring matching
    expect(screen.getByText(/Virginia Beach/)).toBeInTheDocument();
    expect(screen.getByText(/Port-au-Prince/)).toBeInTheDocument();
    expect(screen.getByText(/Montreal/)).toBeInTheDocument();
  });
});
