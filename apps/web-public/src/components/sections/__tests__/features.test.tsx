import { render, screen } from "@testing-library/react";
// Jest provides describe, it, expect as globals
import { FeaturesSection } from "../features";
import { mockDict } from "@/test/mock-dict";

describe("FeaturesSection", () => {
  it("renders the section heading", () => {
    render(<FeaturesSection dict={mockDict} />);
    expect(
      screen.getByRole("heading", { name: /Why KobKlein/i }),
    ).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<FeaturesSection dict={mockDict} />);
    expect(
      screen.getByText(/Everything you need for modern digital payments/i),
    ).toBeInTheDocument();
  });

  it("renders all 6 feature cards with titles", () => {
    render(<FeaturesSection dict={mockDict} />);
    const expectedTitles = [
      "K-Pay Instant Transfers",
      "Bank-Grade Security",
      "K-Link Global Network",
      "K-Card Virtual Card",
      "Lowest Fees Guaranteed",
      "K-Code & K-Scan",
    ];

    for (const title of expectedTitles) {
      expect(screen.getByText(title)).toBeInTheDocument();
    }
  });

  it("renders feature descriptions", () => {
    render(<FeaturesSection dict={mockDict} />);
    expect(
      screen.getByText("Send and receive money in real-time."),
    ).toBeInTheDocument();
    expect(
      screen.getByText("Shop Netflix, Amazon, and more."),
    ).toBeInTheDocument();
  });
});
