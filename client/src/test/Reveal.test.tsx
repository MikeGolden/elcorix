import { describe, expect, it, vi, afterEach } from "vitest";
import { act, render, screen } from "@testing-library/react";
import Reveal, { useReveal, resetRevealObserver } from "../components/Reveal";

type Callback = (entries: IntersectionObserverEntry[]) => void;

/**
 * Minimal IntersectionObserver stand-in whose callback the test drives.
 *
 * <Reveal> shares one observer across the whole page, so the assertions
 * below are about the *element* being observed and released, not about an
 * observer existing per component.
 */
class MockObserver {
  static instances: MockObserver[] = [];
  observed: Element[] = [];
  unobserved: Element[] = [];
  disconnected = false;

  constructor(private readonly callback: Callback) {
    MockObserver.instances.push(this);
  }

  observe(element: Element) {
    this.observed.push(element);
  }

  unobserve(element: Element) {
    this.unobserved.push(element);
  }

  disconnect() {
    this.disconnected = true;
  }

  /** Pretend an observed element scrolled into view. */
  enter(target: Element = this.observed[this.observed.length - 1]) {
    act(() => {
      this.callback([{ isIntersecting: true, target } as IntersectionObserverEntry]);
    });
  }

  /** A callback run for an element that is still off screen. */
  miss(target: Element = this.observed[this.observed.length - 1]) {
    act(() => {
      this.callback([{ isIntersecting: false, target } as IntersectionObserverEntry]);
    });
  }
}

function useMockObserver() {
  MockObserver.instances = [];
  vi.stubGlobal("IntersectionObserver", MockObserver);
  // The shared observer is memoised, so drop the previous one before the
  // stub is installed.
  resetRevealObserver();
  return MockObserver;
}

afterEach(() => {
  resetRevealObserver();
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

    observer.miss(block);
    expect(block).toHaveAttribute("data-revealed", "false");

    observer.enter(block);
    expect(block).toHaveAttribute("data-revealed", "true");
    // One-shot: the element is released, so scrolling back up cannot
    // replay the animation.
    expect(observer.unobserved).toEqual([block]);
  });

  it("shares a single observer across every reveal on the page", () => {
    useMockObserver();
    render(
      <>
        <Reveal data-testid="a">A</Reveal>
        <Reveal data-testid="b">B</Reveal>
        <Reveal data-testid="c">C</Reveal>
      </>,
    );

    expect(MockObserver.instances).toHaveLength(1);
    const [observer] = MockObserver.instances;
    expect(observer.observed).toHaveLength(3);

    // Releasing one element must not stop the others from revealing.
    const a = screen.getByTestId("a");
    observer.enter(a);
    expect(a).toHaveAttribute("data-revealed", "true");
    expect(screen.getByTestId("b")).toHaveAttribute("data-revealed", "false");

    observer.enter(screen.getByTestId("b"));
    expect(screen.getByTestId("b")).toHaveAttribute("data-revealed", "true");
    expect(screen.getByTestId("c")).toHaveAttribute("data-revealed", "false");
  });

  it("stops observing an element that unmounts before it is seen", () => {
    useMockObserver();
    const { unmount } = render(<Reveal data-testid="block">Content</Reveal>);
    const block = screen.getByTestId("block");
    unmount();
    expect(MockObserver.instances[0].unobserved).toEqual([block]);
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
    MockObserver.instances[0].enter(screen.getByTestId("probe"));
    expect(screen.getByTestId("probe")).toHaveTextContent("true");
  });
});
