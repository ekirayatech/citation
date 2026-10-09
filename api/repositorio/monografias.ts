export default async function handler(req: any, res: any) {
  try {
    const targetUrl = `https://script.google.com/macros/s/AKfycbyXv5xr3CJ1oQ7o88P34EJH3tm6ltJhXhH7UAtZZHd_0l7Jjvp5m9U9nM1rl1OtXkRD/exec?action=getMonografias&_t=${Date.now()}`;
    const gasResp = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });
    const parsed = await gasResp.json();
    const rows = Array.isArray(parsed?.data) ? parsed.data : Array.isArray(parsed?.rows) ? parsed.rows : [];
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.status(200).json({
      status: 'success',
      source: 'google_sheets',
      rows: rows.length,
      monografias: rows,
      data: rows,
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'error',
      source: 'google_sheets',
      rows: 0,
      monografias: [],
      data: [],
      error: err?.message || 'Error consultando Google Sheets',
    });
  }
}
