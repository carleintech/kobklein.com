import {
  welcomeEmail,
  transactionEmail,
  fraudAlertEmail,
  depositConfirmedEmail,
  kycApprovedEmail,
  kycRejectedEmail,
  lowBalanceEmail,
  planUpgradeEmail,
  physicalCardShippedEmail,
  passwordChangedEmail,
} from "./email-templates";

describe("email-templates", () => {
  describe("welcomeEmail", () => {
    it("returns correct subject and html with name", () => {
      const { subject, html } = welcomeEmail("Marie");
      expect(subject).toContain("Welcome");
      expect(html).toContain("Marie");
      expect(html).toContain("KobKlein");
    });

    it("html is valid HTML string with doctype", () => {
      const { html } = welcomeEmail("Test");
      expect(html).toMatch(/<!DOCTYPE html>/i);
    });
  });

  describe("transactionEmail", () => {
    it("includes amount and currency in subject", () => {
      const { subject } = transactionEmail("Jean", "sent", 1500, "HTG", "ref-abc");
      expect(subject).toContain("1");
      expect(subject).toContain("HTG");
    });

    it("includes reference in html body", () => {
      const { html } = transactionEmail("Jean", "sent", 1500, "HTG", "ref-abc-123");
      expect(html).toContain("ref-abc-123");
    });

    it("shows Transfer Sent for type=sent", () => {
      const { subject } = transactionEmail("Jean", "sent", 100, "USD", "r1");
      expect(subject).toContain("Sent");
    });

    it("shows Transfer Received for type=received", () => {
      const { subject } = transactionEmail("Jean", "received", 100, "USD", "r1");
      expect(subject).toContain("Received");
    });
  });

  describe("fraudAlertEmail", () => {
    it("subject contains Security Alert", () => {
      const { subject } = fraudAlertEmail("Paul", "Unusual login detected");
      expect(subject).toContain("Security Alert");
    });

    it("html contains the detail text", () => {
      const { html } = fraudAlertEmail("Paul", "Unusual login from Paris");
      expect(html).toContain("Unusual login from Paris");
    });
  });

  describe("depositConfirmedEmail", () => {
    it("html contains MonCash label for moncash provider", () => {
      const { html } = depositConfirmedEmail("Sophie", 500, "HTG", "moncash");
      expect(html).toContain("MonCash");
    });

    it("subject contains amount and currency", () => {
      const { subject } = depositConfirmedEmail("Sophie", 500, "HTG", "moncash");
      expect(subject).toContain("500");
      expect(subject).toContain("HTG");
    });
  });

  describe("kycApprovedEmail", () => {
    it("subject contains Identity Verified", () => {
      const { subject } = kycApprovedEmail("Marc", 1);
      expect(subject).toContain("Verified");
    });

    it("html contains tier number", () => {
      const { html } = kycApprovedEmail("Marc", 2);
      expect(html).toContain("2");
    });
  });

  describe("kycRejectedEmail", () => {
    it("html contains rejection reason", () => {
      const { html } = kycRejectedEmail("Anna", "Document expired");
      expect(html).toContain("Document expired");
    });
  });

  describe("lowBalanceEmail", () => {
    it("subject contains Low Float Alert", () => {
      const { subject } = lowBalanceEmail("Agent", 200, "HTG");
      expect(subject).toContain("Low Float");
    });

    it("html contains the balance amount", () => {
      const { html } = lowBalanceEmail("Agent", 200, "HTG");
      expect(html).toContain("200");
    });
  });

  describe("planUpgradeEmail", () => {
    it("subject contains plan name", () => {
      const { subject } = planUpgradeEmail("User", "Pro");
      expect(subject).toContain("Pro");
    });
  });

  describe("physicalCardShippedEmail", () => {
    it("subject contains Shipped", () => {
      const { subject } = physicalCardShippedEmail("Claire", "TRK-9876543");
      expect(subject).toContain("Shipped");
    });

    it("html contains the tracking number", () => {
      const { html } = physicalCardShippedEmail("Claire", "TRK-9876543");
      expect(html).toContain("TRK-9876543");
    });

    it("html contains the recipient name", () => {
      const { html } = physicalCardShippedEmail("Claire", "TRK-9876543");
      expect(html).toContain("Claire");
    });
  });

  describe("passwordChangedEmail", () => {
    it("subject contains Security Credentials", () => {
      const { subject } = passwordChangedEmail("Henri");
      expect(subject).toContain("Security Credentials");
    });

    it("html contains the recipient name", () => {
      const { html } = passwordChangedEmail("Henri");
      expect(html).toContain("Henri");
    });

    it("html is valid HTML with doctype", () => {
      const { html } = passwordChangedEmail("Henri");
      expect(html).toMatch(/<!DOCTYPE html>/i);
    });
  });
});
