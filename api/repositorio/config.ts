export default async function handler(req: any, res: any) {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  return res.status(200).json({
    status: 'success',
    appsScriptExecUrl: 'https://script.google.com/macros/s/AKfycbxSHOyTaX-GhFfUEawLhL6MVpnRgd21ldcAQfYxC7EiJvrQO-IcGUyrDzt-xB3j2rPy/exec',
    sheetUrl: 'https://docs.google.com/spreadsheets/d/1_Te5Czkvtjue-49-foSBU3tWSTMg1-tucAPAzWIjJSw/edit',
  });
}
