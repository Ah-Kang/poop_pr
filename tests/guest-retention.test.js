import test from 'node:test';
import assert from 'node:assert/strict';
import { DatabaseSync } from 'node:sqlite';
import { initializeAnalytics, recordTelemetry, purgeGuestAnalytics } from '../server/analytics.js';
import { normalizeGuestTelemetry } from '../shared/analytics.js';
import { koreaDay } from '../shared/economy.js';
import { randomUUID } from 'node:crypto';

test('90-day guest retention deletes the entire anonymous history without deleting active guests or accounts',async()=>{
  const db=new DatabaseSync(':memory:');
  try{
    db.exec("PRAGMA foreign_keys=ON; CREATE TABLE users(kakao_id TEXT PRIMARY KEY); INSERT INTO users VALUES ('member');");
    await initializeAnalytics(null,db);
    const now=Date.now(),expired=now-91*86400000,recent=now-89*86400000;
    for(const [id,stamp] of [['guest:expired',expired],['guest:active',recent]]){
      const {packet}=normalizeGuestTelemetry({guestKey:randomUUID(),sessionId:randomUUID(),streamId:randomUUID(),day:koreaDay(stamp),counters:{clicks:8,mainSeconds:40},capturedAt:stamp,progress:{level:5,gold:100,dps:1,toiletLevel:0}},stamp);
      await recordTelemetry(id,packet,stamp,true);
    }
    await purgeGuestAnalytics(now);
    for(const table of ['guest_analytics_profiles','guest_analytics_sessions','guest_analytics_streams','guest_analytics_daily']){
      assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE kakao_id=?`).get('guest:expired').n,0,table);
      assert.equal(db.prepare(`SELECT COUNT(*) AS n FROM ${table} WHERE kakao_id=?`).get('guest:active').n,1,table);
    }
    assert.equal(db.prepare('SELECT COUNT(*) AS n FROM users').get().n,1);
  }finally{db.close();}
});
