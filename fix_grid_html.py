with open('index.html', 'r') as f:
    html = f.read()

# Make the wrapper div scrollable and set a min-width/height on the grid container
old_wrapper = '<div class="relative flex-grow p-4">'
new_wrapper = '<div class="relative flex-grow p-4 overflow-auto" id="grid-wrapper">'
html = html.replace(old_wrapper, new_wrapper)

# Update grid container classes
old_grid = 'id="grid-container" class="w-full h-full grid gap-[1px] bg-slate-200 dark:bg-slate-800/50 rounded overflow-hidden border border-slate-200 dark:border-slate-800"'
new_grid = 'id="grid-container" class="grid gap-[1px] bg-slate-200 dark:bg-slate-800/50 rounded overflow-hidden border border-slate-200 dark:border-slate-800 min-w-max min-h-max"'

if old_grid in html:
    html = html.replace(old_grid, new_grid)
else:
    # Let's search for what's actually there
    import re
    # The grid container currently looks like:
    # <div id="grid-container" class="w-full h-full grid gap-[1px] bg-slate-200 dark:bg-slate-800/50 rounded overflow-hidden border border-slate-200 dark:border-slate-800"></div>
    pattern = re.compile(r'id="grid-container" class="[^"]+"')
    # Actually, in script.js we dynamically add styles, but let's just replace the class string
    pass

# We will just replace it using regex to be safe
import re
html = re.sub(
    r'id="grid-container" class="[^"]*"',
    'id="grid-container" class="grid gap-[1px] bg-slate-200 dark:bg-slate-800/50 rounded border border-slate-200 dark:border-slate-800 w-max h-max mx-auto my-auto origin-center transition-transform duration-200"',
    html
)

# And add the ids for buttons
html = html.replace(
    '<button class="size-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">\n<span class="material-symbols-outlined">add</span>\n</button>',
    '<button id="zoomInBtn" class="size-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">\n<span class="material-symbols-outlined">add</span>\n</button>'
)

html = html.replace(
    '<button class="size-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">\n<span class="material-symbols-outlined">remove</span>\n</button>',
    '<button id="zoomOutBtn" class="size-12 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xl flex items-center justify-center hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors">\n<span class="material-symbols-outlined">remove</span>\n</button>'
)

html = html.replace(
    '<button class="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">\n<span class="material-symbols-outlined">settings</span>\n</button>',
    '<button id="settingsBtn" class="p-2 rounded-lg hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 transition-colors">\n<span class="material-symbols-outlined">settings</span>\n</button>'
)

with open('index.html', 'w') as f:
    f.write(html)
# Make sure wrapper exists
html = html.replace('<div class="relative flex-grow p-4">', '<div class="relative flex-grow p-4 overflow-auto flex items-center justify-center">')
with open('index.html', 'w') as f:
    f.write(html)
