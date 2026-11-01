#!/usr/bin/env python3
"""Builds the single-file prototype (index.html) from src/. Run: python3 build.py"""
import glob, os
here = os.path.dirname(os.path.abspath(__file__))
rd = lambda p: open(os.path.join(here, p), encoding='utf-8').read()
js = '\n'.join(rd(f) for f in sorted(os.path.relpath(p, here) for p in glob.glob(os.path.join(here, 'src/js/*.js'))))
out = rd('src/head.html') + '<style>\n' + rd('src/base.css') + rd('src/modules.css') + '\n</style>\n\n' + rd('src/body.html') + '\n<script>\n(function () {\n' + js + '\n})();\n</script>\n'
open(os.path.join(here, 'index.html'), 'w', encoding='utf-8').write(out)
print('built index.html', len(out) // 1024, 'KB from', len(glob.glob(os.path.join(here, 'src/js/*.js'))), 'scripts')
