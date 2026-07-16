# Harsha Jyothi Sree — Portfolio

Personal portfolio site for **Harsha Jyothi Sree**, Senior Data Engineer.
Live at **[harshajyothisreeakasapu.com](https://harshajyothisreeakasapu.com)** (hosted on GitHub Pages).

A dark, JSON-driven single-page site (navy / cyan / gold) with animated gradient
backgrounds and glassmorphism, built with plain HTML, CSS, and vanilla
JavaScript — no framework, no build step.

## Features

- **Dark theme**: navy, cyan, and gold with animated gradient orbs and a grid overlay
- **Glassmorphism**: frosted-glass cards and panels
- **JSON-driven content**: all copy, experience, projects, and skills live in `data/*.json`
- **Fully responsive**: mobile-first layout
- **No framework**: pure vanilla JavaScript, loads instantly on GitHub Pages

## Quick Start

Serve the folder with any static server:

```bash
python -m http.server 8000
```

Then open <http://localhost:8000>.

## Editing content

All content is data-driven — edit the JSON files in `data/`, no code changes needed:

| File | Controls |
|------|----------|
| `data/profile.json`, `data/hero.json` | Name, title, bio, hero stats, contact |
| `data/experience.json` | Work history |
| `data/projects.json` | Project cards (images in `assets/img/projects/`) |
| `data/skills.json` | Skills / tech stack |
| `data/education.json` | Education |
| `data/site-config.json` | SEO meta tags and branding |

To re-theme, edit the CSS variables at the top of `assets/css/styles.css`.

## Technologies

- HTML5, CSS3, Vanilla JavaScript
- Google Fonts (Inter, Syne)
- Font Awesome icons
- GitHub Pages + custom domain (`CNAME`)

## Contact

- **Email:** Jyothisree.work@gmail.com
- **LinkedIn:** https://www.linkedin.com/in/jyothisree123/
- **GitHub:** https://github.com/akasapu01
