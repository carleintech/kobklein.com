import { render, screen } from "@testing-library/react";
// Jest provides describe, it, expect as globals
import { HeroSection } from "../hero";
import { mockDict } from "@/test/mock-dict";

describe("HeroSection", () => {
  it("renders the headline h1", () => {
    render(<HeroSection dict={mockDict} />);
    expect(
      screen.getByRole("heading", { level: 1 }),
    ).toHaveTextContent("Your Money. Your Power. No Banks.");
  });

  it("renders the subtitle", () => {
    render(<HeroSection dict={mockDict} />);
    expect(
      screen.getByText(/secure digital wallet connecting Haiti/i),
    ).toBeInTheDocument();
  });

  it("renders CTA buttons", () => {
    render(<HeroSection dict={mockDict} />);
    expect(screen.getByText("Get Started")).toBeInTheDocument();
    expect(screen.getByText("See How It Works")).toBeInTheDocument();
  });

  it("displays all 4 stats", () => {
    render(<HeroSection dict={mockDict} />);
    expect(screen.getByText("100K+")).toBeInTheDocument();
    expect(screen.getByText("$50M+")).toBeInTheDocument();
    expect(screen.getByText("15+")).toBeInTheDocument();
    expect(screen.getByText("99.9%")).toBeInTheDocument();
  });

  it("renders 3 hero feature blocks", () => {
    render(<HeroSection dict={mockDict} />);
    expect(screen.getByText("Bank-Grade Security")).toBeInTheDocument();
    expect(screen.getByText("Instant Processing")).toBeInTheDocument();
    expect(screen.getByText("Zero Hidden Fees")).toBeInTheDocument();
  });
});
