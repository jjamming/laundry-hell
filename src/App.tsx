import { useEffect, useReducer, useRef, useState, type DragEvent } from 'react'
import {
  ZONE_MAX,
  itemById,
  typeCountFor,
  washesPerBleach,
  type ItemId,
} from './game/config'
import { blockedLines, initGame, reducer } from './game/logic'
import { loadRecords, saveRecord, type ScoreRecord } from './game/records'

const newSeed = () => (Math.random() * 2 ** 32) >>> 0

type Drag = { from: 'hand' | 'zone'; index: number }

function Item({ id }: { id: ItemId }) {
  const item = itemById(id)
  return (
    <span className="item" style={{ background: item.color }}>
      {item.emoji}
    </span>
  )
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, undefined, () => initGame(newSeed()))
  const [records, setRecords] = useState<ScoreRecord[]>(loadRecords)
  const [washing, setWashing] = useState(false)
  const dragging = useRef<Drag | null>(null)
  const blockedCells = new Set(blockedLines(state).flat())
  const needWash = blockedCells.size > 0
  const bleachCost = washesPerBleach(state.score)

  useEffect(() => {
    if (state.over) setRecords(saveRecord(state.score))
  }, [state.over, state.score])

  const wash = (zone: number) => {
    dispatch({ type: 'wash', zone })
    setWashing(true)
    setTimeout(() => setWashing(false), 500)
  }

  const startDrag = (d: Drag) => (e: DragEvent) => {
    dragging.current = d
    e.dataTransfer.effectAllowed = 'move'
  }
  const takeDrag = () => {
    const d = dragging.current
    dragging.current = null
    return d
  }
  const allowDrop = (e: DragEvent) => e.preventDefault()

  return (
    <main className="game">
      <header className="hud">
        <h1>세탁지옥</h1>
        <div className="score">
          {state.score.toLocaleString()}점
          <small key={typeCountFor(state.score)}>빨래 {typeCountFor(state.score)}종</small>
        </div>
      </header>

      <div className="play">
        <aside className="side">
          <section className="zone">
            <h2>빨래 바구니</h2>
            {Array.from({ length: ZONE_MAX }, (_, i) => {
              const id = state.zone[i]
              return (
                <button
                  key={i}
                  className={`zone-slot ${needWash ? 'nudge' : ''}`}
                  disabled={!id}
                  draggable={!!id}
                  onDragStart={startDrag({ from: 'zone', index: i })}
                  onClick={() => wash(i)}
                  title="클릭하거나 세탁기로 끌어다 넣기"
                >
                  {id && (
                    <>
                      <Item id={id} />
                      <span className="count">×5</span>
                    </>
                  )}
                </button>
              )
            })}
          </section>

          <div className="helper">
            {needWash && <p className="bubble">빨래 좀 돌려줘!</p>}
            <span className={needWash ? 'upset' : ''}>{needWash ? '😫' : '🙂'}</span>
          </div>

          <div
            className={`washer ${washing ? 'spin' : ''}`}
            onDragOver={allowDrop}
            onDrop={() => {
              const d = takeDrag()
              if (d?.from === 'zone') wash(d.index)
            }}
          >
            <div className="drum">🫧</div>
            <span>세탁기</span>
          </div>

          <section className="bleach">
            <button
              className={`bleach-btn ${state.bleachMode ? 'active' : ''}`}
              disabled={state.bleach === 0}
              onClick={() => dispatch({ type: 'toggleBleach' })}
            >
              🧴 락스 {state.bleach}
            </button>
            <div className="progress" title={`세탁 ${bleachCost}번마다 락스 1개`}>
              {Array.from({ length: bleachCost }, (_, i) => (
                <span key={i} className={i < state.washProgress ? 'on' : ''} />
              ))}
            </div>
          </section>
        </aside>

        <div className={`board ${state.bleachMode ? 'bleaching' : ''}`}>
          {state.board.map((cell, i) => (
            <button
              key={i}
              className={`cell ${blockedCells.has(i) ? 'blocked' : ''}`}
              onClick={() => dispatch({ type: 'place', cell: i })}
              onDragOver={allowDrop}
              onDrop={() => {
                const d = takeDrag()
                if (d?.from === 'hand') dispatch({ type: 'place', cell: i, hand: d.index })
              }}
            >
              {cell && <Item id={cell} />}
            </button>
          ))}
        </div>
      </div>

      <footer className="hand">
        {state.hand.map((id, i) => (
          <button
            key={i}
            className={`hand-slot ${state.selected === i ? 'selected' : ''}`}
            disabled={!id}
            draggable={!!id}
            onDragStart={startDrag({ from: 'hand', index: i })}
            onClick={() => dispatch({ type: 'select', hand: i })}
          >
            {id && <Item id={id} />}
          </button>
        ))}
      </footer>

      <p className="hint">
        {state.bleachMode
          ? '지울 칸을 누르세요'
          : '빨래를 골라 칸에 놓으세요 · 같은 빨래 5개를 한 줄로!'}
      </p>

      {state.over && (
        <div className="overlay">
          <div className="modal">
            <h2>빨래에 파묻혔어요 🫠</h2>
            <p className="final">{state.score.toLocaleString()}점</p>
            <ol className="records">
              {records.map((r, i) => (
                <li key={r.at + i}>
                  <span>{r.score.toLocaleString()}점</span>
                  <time>{new Date(r.at).toLocaleDateString()}</time>
                </li>
              ))}
            </ol>
            <button className="restart" onClick={() => dispatch({ type: 'restart', seed: newSeed() })}>
              다시 하기
            </button>
          </div>
        </div>
      )}
    </main>
  )
}
