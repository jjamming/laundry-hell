import { RECORDS_MAX } from './config'

export type ScoreRecord = { score: number; at: string }

const KEY = 'laundry-bingo:records'

export function loadRecords(): ScoreRecord[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) ?? '[]')
  } catch {
    return []
  }
}

export function saveRecord(score: number): ScoreRecord[] {
  const records = [...loadRecords(), { score, at: new Date().toISOString() }]
    .sort((a, b) => b.score - a.score)
    .slice(0, RECORDS_MAX)
  try {
    localStorage.setItem(KEY, JSON.stringify(records))
  } catch {
    // 저장 불가 환경(시크릿 모드 등)에선 이번 판 기록만 화면에 보여준다
  }
  return records
}
