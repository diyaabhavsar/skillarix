import re

files_to_fix = [
    "app/services/gamification.py",
    "app/main.py",
    "app/api/v1/endpoints/gamification.py",
]

for filepath in files_to_fix:
    try:
        with open(filepath, "rb") as f:
            raw = f.read()

        # Decode as utf-8 (to get the actual unicode chars)
        text = raw.decode("utf-8", errors="replace")

        # Find all non-ascii characters and report them
        for i, ch in enumerate(text):
            if ord(ch) > 127:
                line_num = text[:i].count('\n') + 1
                print(f"  {filepath}:{line_num} -> U+{ord(ch):04X} ({ch!r})")

        # Remove all non-ascii characters by encoding to ascii ignoring errors
        clean = text.encode("ascii", "ignore").decode("ascii")

        with open(filepath, "w", encoding="utf-8") as f:
            f.write(clean)

        print(f"CLEANED: {filepath}")
    except Exception as e:
        print(f"ERROR processing {filepath}: {e}")

print("Done!")
