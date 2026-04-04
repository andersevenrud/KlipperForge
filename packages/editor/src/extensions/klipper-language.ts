import { StreamLanguage, type StringStream } from "@codemirror/language";
import { tags } from "@lezer/highlight";

const JINJA_KEYWORDS = new Set([
  "if",
  "else",
  "elif",
  "endif",
  "for",
  "endfor",
  "set",
  "macro",
  "endmacro",
  "block",
  "endblock",
  "filter",
  "endfilter",
  "raw",
  "endraw",
  "call",
  "endcall",
  "extends",
  "include",
  "import",
  "from",
  "with",
  "without",
  "context",
  "as",
  "in",
  "not",
  "and",
  "or",
  "is",
  "true",
  "false",
  "none",
  "True",
  "False",
  "None",
]);

interface KlipperState {
  /** "none" | "block" (%} | "expr" (}}) | "comment" (#}) */
  jinja: "none" | "block" | "expr" | "comment";
}

function tokenJinjaContent(stream: StringStream, state: KlipperState): string | null {
  // End delimiters
  if (state.jinja === "comment" && stream.match("#}")) {
    state.jinja = "none";
    return "comment";
  }
  if (state.jinja === "block" && stream.match("%}")) {
    state.jinja = "none";
    return "meta";
  }
  if (state.jinja === "expr" && stream.match("}}")) {
    state.jinja = "none";
    return "meta";
  }

  // Inside comment — consume everything until end
  if (state.jinja === "comment") {
    stream.skipTo("#}") || stream.skipToEnd();
    return "comment";
  }

  // Skip whitespace
  if (stream.eatSpace()) return null;

  // Strings
  if (stream.match(/^"[^"]*"/)) return "string";
  if (stream.match(/^'[^']*'/)) return "string";

  // Numbers
  if (stream.match(/^-?[0-9]*\.?[0-9]+/)) return "number";

  // Filter pipe
  if (stream.eat("|")) return "operator";

  // Operators
  if (stream.match(/^[=!<>]=?|^[+\-*/%~]/)) return "operator";

  // Parentheses, brackets
  if (stream.match(/^[()[\]{},.:]/)) return "punctuation";

  // Identifiers / keywords
  if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
    const word = stream.current();
    if (JINJA_KEYWORDS.has(word)) return "keyword";
    // After a pipe, it's a filter name
    return "variableName";
  }

  stream.next();
  return null;
}

const klipperLanguage = StreamLanguage.define<KlipperState>({
  startState(): KlipperState {
    return { jinja: "none" };
  },

  copyState(state: KlipperState): KlipperState {
    return { jinja: state.jinja };
  },

  token(stream: StringStream, state: KlipperState): string | null {
    // Continue Jinja block from previous line
    if (state.jinja !== "none") {
      return tokenJinjaContent(stream, state);
    }

    // Comments
    if (stream.match(/^#.*/)) {
      return "comment";
    }

    // Section headers [section_name]
    if (stream.match(/^\[.*\]/)) {
      return "heading";
    }

    // Jinja2 comment {# ... #}
    if (stream.match("{#")) {
      state.jinja = "comment";
      return "comment";
    }

    // Jinja2 block {% ... %}
    if (stream.match("{%")) {
      state.jinja = "block";
      return "meta";
    }

    // Jinja2 expression {{ ... }}
    if (stream.match("{{")) {
      state.jinja = "expr";
      return "meta";
    }

    // Key-value separator (only at start of non-indented lines)
    if (stream.sol() && stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
      if (stream.peek() === ":" || stream.peek() === "=") {
        return "propertyName";
      }
      // G-code command at start of line (within indented gcode block)
      const word = stream.current();
      if (/^[GM]\d+$/.test(word)) return "keyword";
      return null;
    }

    // G-code commands (indented lines in gcode blocks)
    if (stream.match(/^[GM]\d+/)) {
      return "keyword";
    }

    // Quoted strings (G-code parameter values like SENSOR="temperature_sensor bed_edge")
    if (stream.match(/^"[^"]*"/) || stream.match(/^'[^']*'/)) {
      return "string";
    }

    // G-code named parameters followed by = (VARIABLE=, SENSOR=, SPEED=)
    if (stream.match(/^[A-Z_][A-Z0-9_]*(?==)/)) {
      return "propertyName";
    }

    // = sign after named parameter
    if (stream.eat("=")) {
      return "operator";
    }

    // G-code axis/parameter letters followed by number
    if (stream.match(/^[XYZEFSPRT](?=-?[0-9])/)) {
      return "atom";
    }

    // Pin references (PA0, PB7, !PF14, ^PG6, etc.)
    if (stream.match(/^[!^~]*P[A-Z][0-9]+/)) {
      return "atom";
    }

    // Numbers
    if (stream.match(/^-?[0-9]*\.?[0-9]+/)) {
      return "number";
    }

    // G-code extended commands (all-caps words like TEMPERATURE_WAIT, SET_HEATER_TEMPERATURE)
    if (stream.match(/^[A-Z][A-Z0-9_]*[A-Z][A-Z0-9_]*/)) {
      return "keyword";
    }

    // Identifiers (catch-all)
    if (stream.match(/^[a-zA-Z_][a-zA-Z0-9_]*/)) {
      return null;
    }

    stream.next();
    return null;
  },

  languageData: {
    commentTokens: { line: "#" },
  },
  tokenTable: {
    comment: tags.comment,
    heading: tags.heading,
    propertyName: tags.propertyName,
    number: tags.number,
    atom: tags.atom,
    keyword: tags.keyword,
    meta: tags.meta,
    string: tags.string,
    variableName: tags.variableName,
    operator: tags.operator,
    punctuation: tags.punctuation,
  },
});

export { klipperLanguage };
