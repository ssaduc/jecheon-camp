// Live forecast for 제천 (Open-Meteo, no API key). Falls back to the client's stored snapshot on error.
const CODES = {
  0: "맑음", 1: "대체로 맑음", 2: "구름 많음", 3: "흐림", 45: "안개", 48: "안개",
  51: "이슬비", 53: "이슬비", 55: "이슬비", 61: "비", 63: "비", 65: "강한 비",
  71: "눈", 73: "눈", 75: "많은 눈", 80: "소나기", 81: "소나기", 82: "강한 소나기",
  95: "뇌우", 96: "뇌우", 99: "뇌우",
};
module.exports = async (req, res) => {
  const q = "https://api.open-meteo.com/v1/forecast?latitude=37.13&longitude=128.19" +
    "&daily=weather_code,temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum" +
    "&timezone=Asia%2FSeoul&start_date=2026-10-09&end_date=2026-10-11";
  try {
    const r = await fetch(q);
    const j = await r.json();
    const d = j.daily;
    if (!d || !d.time) throw new Error("no data");
    const days = d.time.map((date, i) => ({
      date,
      tmin: d.temperature_2m_min[i],
      tmax: d.temperature_2m_max[i],
      sky: CODES[d.weather_code[i]] || "",
      pop: d.precipitation_probability_max[i] == null ? 0 : d.precipitation_probability_max[i],
      mm: d.precipitation_sum[i],
    }));
    const now = new Date().toLocaleString("sv-SE", { timeZone: "Asia/Seoul" }).slice(0, 16);
    res.setHeader("Cache-Control", "s-maxage=900, stale-while-revalidate=3600");
    res.status(200).json({ live: true, asOf: now, source: "Open-Meteo 제천", days });
  } catch (e) {
    res.status(502).json({ error: String(e.message || e) });
  }
};
