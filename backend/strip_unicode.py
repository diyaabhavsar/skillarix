import os

file_path = os.path.join("app", "services", "gamification.py")
with open(file_path, "r", encoding="utf-8") as f:
    text = f.read()

# Replace any non-ascii characters 
clean_text = text.encode("ascii", "ignore").decode("ascii")

with open(file_path, "w", encoding="utf-8") as f:
    f.write(clean_text)

print("Done stripping non-ascii characters.")
