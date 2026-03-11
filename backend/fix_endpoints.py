with open('app/api/v1/endpoints/gamification.py', 'rb') as f:
    raw = f.read()
text = raw.decode('utf-8', errors='replace')
found = [(i, ch) for i, ch in enumerate(text) if ord(ch) > 127]
for i, ch in found:
    line_num = text[:i].count('\n') + 1
    sys_msg = 'Line ' + str(line_num) + ' U+' + format(ord(ch), '04X')
    with open('emoji_report.txt', 'a', encoding='utf-8') as rpt:
        rpt.write(sys_msg + '\n')
clean = text.encode('ascii', 'ignore').decode('ascii')
with open('app/api/v1/endpoints/gamification.py', 'w', encoding='utf-8') as f2:
    f2.write(clean)
with open('emoji_report.txt', 'a', encoding='utf-8') as rpt:
    rpt.write('DONE\n')
