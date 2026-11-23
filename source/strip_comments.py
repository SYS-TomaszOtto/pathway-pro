"""Used by build.py: drop lines that hold only a // comment, to keep the single file under its size budget.
A small lexer tracks strings, template literals (with ${ } nesting), regex literals and block comments, so a // inside
any of them is never touched. Raises if it ends in an unclean state (then the build stops rather than ship broken code)."""
import re

KEYWORDS_BEFORE_REGEX = {'return', 'typeof', 'case', 'do', 'else', 'in', 'of', 'new', 'delete', 'void', 'throw', 'instanceof', 'yield', 'await'}


def strip_line_comments(code):
    drop = []                      # (start, end) of whole-line comments, end includes the newline
    i, n, stack, prev, word = 0, len(code), [], '', ''
    line_start = 0
    while i < n:
        c = code[i]
        if stack and stack[-1] == 't':
            if c == '\\': i += 2; continue
            if c == '`': stack.pop(); prev = '`'
            elif c == '$' and code[i + 1:i + 2] == '{': stack.append('b'); i += 1
            elif c == '\n': line_start = i + 1
            i += 1; continue
        if c in '"\'':
            j = i + 1
            while j < n and code[j] != c:
                if code[j] == '\n': raise ValueError(f'unclosed string at {i}')
                j += 2 if code[j] == '\\' else 1
            i = j + 1; prev = c; word = ''; continue
        if c == '`': stack.append('t'); i += 1; continue
        if c == '/' and code[i + 1:i + 2] == '*':
            i = code.index('*/', i + 2) + 2; continue
        if c == '/' and code[i + 1:i + 2] == '/':
            j = code.find('\n', i)
            j = n if j < 0 else j
            if not code[line_start:i].strip(): drop.append((line_start, j + 1))
            i = j; continue
        if c == '/' and (prev == '' or prev in '(,=:[!&|?{};+-*%<>~^' or word in KEYWORDS_BEFORE_REGEX):
            j, cls = i + 1, False
            while j < n and (code[j] != '/' or cls):
                if code[j] == '\\': j += 1
                elif code[j] == '[': cls = True
                elif code[j] == ']': cls = False
                elif code[j] == '\n': raise ValueError(f'unclosed regex at {i}: {code[i:i + 40]!r}')
                j += 1
            i = j + 1; prev = '/'; word = ''; continue
        if c == '{': stack.append('b')
        elif c == '}':
            if not stack: raise ValueError(f'unbalanced }} at {i}')
            stack.pop()
        if c == '\n': line_start = i + 1
        if c.isalnum() or c in '_$':
            word = word + c if prev and (prev.isalnum() or prev in '_$') else c
            prev = c
        elif not c.isspace():
            prev = c; word = ''
        i += 1
    if stack: raise ValueError('unclosed block or template at end')
    out, last = [], 0
    for a, b in drop:
        out.append(code[last:a]); last = b
    out.append(code[last:])
    return ''.join(out)
