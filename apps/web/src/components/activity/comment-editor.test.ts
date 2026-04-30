import { describe, expect, it } from "vitest";
import { normalizeMarkdown } from "./comment-editor";

describe("normalizeMarkdown", () => {
  it("unwraps malformed single-column tables created from block content", () => {
    const markdown = [
      "## ++Client info++",
      "",
      "| |",
      "| ------------------------------------------------------------------- |",
      "| ++**Monitoring Objectives**++\u001f- **Goals:** Brand reputation management.- **KPIs:** Share of voice.\u001f++Keywords++ |",
      "| |",
    ].join("\n");

    expect(normalizeMarkdown(markdown)).toBe(
      [
        "## ++Client info++",
        "",
        "## ++**Monitoring Objectives**++",
        "",
        "- **Goals:** Brand reputation management.",
        "- **KPIs:** Share of voice.",
        "",
        "## ++Keywords++",
      ].join("\n"),
    );
  });

  it("keeps fenced code blocks separated from surrounding blocks", () => {
    const markdown = ["Paragraph", "```", "code", "```", "## Heading"].join(
      "\n",
    );

    expect(normalizeMarkdown(markdown)).toBe(
      ["Paragraph", "", "```", "code", "```", "", "## Heading"].join("\n"),
    );
  });
});
