export const roofFixture = Object.freeze({
  width: 800, height: 830,
  conference: { title: '2026年度癌症醫學會議', subtitle: '癌症治療醫學研討會', date: '2026年9月14日', time: '08:30 - 12:00', location: '台北國際會議中心', showMeetupPoint: false, hideModerator: false, mergeSameModerator: false },
  agenda: [
    { time: '08:30-09:00', topic: '報到註冊', speaker: '', moderator: '' },
    { time: '09:00-09:30', topic: '肺癌篩檢最新進展', speaker: '胸腔科主任', moderator: '呼吸治療師' },
    { time: '09:30-10:30', topic: '免疫治療在肺癌的應用', speaker: '腫瘤科醫師', moderator: '內科醫師' },
    { time: '10:30-11:00', topic: '茶歇時間', speaker: '', moderator: '' },
    { time: '11:00-12:00', topic: '精準醫療與基因檢測', speaker: '病理科教授', moderator: '分子診斷專家' }
  ],
  footer: '本會議是醫藥學術會議,與會者皆是醫療專業人員,眷屬不適合參加,本公司亦不會支付眷屬費用。此外,為使與會醫療專業人員享有高質量專業的學術會議。當需要時,本公司會安排特約廠商到場協助接待及做會議紀錄。廠商與默沙東公司簽有服務保密條款,並承諾廠商代表在執行服務時,會議仍順暢進行。如有不便之處,敬請見諒。'
});

export function fixtureCustomColors(scheme) {
  return { headerC1: scheme.header.colors[0], headerC2: scheme.header.colors[1], headerC3: scheme.header.colors[2],
    agendaBg: scheme.agenda.background, agendaBorder: scheme.agenda.border, agendaAccent: scheme.agenda.accent,
    bgC1: '#FFFFFF', bgC2: '#FFFFFF', bgGradientDir: 'none' };
}
