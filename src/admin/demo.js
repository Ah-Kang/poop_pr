import { shiftDay, zeroMetrics } from '../../shared/analytics.js';

// Display-only fixtures. Never written to the game database or mixed with real analytics.
export function demoAnalytics(filters) {
  let allUsers=Array.from({length:27},(_,i)=>({ ...zeroMetrics(),id:`example-player-${String(i+1).padStart(3,'0')}`,nickname:['푸딩연구가','민트수집가','화장실장인','왕관도전자','새싹똥'][i%5]+(i+1),provider:i%4===0?'local':'kakao',createdAt:`${shiftDay(filters.to,-i)}T00:00:00Z`,lastSeen:`${filters.to}T00:${String(i+10).padStart(2,'0')}:00Z`,activeDays:Math.min(1+i%8,Math.round((Date.parse(filters.to)-Date.parse(filters.from))/86400000)+1),playSeconds:2400+i*170,mainSeconds:1800+i*120,puzzleSeconds:600+i*50,clicks:700+i*93,sessions:4+i%9,poopUpgrades:20+i*3,evolutions:i%7,itemUpgrades:i+2,wardrobeOpens:3+i%5,skinEquips:1+i%3,puzzleEntries:3+i%5,puzzleMoves:18+i*2,partsEarned:8+i,toiletCrafts:i%4,tokensSpent:24,tokensReceived:48,legacySeconds:0,gold:3000+i*1200,dps:12+i*8,selectedPoopId:i%10,highestPoopId:i%10,discovered:i%10+1,toiletLevel:i%6,tokens:30+i,parts:i*2,poopLevels:Array.from({length:20},(_,n)=>n<=i%10?10:0),cosmetics:{material:'original',expression:'default',outfit:'none'}}));
  allUsers=allUsers.filter(u=>(filters.provider==='all'||u.provider===filters.provider)&&(!filters.search||u.nickname.includes(filters.search)||u.id.includes(filters.search)));
  allUsers.sort((a,b)=>filters.sort==='clicks'?b.clicks-a.clicks:filters.sort==='playSeconds'?b.playSeconds-a.playSeconds:b.lastSeen.localeCompare(a.lastSeen));
  const daily=[];
  for(let day=filters.from;day<=filters.to;day=shiftDay(day,1))daily.push({...zeroMetrics(),day,activeUsers:0,legacySeconds:0,playSeconds:0});
  for(const user of allUsers) for(let i=0;i<user.activeDays;i++) {
    const day=daily[daily.length-1-i];if(!day)continue;day.activeUsers++;
    for(const key of ['playSeconds',...Object.keys(zeroMetrics())])day[key]+=Math.floor(user[key]/user.activeDays)+(i===0?user[key]%user.activeDays:0);
  }
  const summary={...zeroMetrics(),totalUsers:allUsers.length,newUsers:allUsers.filter(u=>u.createdAt.slice(0,10)>=filters.from&&u.createdAt.slice(0,10)<=filters.to).length,activeUsers:allUsers.length,returningUsers:allUsers.filter(u=>u.activeDays>1).length,puzzleUsers:allUsers.length,playSeconds:0,legacySeconds:0};
  for(const user of allUsers) for(const key of ['playSeconds',...Object.keys(zeroMetrics())]) summary[key]+=user[key]||0;
  const distribution=Array.from({length:10},(_,stage)=>({stage,users:allUsers.filter(u=>u.selectedPoopId===stage).length}));
  return {filters,summary,daily,users:allUsers.slice((filters.page-1)*20,filters.page*20),allUsers,distribution,pageSize:20,trackingStartedAt:`${filters.from}T00:00:00Z`,generatedAt:new Date().toISOString(),demo:true};
}
