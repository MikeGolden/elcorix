import { render, screen, within } from "@testing-library/react";
import { MemoryRouter } from "react-router";
import App from "../App";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <App />
    </MemoryRouter>,
  );
}

describe("the price page's jump links", () => {
  it("lead to the women's block, the men's block and the course terms, in that order", async () => {
    renderAt("/de/preise");
    const nav = await screen.findByRole("navigation", { name: "Zu den Preisen springen" });
    const links = within(nav).getAllByRole("link");
    expect(links.map((link) => link.textContent)).toEqual(["Damen", "Herren", "Kursbedingungen"]);
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/de/preise#prices-group-women",
      "/de/preise#prices-group-men",
      "/de/preise#prices-course-terms",
    ]);
  });

  it("point at elements that exist and hold what the link says", async () => {
    renderAt("/de/preise");
    const nav = await screen.findByRole("navigation", { name: "Zu den Preisen springen" });
    const [women, men, terms] = within(nav)
      .getAllByRole("link")
      .map((link) => document.getElementById(link.getAttribute("href")!.split("#")[1]));
    expect(within(women!).getByRole("heading", { name: "Damen · Ersttermin" })).toBeInTheDocument();
    expect(within(men!).getByRole("heading", { name: "Herren · Ersttermin" })).toBeInTheDocument();
    expect(
      within(terms!).getByRole("heading", { name: "Gut zu wissen · für Damen und Herren" }),
    ).toBeInTheDocument();
  });

  it("come before the first price block", async () => {
    renderAt("/en/prices");
    const nav = await screen.findByRole("navigation", { name: "Jump to prices" });
    const women = document.getElementById("prices-group-women")!;
    expect(nav.compareDocumentPosition(women) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });
});
