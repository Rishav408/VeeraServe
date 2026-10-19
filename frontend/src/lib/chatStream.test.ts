import { afterEach, describe, expect, it, vi } from "vitest";
import { parseStreamEvent, streamChat } from "./chatStream";

function streamFrom(chunks: string[]): ReadableStream<Uint8Array> {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      for (const chunk of chunks) {
        controller.enqueue(encoder.encode(chunk));
      }
      controller.close();
    }
  });
}

describe("parseStreamEvent", () => {
  it("parses a data line into an event", () => {
    expect(parseStreamEvent('data: {"type":"token","text":"hi"}')).toEqual({ type: "token", text: "hi" });
  });

  it("ignores blocks without data lines", () => {
    expect(parseStreamEvent(": keep-alive")).toBeNull();
  });

  it("returns null for malformed json", () => {
    expect(parseStreamEvent("data: {not json}")).toBeNull();
  });
});

describe("streamChat", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("yields events split across chunk boundaries", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          streamFrom([
            'data: {"type":"session","session_id":"s"}\n\n',
            'data: {"type":"token","text":"Hel',
            'lo"}\n\ndata: {"type":"done","reply":"Hello","pending_confirmation":false}\n\n'
          ]),
          { status: 200 }
        )
      )
    );

    const events = [];
    for await (const event of streamChat({ text: "hi", sessionId: "s" })) {
      events.push(event);
    }

    expect(events.map((event) => event.type)).toEqual(["session", "token", "done"]);
    expect(events[1]).toEqual({ type: "token", text: "Hello" });
  });

  it("throws an ApiError when the response fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ detail: "bad request" }), {
          status: 400,
          headers: { "Content-Type": "application/json" }
        })
      )
    );

    let drained = false;
    await expect(
      (async () => {
        for await (const _event of streamChat({ text: "hi", sessionId: "s" })) {
          drained = true;
        }
      })()
    ).rejects.toThrow("bad request");
    expect(drained).toBe(false);
  });
});
