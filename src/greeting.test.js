import { describe, expect, it } from "vitest";
import { greeting } from "./greeting.js";

describe("greeting", () => {
  it("greets by name", () => {
    expect(greeting("Ana")).toBe("Hello, Ana!");
  });

  it("trims whitespace", () => {
    expect(greeting("  Ana  ")).toBe("Hello, Ana!");
  });

  it("falls back for empty or missing names", () => {
    expect(greeting("")).toBe("Hello, stranger!");
    expect(greeting(undefined)).toBe("Hello, stranger!");
  });
});
