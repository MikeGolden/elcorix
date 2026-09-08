import { describe, expect, it, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import Reveal, { useReveal } from "../components/Reveal";

type Callback = (entries: IntersectionObserverEntry[]) => void;

/** Minimal IntersectionObserver stand-in whose callback the test drives. */
class MockObserver {
  static instances: MockObserver[] = [];
  observed: Element[] = [];
  disconnected = false;

  constructor(private readonly callback: Callback) {
    MockObserver.instances.push(this);
  }

  observe(element: Element) {
    this.observed.push(element);
  }

  unobserve() {}

  disconnect() {
    this.disconnected = true;
  }

  /** Pretend the observed element scrolled into view. */
  enter() {
    act(() => {
      this.callback([{ isIntersecting: true } as IntersectionObserverEntry]);
    });
  }

  /** A callback run for an element that is still off screen. */
  miss() {
    act(() => {
      this.callback([{ isIntersecting: false } as IntersectionObserverEntry]);
    });
  }
}

function useMockObserver() {
  MockObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", MockObserver);
  return MockObserver;
}

afterEach(() => {
  vi.unstubAllGlobals();
  MockObserver.instances = [];
});

describe("Reveal", () => {
  it("stays hidden until the element enters the viewport, then never re-arms", () => {
    useMockObserver();
    render(<Reveal data-testid="block">Content</Reveal>);
    const block = screen.getByTestId("block");

    expect(block).toHaveAttribute("data-revealed", "false");
    expect(block).toHaveClass("reveal");
    const [observer] = MockObserver.instances;
    expect(observer.observed).toEqual([block]);

    observer.miss();
    expect(block).toHaveAttribute("data-revealed", "false");

    observer.enter();
    expect(block).toHaveAttribute("data-revealed", "true");
    // One-shot: scrolling back up must not replay the animation.
    expect(observer.disconnected).toBe(true);
  });

  it("renders revealed from the first paint when IntersectionObserver is missing", () => {
    vi.stubGlobal("IntersectionObserver", undefined);
    render(<Reveal data-testid="block">Content</Reveal>);

    expect(screen.getByTestId("block")).toHaveAttribute("data-revealed", "true");
  });

  it("keeps the element type, its classes and the stagger it was given", () => {
    useMockObserver();
    render(
      <Reveal as="h2" id="title" delay={120} className="text-2xl" data-testid="heading">
        Our work
      </Reveal>,
    );
    const heading = screen.getByRole("heading", { name: "Our work" });

    expect(heading.tagName).toBe("H2");
    expect(heading).toHaveAttribute("id", "title");
    expect(heading).toHaveClass("reveal", "text-2xl");
    expect(heading).toHaveStyle({ transitionDelay: "120ms" });
  });

  it('only fades in the "fade" variant, so a positioned element is not moved', () => {
    useMockObserver();
    render(<Reveal as="img" variant="fade" alt="" src="/x.jpg" data-testid="photo" />);

    expect(screen.getByTestId("photo")).toHaveClass("reveal-fade");
    expect(screen.getByTestId("photo")).not.toHaveClass("reveal");
  });

  it("exposes the same behaviour through the hook", () => {
    useMockObserver();
    function Probe() {
      const { ref, revealed } = useReveal<HTMLDivElement>();
      return (
        <div ref={ref} data-testid="probe">
          {String(revealed)}
        </div>
      );
    }
    render(<Probe />);

    expect(screen.getByTestId("probe")).toHaveTextContent("false");
    MockObserver.instances[0].enter();
    expect(screen.getByTestId("probe")).toHaveTextContent("true");
  });
});
