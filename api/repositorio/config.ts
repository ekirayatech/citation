export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  return res.status(200).json({
    status: 'success',
    appsScriptExecUrl: 'https://script.google.com/macros/s/AKfycbyXv5xr3CJ1oQ7o88P34EJH3tm6ltJhXhH7UAtZZHd_0l7Jjvp5m9U9nM1rl1OtXkRD/exec',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1EYG2IOUaZV3-v61-i5c9Zxp596s3QbhNQLyFRJujgow/edit',
  });
}
