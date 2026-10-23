// Real-looking worst cases: the longest text each component must survive, in both languages.
export const long = {
  en: {
    title: 'Quarterly business review with Client A — second round, Neihu office, bring the revised quote',
    email: 'someone.with.a.very.long.alias@example.com',
    sentence: 'The client asked for a revised quote by Friday afternoon; bring the notes from the first meeting and the updated delivery schedule.',
  },
  'zh-TW': {
    title: '客戶 A 季度業務檢討——第二次會議，內湖辦公室，請帶修改後的報價單和上次的會議紀錄',
    email: 'someone.with.a.very.long.alias@example.com',
    sentence: '客戶希望在週五下午前收到修改後的報價；請帶上第一次會議的紀錄和更新後的交期表，會議前先和業務確認數量。',
  },
} as const
