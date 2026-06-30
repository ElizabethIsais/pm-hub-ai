#!/usr/bin/env python3
"""
build.py — PM Knowledge Hub AI
Assembles pm-hub-src/ into a single self-contained pm-knowledge-hub.html.
No external dependencies required.
"""
import os

SRC = os.path.join(os.path.dirname(__file__), 'pm-hub-src')
OUT = os.path.join(os.path.dirname(__file__), 'pm-knowledge-hub.html')

def read(path):
    with open(path, 'r', encoding='utf-8') as f:
        return f.read()

def css_files():
    files = [
        ('core/css', ['variables.css', 'base.css', 'layout.css', 'components.css']),
        ('modules/m1-dashboard', ['styles.css']),
        ('modules/m2-learning',   ['styles.css']),
        ('modules/m3-practice',   ['styles.css']),
        ('modules/m4-skills',     ['styles.css']),
    ]
    parts = []
    for folder, names in files:
        for name in names:
            p = os.path.join(SRC, folder, name)
            if os.path.exists(p):
                parts.append(f'/* === {folder}/{name} === */\n' + read(p))
            else:
                print(f'  [WARN] Missing: {folder}/{name}')
    return '\n\n'.join(parts)

def js_files():
    order = [
        'core/data/levels-def.js',
        'core/data/pm-tips.js',
        'core/js/event-bus.js',
        'core/js/state-manager.js',
        'core/js/storage-manager.js',
        'core/js/router.js',
        'core/js/xp-system.js',
        'core/js/streak-system.js',
        'core/js/competency-system.js',
        'core/js/ai-provider.js',
        'core/js/ui-components.js',
        'modules/m1-dashboard/module.js',
        'core/data/content.js',
        'modules/m2-learning/module.js',
        'modules/m3-practice/module.js',
        'modules/m4-skills/module.js',
        'shell/init.js',
    ]
    parts = []
    for rel in order:
        p = os.path.join(SRC, rel)
        if os.path.exists(p):
            parts.append(f'/* === {rel} === */\n' + read(p))
        else:
            print(f'  [WARN] Missing JS: {rel}')
    return '\n\n'.join(parts)

EXTRA_CSS = """
/* ── XP bar ── */
.xp-bar-wrap { display: flex; align-items: center; gap: 8px; flex: 1; }
.xp-level-label { font-size: 12px; font-weight: 600; color: var(--text-muted); white-space: nowrap; }
.xp-bar { flex: 1; margin: 0; }
/* ── Streak chip (neutral) ── */
.streak-chip {
  display: flex; align-items: center; gap: 5px;
  padding: 4px 10px;
  background: var(--bg-el);
  border: 1px solid var(--border);
  border-radius: 99px;
  font-size: 0.78rem; font-weight: 700; color: var(--text-muted);
}
.streak-chip .icon { width: 15px; height: 15px; }
/* ── Cert track ── */
.cert-track { display: flex; align-items: center; gap: 10px; padding: 12px 0; border-bottom: 1px solid var(--border); }
.cert-track:last-child { border-bottom: none; }
.cert-track-icon { color: var(--primary); }
/* ── Achievement toast ── */
.achievement-toast { flex-direction: row; align-items: center; gap: 12px; }
/* ── Quick actions ── */
.quick-btn {
  display: flex; flex-direction: column; align-items: flex-start; gap: 6px;
  padding: 16px; border-radius: var(--radius-sm);
  background: var(--bg-card); border: 1px solid var(--border);
  color: var(--text); cursor: pointer;
  transition: background var(--transition), border-color var(--transition), transform var(--transition);
  text-align: left; box-shadow: var(--shadow-sm);
}
.quick-btn:hover { background: var(--primary-bg); border-color: var(--primary); transform: translateY(-1px); }
.quick-btn .icon { color: var(--primary); }
.quick-btn span  { font-size: 0.84rem; font-weight: 500; }
"""

def build():
    print('[build.py] Assembling pm-knowledge-hub.html...')
    head = read(os.path.join(SRC, 'shell/head.html'))
    tail = read(os.path.join(SRC, 'shell/tail.html'))
    css  = css_files()
    js   = js_files()
    style_block  = f'<style>\n{css}\n{EXTRA_CSS}\n</style>\n'
    script_block = f'<script>\n{js}\n</script>\n'
    head = head.replace('</head>', style_block + '</head>')
    tail = script_block + tail
    html = head + tail
    with open(OUT, 'w', encoding='utf-8') as f:
        f.write(html)
        size_kb = os.path.getsize(OUT) / 1024
    print(f'[build.py] Done => pm-knowledge-hub.html ({size_kb:.1f} KB)')

if __name__ == '__main__':
    build()
