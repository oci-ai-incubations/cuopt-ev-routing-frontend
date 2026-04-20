import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, beforeEach } from "vitest";

import App from "../App";

function renderApp() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  );
}

describe("App", () => {
  beforeEach(() => {
    // Clear any stored auth so we start at login screen
    localStorage.removeItem("cuopt_auth");
  });

  it("renders the login screen when not authenticated", () => {
    renderApp();
    // The login screen should show a sign-in prompt
    expect(
      screen.getByRole("button", { name: /sign in/i })
    ).toBeInTheDocument();
  });
});
