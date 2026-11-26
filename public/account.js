const byId = id => document.getElementById(id);
const status = message => { byId('status').textContent = message; };
let account = null;
async function loadAccount() {
  try {
    const response = await fetch('/api/me', {cache:'no-store'});
    if (response.status === 401) account = null;
    else { if (!response.ok) throw new Error(); account = (await response.json()).user; }
    byId('login').hidden = Boolean(account);
    byId('delete-section').hidden = !account;
    byId('account-name').textContent = account ? `${account.nickname} 님의 계정` : '';
    status(account ? '아래에서 삭제 범위를 확인해 주세요.' : '삭제할 계정으로 로그인해 주세요.');
  } catch { status('서버에 연결할 수 없습니다. 잠시 후 새로고침해 주세요.'); }
}
byId('login-form').addEventListener('submit', async event => {
  event.preventDefault(); const button = event.submitter; button.disabled = true;
  try {
    const response = await fetch('/api/auth/local/login', {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({loginId:byId('login-id').value,password:byId('password').value})});
    byId('password').value = '';
    if (!response.ok) throw new Error();
    await loadAccount();
  } catch { status('로그인에 실패했습니다. 아이디와 비밀번호 또는 연결 상태를 확인해 주세요.'); }
  finally { button.disabled = false; }
});
byId('delete-form').addEventListener('submit', async event => {
  event.preventDefault(); if (!account || byId('confirmation').value !== '삭제' || !byId('agree').checked) return;
  const button = event.submitter; button.disabled = true;
  try {
    const response = await fetch('/api/account', {method:'DELETE',headers:{'Content-Type':'application/json'},body:JSON.stringify({confirmation:'DELETE'})});
    if (!response.ok) throw new Error();
    // Remove this game's local mirrors without touching unrelated site storage.
    for (const storage of [localStorage,sessionStorage]) {
      try { for (const key of Object.keys(storage)) if (key.startsWith('poop-pr-')) storage.removeItem(key); } catch { /* Browser may block storage. */ }
    }
    account=null; byId('delete-section').hidden=true; byId('login').hidden=true;
    status('계정과 연결된 게임 기록·랭킹·이용 분석 데이터가 삭제되었습니다.');
  } catch { status('삭제를 완료하지 못했습니다. 로그인 상태를 확인하고 다시 시도하거나 문의 이메일로 연락해 주세요.'); button.disabled=false; }
});
loadAccount();
