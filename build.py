"""Збирає сайт в один файл index.html у корені репо (звідти його роздає GitHub Pages).
    python3 build.py"""
import os
H = os.path.dirname(os.path.abspath(__file__))
r = lambda *p: open(os.path.join(H, *p), encoding='utf-8').read()
js = '\n'.join(r('src', f) for f in ('data.js', 'core.js', 'app.js'))
html = r('src', 'page.html').replace('__CSS__', r('src', 'style.css')).replace('__JS__', js)
open(os.path.join(H, 'index.html'), 'w', encoding='utf-8').write(html)
open(os.path.join(H, '.nojekyll'), 'w').close()
print('index.html', len(html.encode()), 'байт')
