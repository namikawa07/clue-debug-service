export type InlineToken =
  | { type: "text"; value: string }
  | { type: "member"; name: string; id: string | null }
  | { type: "task"; title: string; id: string }
  | { type: "bold"; value: string };

// Group order:
//  [1,2,3]  structured member  @[Name](member:id)
//  [4,5,6]  structured task    #[Title](task:id)
//  [7,8,9]  raw task           #Title (alphaid)
//  [10,11]  raw member         @Name...
//  [12,13]  bold               **text**
const TOKEN_REGEX =
  /(@\[([^\]]+)\]\(member:([^)]+)\))|(#\[([^\]]+)\]\(task:([^)]+)\))|(#([^|()\n#*]+?)\s*\(([a-z0-9]{4,16})\))|(@([\w][\w .'"-]{0,60}?)(?=[,.|;)\n\t]|$))|(\*\*([^*\n]+)\*\*)/g;

export function parseInlineTokens(text: string): InlineToken[] {
  const tokens: InlineToken[] = [];
  TOKEN_REGEX.lastIndex = 0;
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  while ((match = TOKEN_REGEX.exec(text)) !== null) {
    if (match.index > lastIndex)
      tokens.push({ type: "text", value: text.slice(lastIndex, match.index) });

    if (match[1]) tokens.push({ type: "member", name: match[2], id: match[3] });
    else if (match[4]) tokens.push({ type: "task", title: match[5], id: match[6] });
    else if (match[7]) tokens.push({ type: "task", title: match[8].trim(), id: match[9] });
    else if (match[10]) tokens.push({ type: "member", name: match[11].trim(), id: null });
    else if (match[12]) tokens.push({ type: "bold", value: match[13] });

    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length)
    tokens.push({ type: "text", value: text.slice(lastIndex) });

  return tokens;
}
