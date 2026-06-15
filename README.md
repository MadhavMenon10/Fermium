# Fermium

**Can you guesstimate?**

Fermium is a web-based [Fermi estimation](https://en.wikipedia.org/wiki/Fermi_problem) game. You get questions like _"How many piano tuners are there in Chicago?"_ and answer with a single number. Scoring is based on how close you land to the true value **on a logarithmic scale** — getting the right order of magnitude is what matters, not the exact figure.

Inspired by the structure of [TeXnique](https://texnique.xyz), Fermium has two modes:

- **Competitive** — 10 minutes on the clock. Answer as many questions as you can. The timer runs through everything, including the result screens. Submit your total to the global leaderboard.
- **Casual** — No timer, no pressure. Just practice your estimation.

Built with vanilla HTML, CSS, and JavaScript — no framework, no build step. The leaderboard is backed by [Supabase](https://supabase.com) through its REST API.

## How scoring works

Each question is scored on order-of-magnitude accuracy:

```
baseScore = max(0, round(100 - 20 * |log10(yourAnswer / trueAnswer)|))
```

A perfect answer scores 100. Being off by one order of magnitude (10×) costs 20 points, two orders 40, and so on.

In competitive mode you also earn a one-time **time bonus** at the end of the round:

```
timeBonus = max(0, round(50 * (1 - timeUsed / 600)))
```

Your **total** is the sum of all base scores plus the time bonus.

## Running locally

No build step, no dependencies:

1. Create `config.js` in the project root (see [Configuration](#configuration)).
2. Make sure `questions.js` contains a populated `QUESTIONS` array.
3. Open `index.html` directly in your browser.

> Some browsers restrict `fetch()` on `file://` pages, so the leaderboard may not load when you open the file directly. If so, serve the folder over a tiny local server — e.g. `python3 -m http.server` — and visit `http://localhost:8000`.

## Configuration

`config.js` holds your Supabase credentials and is **gitignored** so keys stay out of version control. Create it in the project root:

```js
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "your-anon-or-publishable-key";
```

## Supabase setup

1. Create a project at [supabase.com](https://supabase.com).
2. In the SQL editor, create the `scores` table:

```sql
create table scores (
  id bigint primary key generated always as identity,
  name text not null,
  score int4 not null,
  time_bonus int4 not null,
  total int4 not null,
  questions_answered int4 not null,
  created_at timestamptz default now()
);
```

3. Enable Row Level Security and add policies allowing anonymous `insert` and `select` on `scores` (the game talks to Supabase from the browser using the public anon/publishable key).
4. Copy your project URL and key into `config.js`.

## Deploying

Fermium is just static files, so it deploys anywhere that serves static content.

**Netlify (drag & drop)** — Nothing to build. Go to [app.netlify.com/drop](https://app.netlify.com/drop) and drag the project folder in. Because `config.js` is gitignored, make sure the folder you drop includes it.

**GitHub Pages** — Push the repo to GitHub, then under _Settings → Pages_ pick the branch and the `/ (root)` folder. Since `config.js` is gitignored it won't be published automatically, so add a deploy-specific config as part of your Pages setup.

## Project structure

| File | Purpose |
| --- | --- |
| `index.html` | Single page; every screen lives here and is toggled with JS. |
| `style.css` | Design system and all screen styling. |
| `config.js` | Supabase URL + key (gitignored). |
| `questions.js` | The `QUESTIONS` array. |
| `game.js` | Round loop, scoring, session state, screen navigation. |
| `leaderboard.js` | Supabase REST calls for submitting and fetching scores. |
