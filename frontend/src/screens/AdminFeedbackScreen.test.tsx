import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiGet, apiPatch } from "../lib/apiClient";
import type { FeedbackDto } from "../types/api";
import AdminFeedbackScreen from "./AdminFeedbackScreen";

vi.mock("../lib/apiClient", async (importOriginal) => {
  const actual = await importOriginal<typeof import("../lib/apiClient")>();
  return { ...actual, apiGet: vi.fn(), apiPatch: vi.fn() };
});

const apiGetMock = vi.mocked(apiGet);
const apiPatchMock = vi.mocked(apiPatch);

const FEEDBACK: FeedbackDto[] = [
  {
    id: 1,
    user_id: null,
    order_id: 7,
    food_rating: 5,
    service_rating: 4,
    ai_rating: 3,
    comment: "Loved the butter chicken",
    acknowledged: false,
    created_at: new Date().toISOString()
  }
];

function renderInbox() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } }
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <AdminFeedbackScreen />
    </QueryClientProvider>
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe("AdminFeedbackScreen", () => {
  it("lists feedback with a pending count", async () => {
    apiGetMock.mockResolvedValue(FEEDBACK);

    renderInbox();

    expect(await screen.findByText(/Loved the butter chicken/)).toBeInTheDocument();
    expect(screen.getByText("Total: 1")).toBeInTheDocument();
    expect(screen.getByText("Unacknowledged: 1")).toBeInTheDocument();
    expect(apiGetMock).toHaveBeenCalledWith("/feedback");
  });

  it("acknowledges feedback through the API", async () => {
    apiGetMock.mockResolvedValue(FEEDBACK);
    apiPatchMock.mockResolvedValue({ ...FEEDBACK[0], acknowledged: true });

    renderInbox();
    await screen.findByText(/Loved the butter chicken/);

    await userEvent.click(screen.getByRole("button", { name: "Acknowledge" }));

    await waitFor(() => expect(apiPatchMock).toHaveBeenCalledWith("/feedback/1/acknowledge", {}));
  });

  it("shows an empty state when there is no feedback", async () => {
    apiGetMock.mockResolvedValue([]);

    renderInbox();

    expect(await screen.findByText("No feedback here")).toBeInTheDocument();
  });
});
