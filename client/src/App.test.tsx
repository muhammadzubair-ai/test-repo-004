import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router";
import { AppRoutes } from "@/App";
import { AuthProvider } from "@/lib/auth";

function renderAt(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </MemoryRouter>,
  );
}

afterEach(() => {
  localStorage.clear();
  vi.unstubAllGlobals();
});

describe("routing", () => {
  it("sends a signed-out visitor to the sign-in form", async () => {
    renderAt("/");
    expect(await screen.findByText("Use your email and password.")).toBeInTheDocument();
  });

  it("switches to registration from the sign-in form", async () => {
    renderAt("/login");
    await userEvent.click(screen.getByRole("link", { name: "Create one" }));
    expect(await screen.findByText("It takes a few seconds.")).toBeInTheDocument();
  });
});

describe("sign in", () => {
  it("shows the server's message when the credentials are wrong", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(JSON.stringify({ error: "Wrong email or password" }), { status: 401 })),
    );
    renderAt("/login");
    await userEvent.type(screen.getByLabelText("Email"), "ada@example.com");
    await userEvent.type(screen.getByLabelText("Password"), "wrong password");
    await userEvent.click(screen.getByRole("button", { name: "Sign in" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Wrong email or password");
  });
});
