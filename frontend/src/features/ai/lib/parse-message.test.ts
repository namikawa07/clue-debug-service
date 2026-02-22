import { describe, it, expect } from "vitest";
import { parseInlineTokens } from "./parse-message";

describe("parseInlineTokens", () => {
  // Structured (must not break)
  it("parses structured member", () =>
    expect(parseInlineTokens("@[Alice](member:abc123)")).toEqual([
      { type: "member", name: "Alice", id: "abc123" },
    ]));

  it("parses structured task", () =>
    expect(parseInlineTokens("#[Fix bug](task:xyz789)")).toEqual([
      { type: "task", title: "Fix bug", id: "xyz789" },
    ]));

  it("parses bold", () =>
    expect(parseInlineTokens("**high priority**")).toEqual([
      { type: "bold", value: "high priority" },
    ]));

  // Raw formats (new)
  it("parses raw task #Title (id)", () =>
    expect(
      parseInlineTokens("#Intern Interview - Candidate 1 (lq5we3mlnt)")
    ).toEqual([
      { type: "task", title: "Intern Interview - Candidate 1", id: "lq5we3mlnt" },
    ]));

  it("parses raw task short id", () =>
    expect(parseInlineTokens("#Fix login (abc123)")).toEqual([
      { type: "task", title: "Fix login", id: "abc123" },
    ]));

  it("parses raw member before comma", () => {
    const r = parseInlineTokens("@Mohammed anfas K P,");
    expect(r[0]).toEqual({ type: "member", name: "Mohammed anfas K P", id: null });
  });

  it("parses raw member at end", () => {
    const r = parseInlineTokens("assigned to @Mohammed anfas K P");
    expect(r[1]).toEqual({ type: "member", name: "Mohammed anfas K P", id: null });
  });

  it("parses raw member before pipe", () => {
    const r = parseInlineTokens("@John Smith |");
    expect(r[0]).toEqual({ type: "member", name: "John Smith", id: null });
  });

  // Mixed
  it("parses mixed structured in one string", () => {
    const r = parseInlineTokens("Created #[Task A](task:t001) for @[Bob](member:m001)");
    expect(r).toHaveLength(4);
    expect(r[1]).toMatchObject({ type: "task", id: "t001" });
    expect(r[3]).toMatchObject({ type: "member", id: "m001" });
  });

  it("parses raw task in table cell", () =>
    expect(
      parseInlineTokens("#Intern Interview - Candidate 2 (hj61qjtg4y)")
    ).toEqual([
      { type: "task", title: "Intern Interview - Candidate 2", id: "hj61qjtg4y" },
    ]));

  it("returns plain text unchanged", () =>
    expect(parseInlineTokens("just plain text")).toEqual([
      { type: "text", value: "just plain text" },
    ]));

  it("handles empty string", () =>
    expect(parseInlineTokens("")).toEqual([]));

  it("does not match short paren nums", () =>
    expect(parseInlineTokens("see section (12)")).toEqual([
      { type: "text", value: "see section (12)" },
    ]));

  it("parses bold mixed with text", () => {
    const r = parseInlineTokens("Both are **high priority** today.");
    expect(r[1]).toEqual({ type: "bold", value: "high priority" });
  });
});
