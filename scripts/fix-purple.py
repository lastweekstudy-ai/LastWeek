import os
import re

# Replacements to apply
REPLACEMENTS = [
    ('#a855f7', 'var(--color-accent)'),
    ('#A855F7', 'var(--color-accent)'),
    ('#9333ea', 'var(--color-accent-hover)'),
    ('#8B5CF6', 'var(--color-accent)'),
    ('#8b5cf6', 'var(--color-accent)'),
    ('#c084fc', 'var(--color-accent-light)'),
    ('rgba(168, 85, 247,', 'rgba(var(--color-accent-rgb),'),
    ('rgba(168,85,247,', 'rgba(var(--color-accent-rgb),'),
    ('rgba(139, 92, 246,', 'rgba(var(--color-accent-rgb),'),
    ('rgba(139,92,246,', 'rgba(var(--color-accent-rgb),'),
]

# Extensions to process
EXTENSIONS = ('.jsx', '.js', '.css')

# Directories to skip
SKIP_DIRS = {'node_modules', '.git', 'dist', '__tests__'}

# Files to skip (global.css has intentional purple values for the purple theme definition)
SKIP_FILES = {'global.css'}

updated = []

for root, dirs, files in os.walk('src'):
    # Skip unwanted directories
    dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
    
    for fname in files:
        if not any(fname.endswith(ext) for ext in EXTENSIONS):
            continue
        if fname in SKIP_FILES:
            continue
            
        fpath = os.path.join(root, fname)
        
        with open(fpath, 'r', encoding='utf-8', errors='ignore') as f:
            content = f.read()
        
        original = content
        for old, new in REPLACEMENTS:
            content = content.replace(old, new)
        
        if content != original:
            with open(fpath, 'w', encoding='utf-8', newline='') as f:
                f.write(content)
            updated.append(fpath)

print(f"Updated {len(updated)} files:")
for f in updated:
    print(f"  {f}")
