# Fermium
[This README was written by a human]
Fermium is a [Fermi estimation](https://en.wikipedia.org/wiki/Fermi_problem) game. You will be asked absurd questions like _"How many piano tuners work in Chicago?"_ and you answer with a single number. There's no expectation of getting the answer exactly correct, but you need to be within the right order of magnitude.

## Game modes

- **Competitive**: A 10-minute run against the clock. Answer as many questions as you can; the timer keeps ticking through the result screens. When time's up, submit your total to the global leaderboard.
- **Casual**: Practice your estimation for as long as you like and end the round whenever you want.

## Stack

- **Vanilla HTML, CSS, and JavaScript** — no framework and no build step. Open `index.html` and it runs.
- **[Supabase](https://supabase.com)** (through its REST API) backs the global leaderboard.

## Contributing questions

The question bank lives in `questions.js` as the `QUESTIONS` array, and adding to it is the easiest way to contribute. Append a new object with the next unused `id`:

```js
{
  id: ,
  prompt: "",
  category: "l",   // "general" or "interview"
  difficulty: ,         // 1 = Easy, 2 = Medium, 3 = Hard
  answer: ,           // the true value — must be a positive number
  answer_unit:",
  canonical_decomposition: ""
}
```

A few guidelines:

- `answer` must be a **positive number** as scoring is logarithmic, so 0 or negative values don't work.
- Keep `canonical_decomposition` to a tight chain of assumptions a player could plausibly reason through.
- Use `"general"` for everyday trivia and `"interview"` for market-sizing / estimation-interview style questions.

Then open a pull request with your additions.
