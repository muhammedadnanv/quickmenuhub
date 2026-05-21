import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import Onboarding from "./Onboarding";

const navigateMock = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => navigateMock };
});

const authState: { user: any; loading: boolean } = { user: null, loading: false };
vi.mock("@/hooks/useAuth", () => ({
  useAuth: () => authState,
}));

type Row = { data: any };
const responses: { roles: Row; cafes: Row } = {
  roles: { data: null },
  cafes: { data: null },
};

vi.mock("@/integrations/supabase/client", () => {
  const builder = (table: string) => {
    const chain: any = {
      select: () => chain,
      eq: () => chain,
      maybeSingle: () =>
        Promise.resolve(table === "user_roles" ? responses.roles : responses.cafes),
    };
    return chain;
  };
  return { supabase: { from: (table: string) => builder(table) } };
});

const renderPage = () =>
  render(
    <MemoryRouter>
      <Onboarding />
    </MemoryRouter>
  );

describe("Onboarding redirect after sign-in", () => {
  beforeEach(() => {
    navigateMock.mockReset();
    authState.user = null;
    authState.loading = false;
    responses.roles = { data: null };
    responses.cafes = { data: null };
  });

  it("does not redirect when no user is signed in", async () => {
    renderPage();
    await new Promise((r) => setTimeout(r, 10));
    expect(navigateMock).not.toHaveBeenCalled();
  });

  it("redirects super admins to /admin", async () => {
    authState.user = { id: "admin-1" };
    responses.roles = { data: { role: "super_admin" } };
    renderPage();
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/admin", { replace: true })
    );
  });

  it("redirects café owners to their POS route", async () => {
    authState.user = { id: "owner-1" };
    responses.roles = { data: null };
    responses.cafes = { data: { id: "cafe-123" } };
    renderPage();
    await waitFor(() =>
      expect(navigateMock).toHaveBeenCalledWith("/cafe/cafe-123/pos", { replace: true })
    );
  });

  it("does not redirect users without a role or linked café", async () => {
    authState.user = { id: "orphan" };
    renderPage();
    await new Promise((r) => setTimeout(r, 20));
    expect(navigateMock).not.toHaveBeenCalled();
  });
});