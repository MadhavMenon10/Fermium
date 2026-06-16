const HEADERS = {
  'Content-Type': 'application/json',
  'apikey': SUPABASE_ANON_KEY,
  'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
};

async function submitScore(name, score, timeBonus, total, questionsAnswered) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/scores`, {
    method: 'POST',
    headers: { ...HEADERS, 'Prefer': 'return=minimal' },
    body: JSON.stringify({
      name,
      score,
      time_bonus: timeBonus,
      total,
      questions_answered: questionsAnswered
    })
  });
  return res.ok;
}

async function fetchLeaderboard(period) {
  let url = `${SUPABASE_URL}/rest/v1/scores?select=*&order=total.desc&limit=10`;
  if (period === 'week') {
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    url += `&created_at=gte.${weekAgo}`;
  }
  const res = await fetch(url, { headers: HEADERS });
  return res.ok ? await res.json() : [];
}
