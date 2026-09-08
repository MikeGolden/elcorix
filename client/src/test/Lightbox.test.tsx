import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import Works from "../sections/Works";
import { images } from "../images";
import en from "../i18n/locales/en/common.json";

const workAlts = Object.values(en.work.alts);

describe("Works gallery lightbox", () => {
  it("renders one clickable tile per work photo and no lightbox at rest", () => {
    render(<Works />);
    const tiles = screen.getAllByRole("button", { name: /^Open image:/ });
    expect(tiles).toHaveLength(images.work.length);
    expect(screen.queryByTestId("lightbox")).not.toBeInTheDocument();
  });

  it("opens the clicked photo full screen", async () => {
    const user = userEvent.setup();
    render(<Works />);
    await user.click(screen.getByRole("button", { name: `Open image: ${workAlts[1]}` }));

    const dialog = screen.getByRole("dialog", { name: "Image viewer" });
    expect(within(dialog).getByTestId("lightbox-image")).toHaveAttribute(
      "src",
      images.work[1],
    );
    expect(within(dialog).getByText("2 of 4")).toBeInTheDocument();
    expect(document.body.style.overflow).toBe("hidden");
  });

  it("pages forward with the next arrow and wraps around at the end", async () => {
    const user = userEvent.setup();
    render(<Works />);
    await user.click(screen.getByRole("button", { name: `Open image: ${workAlts[3]}` }));

    await user.click(screen.getByRole("button", { name: "Next image" }));
    expect(screen.getByTestId("lightbox-image")).toHaveAttribute("src", images.work[0]);

    await user.click(screen.getByRole("button", { name: "Previous image" }));
    expect(screen.getByTestId("lightbox-image")).toHaveAttribute("src", images.work[3]);
  });

  it("pages with the arrow keys", async () => {
    const user = userEvent.setup();
    render(<Works />);
    await user.click(screen.getByRole("button", { name: `Open image: ${workAlts[0]}` }));

    await user.keyboard("{ArrowRight}");
    expect(screen.getByTestId("lightbox-image")).toHaveAttribute("src", images.work[1]);
    await user.keyboard("{ArrowLeft}");
    expect(screen.getByTestId("lightbox-image")).toHaveAttribute("src", images.work[0]);
  });

  it("closes on Escape, on the close button and on a backdrop click", async () => {
    const user = userEvent.setup();
    render(<Works />);
    const openFirst = () =>
      user.click(screen.getByRole("button", { name: `Open image: ${workAlts[0]}` }));

    await openFirst();
    await user.keyboard("{Escape}");
    expect(screen.queryByTestId("lightbox")).not.toBeInTheDocument();
    expect(document.body.style.overflow).not.toBe("hidden");

    await openFirst();
    await user.click(screen.getByRole("button", { name: "Close image viewer" }));
    expect(screen.queryByTestId("lightbox")).not.toBeInTheDocument();

    await openFirst();
    await user.click(screen.getByTestId("lightbox"));
    expect(screen.queryByTestId("lightbox")).not.toBeInTheDocument();
  });

  it("does not close when the photo itself is clicked", async () => {
    const user = userEvent.setup();
    render(<Works />);
    await user.click(screen.getByRole("button", { name: `Open image: ${workAlts[0]}` }));
    await user.click(screen.getByTestId("lightbox-image"));
    expect(screen.getByTestId("lightbox")).toBeInTheDocument();
  });

  it("returns focus to the tile that opened it", async () => {
    const user = userEvent.setup();
    render(<Works />);
    const tile = screen.getByRole("button", { name: `Open image: ${workAlts[2]}` });
    await user.click(tile);
    await user.keyboard("{Escape}");
    expect(tile).toHaveFocus();
  });
});
