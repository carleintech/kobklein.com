import { render, screen } from "@testing-library/react";
// Jest provides describe, it, expect as globals
import { ComparisonSection } from "../comparison";
import { mockDict } from "@/test/mock-dict";

describe("ComparisonSection", () => {
  it("renders the section heading", () => {
    render(<ComparisonSection dict={mockDict} />);
    expect(
      screen.getByRole("heading", { name: /Compare & Save/i }),
    ).toBeInTheDocument();
  });

  it("renders the subtitle", () => {
    render(<ComparisonSection dict={mockDict} />);
    expect(
      screen.getByText(/smartest way to send money to Haiti/i),
    ).toBeInTheDocument();
  });

  it("renders column headers", () => {
    render(<ComparisonSection dict={mockDict} />);
    expect(screen.getByText("Route")).toBeInTheDocument();
    expect(screen.getByText("Western Union")).toBeInTheDocument();
    expect(screen.getByText("MoneyGram")).toBeInTheDocument();
    expect(screen.getByText("KobKlein")).toBeInTheDocument();
  });

  it("renders all 4 route rows", () => {
    render(<ComparisonSection dict={mockDict} />);
    expect(screen.getByText("US → Haiti ($100)")).toBeInTheDocument();
    expect(screen.getByText("KobKlein → KobKlein")).toBeInTheDocument();
    expect(screen.getByText("Cash-out at Agent")).toBeInTheDocument();
    expect(screen.getByText("K-Card Purchase")).toBeInTheDocument();
  });

  it("shows KobKlein prices in the table", () => {
    render(<ComparisonSection dict={mockDict} />);
    expect(screen.getByText("$1.99")).toBeInTheDocument();
    expect(screen.getByText("FREE")).toBeInTheDocument();
    expect(screen.getByText("$0.99")).toBeInTheDocument();
    expect(screen.getByText("$0.49")).toBeInTheDocument();
  });

  it("renders a proper table element", () => {
    render(<ComparisonSection dict={mockDict} />);
    const table = screen.getByRole("table");
    expect(table).toBeInTheDocument();
  });
});
