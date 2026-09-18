import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, fireEvent, act } from "@testing-library/react";
import { MemoryRouter, Link } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";

describe("ScrollToTop", () => {
  beforeEach(() => {
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((cb) => {
      cb(0);
      return 0;
    });
  });

  it("scrolls to the anchor again when the same hash link is clicked twice", () => {
    const scroll = vi.fn();
    const { getByText, container } = render(
      <MemoryRouter initialEntries={["/en"]}>
        <ScrollToTop />
        <Link to="#consultation">go</Link>
        <section id="consultation" />
      </MemoryRouter>,
    );
    (container.querySelector("#consultation") as HTMLElement).scrollIntoView = scroll;

    act(() => void fireEvent.click(getByText("go")));
    expect(scroll).toHaveBeenCalledTimes(1);

    act(() => void fireEvent.click(getByText("go")));
    expect(scroll).toHaveBeenCalledTimes(2);
  });
});
