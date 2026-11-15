export const BOARD_SIZE = 5
export const HAND_SIZE = 5
export const ZONE_MAX = 3
export const SCORE_PER_PLACE = 10
export const SCORE_PER_BINGO = 100
export const SCORE_PER_WASH = 50
export const RECORDS_MAX = 10

// 락스 1개에 필요한 세탁 횟수: 기본 3회, 1000점마다 +1회
export const BLEACH_BASE_WASHES = 3
export const BLEACH_STEP_SCORE = 1000
export const washesPerBleach = (score: number) =>
  BLEACH_BASE_WASHES + Math.floor(score / BLEACH_STEP_SCORE)

export const ITEMS = [
  { id: 'shirt', emoji: '👕', color: '#ffd6d6' },
  { id: 'pants', emoji: '👖', color: '#d6e4ff' },
  { id: 'sock', emoji: '🧦', color: '#fff1c2' },
  { id: 'cap', emoji: '🧢', color: '#d9f5dd' },
  { id: 'dress', emoji: '👗', color: '#ecdcff' },
  { id: 'coat', emoji: '🧥', color: '#ffe0c7' },
  { id: 'shorts', emoji: '🩳', color: '#c9f0f0' },
  { id: 'scarf', emoji: '🧣', color: '#f5d0e6' },
] as const

// 점수 구간별 등장 아이템 수 (ITEMS 앞에서부터 사용)
export const TYPE_UNLOCKS = [
  { score: 0, types: 5 },
  { score: 600, types: 6 },
  { score: 1200, types: 7 },
  { score: 1800, types: 8 },
]

export const typeCountFor = (score: number) =>
  TYPE_UNLOCKS.filter((u) => score >= u.score).at(-1)!.types

export type ItemId = (typeof ITEMS)[number]['id']

export const itemById = (id: ItemId) => ITEMS.find((it) => it.id === id)!
