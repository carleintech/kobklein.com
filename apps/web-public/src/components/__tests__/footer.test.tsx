import { render, screen } from "@testing-library/react";
// Jest provides describe, it, expect as globals
import { Footer } from "../footer";
import { mockDict } from "@/test/mock-dict";

const baseProps = { dict: mockDict, locale: "en" as const };

describe("Footer", () => {
  it("renders the footer logo", () => {
    render(<Footer {...baseProps} />);
    expect(screen.getByAltText("KobKlein Footer Logo")).toBeInTheDocument();
  });

  it("renders the tagline", () => {
    render(<Footer {...baseProps} />);
    expect(screen.getByText("Your money, in your hands.")).toBeInTheDocument();
  });

  it("renders 3 link groups — Product, Company, Legal", () => {
    render(<Footer {...baseProps} />);
    expect(screen.getByText("Product")).toBeInTheDocument();
    expect(screen.getByText("Company")).toBeInTheDocument();
    expect(screen.getByText("Legal")).toBeInTheDocument();
  });

  it("renders social icons with aria-labels", () => {
    render(<Footer {...baseProps} />);
    expect(screen.getByLabelText("Twitter")).toBeInTheDocument();
    expect(screen.getByLabelText("Instagram")).toBeInTheDocument();
    expect(screen.getByLabelText("Facebook")).toBeInTheDocument();
    expect(screen.getByLabelText("YouTube")).toBeInTheDocument();
  });

  it("renders the current year in copyright", () => {
    render(<Footer {...baseProps} />);
    const year = new Date().getFullYear().toString();
    const copyright = screen.getByText((content) =>
      content.includes(year) && content.includes("KobKlein"),
    );
    expect(copyright).toBeInTheDocument();
  });

  it("renders compliance badges (PCI, SOC, AML)", () => {
    render(<Footer {...baseProps} />);
    expect(screen.getByText("PCI")).toBeInTheDocument();
    expect(screen.getByText("SOC")).toBeInTheDocument();
    expect(screen.getByText("AML")).toBeInTheDocument();
  });
});
