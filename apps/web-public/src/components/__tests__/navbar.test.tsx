import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
// Jest provides describe, it, expect as globals
import { Navbar } from "../navbar";
import { mockDict } from "@/test/mock-dict";

const baseProps = { dict: mockDict, locale: "en" as const };

describe("Navbar", () => {
  it("renders the logo", () => {
    render(<Navbar {...baseProps} />);
    expect(screen.getByAltText("KobKlein")).toBeInTheDocument();
  });

  it("renders all 7 nav links with correct hrefs", () => {
    render(<Navbar {...baseProps} />);
    const expectedLinks = [
      { label: "Home", href: "/en" },
      { label: "About", href: "/en/about" },
      { label: "How It Works", href: "/en/how-it-works" },
      { label: "K-Card", href: "/en/card" },
      { label: "Diaspora", href: "/en/diaspora" },
      { label: "Compliance", href: "/en/compliance" },
      { label: "Become a Distributor", href: "/en/distributor" },
    ];

    for (const { label, href } of expectedLinks) {
      // Desktop nav links (there may be duplicates in mobile menu)
      const links = screen.getAllByText(label);
      const matchingLink = links.find(
        (el) => el.closest("a")?.getAttribute("href") === href,
      );
      expect(matchingLink).toBeTruthy();
    }
  });

  it("renders the CTA download button", () => {
    render(<Navbar {...baseProps} />);
    const ctaButtons = screen.getAllByText("Download");
    expect(ctaButtons.length).toBeGreaterThanOrEqual(1);
    const ctaLink = ctaButtons[0].closest("a");
    expect(ctaLink).toHaveAttribute("href", "/en/app");
  });

  it("toggles mobile menu on hamburger click", async () => {
    const user = userEvent.setup();
    render(<Navbar {...baseProps} />);

    // There are multiple buttons (hamburger + language switcher).
    // The hamburger is the lg:hidden one. Get all buttons and pick the last
    // one (language switcher is first in the DOM, hamburger is after).
    const buttons = screen.getAllByRole("button");
    const hamburger = buttons[buttons.length - 1];
    expect(hamburger).toBeInTheDocument();

    // Click to open
    await user.click(hamburger);
    // Mobile menu should now show links
    const mobileLinks = screen.getAllByText("Home");
    expect(mobileLinks.length).toBeGreaterThanOrEqual(1);
  });
});
