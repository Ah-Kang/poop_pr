import test from 'node:test';
import assert from 'node:assert/strict';
import {randomUUID} from 'node:crypto';
import {DatabaseSync} from 'node:sqlite';
import {normalizeFeedback,feedbackFilters} from '../shared/feedback.js';
import {initializeFeedback,saveFeedback,listFeedback,updateFeedback,purgeResolvedFeedback} from '../server/feedback.js';

test('feedback accepts plain text only, validates bounds and rejects unsupported filters',()=>{
  const id=randomUUID();
  assert.deepEqual(normalizeFeedback({id,message:'  버그\n제보 💩  ',userId:'forged'}),{id,message:'버그\n제보 💩'});
  for(const message of ['', '   ', 'a'.repeat(2001), {}, null, 'bad\u0000text'])assert.throws(()=>normalizeFeedback({id,message}));
  assert.throws(()=>normalizeFeedback({id:'invalid',message:'hello'}));
  assert.equal(normalizeFeedback({id,message:'a'.repeat(2000)}).message.length,2000);
  for(const query of [{status:'deleted'},{page:0},{page:1.5},{page:'1 OR 1=1'}])assert.throws(()=>feedbackFilters(query));
});

test('feedback survives duplicate retries, paginates, expires resolved items, and cascades on account deletion',async()=>{
  const db=new DatabaseSync(':memory:');
  db.exec('PRAGMA foreign_keys=ON; CREATE TABLE users(kakao_id TEXT PRIMARY KEY,nickname TEXT,display_nickname TEXT);');
  db.prepare('INSERT INTO users VALUES (?,?,?)').run('user-a','원래 이름','게임 닉네임');
  try{
    await initializeFeedback(null,db);
    const packet={id:randomUUID(),message:'<script>alert(1)</script>\n그대로 읽을 수 있는 문의'};
    await Promise.all([saveFeedback(packet,'user-a'),saveFeedback(packet,'user-a')]);
    assert.equal((await listFeedback()).total,1);
    assert.equal((await listFeedback()).items[0].nickname,'게임 닉네임');
    assert.equal((await listFeedback()).items[0].message,packet.message);
    await assert.rejects(saveFeedback({...packet,message:'덮어쓰기'},'user-a'),/feedback_conflict/);
    for(let i=0;i<24;i++)await saveFeedback({id:randomUUID(),message:`게스트 문의 ${i}`},null,Date.now()+i);
    assert.equal((await listFeedback({page:1})).items.length,20);
    assert.equal((await listFeedback({page:2})).items.length,5);
    await updateFeedback(packet.id,'resolved');
    assert.equal((await listFeedback({status:'new'})).filteredTotal,24);
    assert.equal((await listFeedback({status:'resolved'})).filteredTotal,1);
    await updateFeedback(packet.id,'new');
    assert.equal((await listFeedback()).unread,25);
    db.prepare('DELETE FROM users WHERE kakao_id=?').run('user-a');
    assert.equal((await listFeedback()).total,24);
    const guest=(await listFeedback()).items[0];
    await updateFeedback(guest.id,'resolved',Date.now()-31*86400000);
    await purgeResolvedFeedback();
    assert.equal((await listFeedback()).total,23);
    assert.equal(await updateFeedback(randomUUID(),'resolved'),false);
  }finally{db.close();}
});
