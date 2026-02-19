import "@testing-library/jest-dom";

// Mock framer-motion for Jest
jest.mock("framer-motion", () => {
  const React = require("react");
  const motion = new Proxy(
    {},
    {
      get: (_target, prop) => {
        return React.forwardRef((props: any, ref: any) => {
          const {
            initial,
            animate,
            exit,
            variants,
            whileInView,
            whileHover,
            whileTap,
            viewport,
            transition,
            layoutId,
            custom,
            ...rest
          } = props;
          return React.createElement(prop as string, { ...rest, ref });
        });
      },
    }
  );
  return {
    motion,
    AnimatePresence: ({ children }: { children: React.ReactNode }) => children,
    useAnimation: () => ({ start: jest.fn(), stop: jest.fn() }),
    useInView: () => true,
  };
});

// Mock next/image for Jest
jest.mock("next/image", () => ({
  __esModule: true,
  default: (props: any) => {
    const React = require("react");
    return React.createElement("img", {
      ...props,
      fill: undefined,
      priority: undefined,
    });
  },
}));

// Mock next/link for Jest
jest.mock("next/link", () => ({
  __esModule: true,
  default: ({ children, href, ...rest }: { children: React.ReactNode; href: string }) => {
    const React = require("react");
    return React.createElement("a", { href, ...rest }, children);
  },
}));

// Mock next/navigation for Jest
jest.mock("next/navigation", () => ({
  usePathname: () => "/en",
  useRouter: () => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
    forward: jest.fn(),
    refresh: jest.fn(),
    prefetch: jest.fn(),
  }),
  useSearchParams: () => new URLSearchParams(),
  useParams: () => ({ locale: "en" }),
}));
