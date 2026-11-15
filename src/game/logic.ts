import {
  BOARD_SIZE,
  HAND_SIZE,
  ITEMS,
  SCORE_PER_BINGO,
  SCORE_PER_PLACE,
  SCORE_PER_WASH,
  ZONE_MAX,
  washesPerBleach,
  typeCountFor,
  type ItemId,
} from './config'

export type Cell = ItemId | null

export type GameState = {
  board: Cell[]
  hand: Cell[]
  zone: ItemId[]
  bleach: number
  washProgress: number
  score: number
  selected: number | null
  bleachMode: boolean
  over: boolean
  seed: number
}

export type Action =
  | { type: 'select'; hand: number }
  | { type: 'place'; cell: number; hand?: number }
  | { type: 'wash'; zone: number }
  | { type: 'toggleBleach' }
  | { type: 'restart'; seed: number }

// 리듀서가 StrictMode에서 두 번 호출돼도 결과가 같도록 난수 상태를 state에 둔다
function nextRandom(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) | 0
  let r = Math.imul(t ^ (t >>> 15), 1 | t)
  r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r
  return [((r ^ (r >>> 14)) >>> 0) / 4294967296, t]
}

function dealHand(seed: number, score: number): [Cell[], number] {
  const types = typeCountFor(score)
  const hand: Cell[] = []
  for (let i = 0; i < HAND_SIZE; i++) {
    const [r, next] = nextRandom(seed)
    seed = next
    hand.push(ITEMS[Math.floor(r * types)].id)
  }
  return [hand, seed]
}

const LINES: number[][] = (() => {
  const n = BOARD_SIZE
  const idx = (r: number, c: number) => r * n + c
  const range = [...Array(n).keys()]
  return [
    ...range.map((r) => range.map((c) => idx(r, c))),
    ...range.map((c) => range.map((r) => idx(r, c))),
    range.map((i) => idx(i, i)),
    range.map((i) => idx(i, n - 1 - i)),
  ]
})()

export function completeLines(board: Cell[]): number[][] {
  return LINES.filter((line) => {
    const first = board[line[0]]
    return first !== null && line.every((i) => board[i] === first)
  })
}

// 완성 줄을 존 빈자리만큼 옮긴다. 존이 차 있으면 줄은 판에 남는다(빙고 점수도 옮길 때 지급).
function settle(s: GameState): GameState {
  const lines = completeLines(s.board).slice(0, ZONE_MAX - s.zone.length)
  if (lines.length === 0) return s
  const board = [...s.board]
  const zone = [...s.zone]
  for (const line of lines) zone.push(s.board[line[0]]!)
  for (const line of lines) for (const i of line) board[i] = null
  return { ...s, board, zone, score: s.score + SCORE_PER_BINGO * lines.length }
}

// 존이 꽉 차서 옮기지 못하고 판에 남은 빙고 줄
export function blockedLines(s: GameState): number[][] {
  return s.zone.length >= ZONE_MAX ? completeLines(s.board) : []
}

function checkOver(s: GameState): GameState {
  const full = s.board.every((c) => c !== null)
  const hasHand = s.hand.some((c) => c !== null)
  // 락스나 세탁(락스 획득·대기 줄 이동)으로 빠져나갈 수 있으면 아직 패배 아님
  const canRescue = s.bleach > 0 || s.zone.length > 0
  return { ...s, over: full && hasHand && !canRescue }
}

export function initGame(seed: number): GameState {
  const [hand, next] = dealHand(seed, 0)
  return {
    board: Array(BOARD_SIZE * BOARD_SIZE).fill(null),
    hand,
    zone: [],
    bleach: 0,
    washProgress: 0,
    score: 0,
    selected: null,
    bleachMode: false,
    over: false,
    seed: next,
  }
}

export function reducer(s: GameState, a: Action): GameState {
  if (a.type === 'restart') return initGame(a.seed)
  if (s.over) return s

  switch (a.type) {
    case 'select':
      if (s.hand[a.hand] === null) return s
      return { ...s, selected: s.selected === a.hand ? null : a.hand, bleachMode: false }

    case 'toggleBleach':
      if (s.bleach === 0) return s
      return { ...s, bleachMode: !s.bleachMode, selected: null }

    case 'place': {
      if (s.bleachMode) {
        if (s.board[a.cell] === null) return s
        const board = [...s.board]
        board[a.cell] = null
        return checkOver({ ...s, board, bleach: s.bleach - 1, bleachMode: false })
      }
      const h = a.hand ?? s.selected
      if (h === null || s.hand[h] === null || s.board[a.cell] !== null) return s
      const board = [...s.board]
      board[a.cell] = s.hand[h]
      let hand = [...s.hand]
      hand[h] = null
      let seed = s.seed
      const score = s.score + SCORE_PER_PLACE
      if (hand.every((c) => c === null)) [hand, seed] = dealHand(seed, score)
      return checkOver(settle({ ...s, board, hand, seed, score, selected: null }))
    }

    case 'wash': {
      if (s.zone[a.zone] === undefined) return s
      const zone = s.zone.filter((_, i) => i !== a.zone)
      const score = s.score + SCORE_PER_WASH
      let washProgress = s.washProgress + 1
      let bleach = s.bleach
      if (washProgress >= washesPerBleach(score)) {
        washProgress = 0
        bleach += 1
      }
      return checkOver(settle({ ...s, zone, washProgress, bleach, score }))
    }
  }
}
