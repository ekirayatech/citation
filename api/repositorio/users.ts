export default async function handler(req: any, res: any) {
  try {
    const targetUrl = `https://script.google.com/macros/s/AKfycbyXv5xr3CJ1oQ7o88P34EJH3tm6ltJhXhH7UAtZZHd_0l7Jjvp5m9U9nM1rl1OtXkRD/exec?action=getUsers&_t=${Date.now()}`;
    const gasResp = await fetch(targetUrl, {
      method: 'GET',
      headers: { 'Cache-Control': 'no-cache' },
    });
    const parsed = await gasResp.json();
    const data = Array.isArray(parsed?.data) ? parsed.data : [];
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    return res.status(200).json({
      status: 'success',
      data,
    });
  } catch (err: any) {
    return res.status(500).json({
      status: 'error',
      data: [],
      error: err?.message || 'Error consultando usuarios de Google Sheets',
    });
  }
}
