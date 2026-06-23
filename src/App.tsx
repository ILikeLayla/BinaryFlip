import { useEffect, useState } from 'react'
import './App.css'

const MIN_DOT_COUNT = 1
const MAX_DOT_COUNT = 20
const DEFAULT_DOT_COUNT = 7
const DEFAULT_LOWER_BOUND = 1
const DEFAULT_UPPER_BOUND = 127
const MIN_CHALLENGE_COUNT = 1
const MAX_CHALLENGE_COUNT = 50
const DEFAULT_CHALLENGE_COUNT = 5

type Screen = 'start' | 'play' | 'end'

type GameConfig = {
  dotCount: number
  lowerBound: number
  upperBound: number
  challengeCount: number
}

type ChallengeSummary = {
  target: number
  representation: string
}

function buildEmptyBits(dotCount: number) {
  return Array.from({ length: dotCount }, () => false)
}

function getMaxRepresentable(dotCount: number) {
  return 2 ** dotCount - 1
}

function isPowerOfTwo(value: number) {
  return value > 0 && (value & (value - 1)) === 0
}

function getEligibleTargets(lowerBound: number, upperBound: number) {
  return Array.from(
    { length: upperBound - lowerBound + 1 },
    (_, index) => lowerBound + index,
  ).filter((value) => !isPowerOfTwo(value))
}

function App() {
  const [screen, setScreen] = useState<Screen>('start')
  const [draftConfig, setDraftConfig] = useState<GameConfig>({
    dotCount: DEFAULT_DOT_COUNT,
    lowerBound: DEFAULT_LOWER_BOUND,
    upperBound: DEFAULT_UPPER_BOUND,
    challengeCount: DEFAULT_CHALLENGE_COUNT,
  })
  const [config, setConfig] = useState<GameConfig | null>(null)
  const [bits, setBits] = useState(() => buildEmptyBits(DEFAULT_DOT_COUNT))
  const [targets, setTargets] = useState<number[]>([])
  const [activeChallengeIndex, setActiveChallengeIndex] = useState(0)
  const [summaries, setSummaries] = useState<ChallengeSummary[]>([])
  const [batchStartedAt, setBatchStartedAt] = useState<number | null>(null)
  const [elapsedTimeMs, setElapsedTimeMs] = useState(0)
  const [totalTimeMs, setTotalTimeMs] = useState(0)

  const maxRepresentable = getMaxRepresentable(draftConfig.dotCount)
  const activeConfig = config ?? draftConfig
  const currentTarget = targets[activeChallengeIndex] ?? 0

  const currentSum = bits.reduce(
    (total, isOn, index) => total + (isOn ? 2 ** index : 0),
    0,
  )
  const isMatch = screen === 'play' && currentSum === currentTarget

  const validationMessage = getValidationMessage(draftConfig)

  useEffect(() => {
    if (screen !== 'play' || batchStartedAt === null) {
      setElapsedTimeMs(0)
      return
    }

    setElapsedTimeMs(Date.now() - batchStartedAt)

    const intervalId = window.setInterval(() => {
      setElapsedTimeMs(Date.now() - batchStartedAt)
    }, 100)

    return () => window.clearInterval(intervalId)
  }, [batchStartedAt, screen])

  useEffect(() => {
    if (!isMatch) {
      return
    }

    const timeoutId = window.setTimeout(() => {
      const nextSummaries = [
        ...summaries,
        {
          target: currentTarget,
          representation: currentTarget.toString(2).padStart(activeConfig.dotCount, '0'),
        },
      ]

      if (activeChallengeIndex === targets.length - 1) {
        setSummaries(nextSummaries)
        setTotalTimeMs(batchStartedAt === null ? 0 : Date.now() - batchStartedAt)
        setScreen('end')
        setBits(buildEmptyBits(activeConfig.dotCount))
        return
      }

      setSummaries(nextSummaries)
      setActiveChallengeIndex((currentIndex) => currentIndex + 1)
      setBits(buildEmptyBits(activeConfig.dotCount))
    }, 900)

    return () => window.clearTimeout(timeoutId)
  }, [
    activeChallengeIndex,
    activeConfig.dotCount,
    batchStartedAt,
    currentTarget,
    isMatch,
    summaries,
    targets.length,
  ])

  const visibleIndices = Array.from(
    { length: activeConfig.dotCount },
    (_, offset) => activeConfig.dotCount - 1 - offset,
  )

  function toggleBit(index: number) {
    setBits((currentBits) =>
      currentBits.map((isOn, bitIndex) => (bitIndex === index ? !isOn : isOn)),
    )
  }

  function updateDraftConfig<K extends keyof GameConfig>(key: K, value: number) {
    setDraftConfig((currentConfig) => ({
      ...currentConfig,
      [key]: value,
    }))
  }

  function startGame() {
    if (validationMessage) {
      return
    }

    const nextConfig = { ...draftConfig }
    const eligibleTargets = getEligibleTargets(nextConfig.lowerBound, nextConfig.upperBound)
    const shuffledTargets = [...eligibleTargets].sort(() => Math.random() - 0.5)
    const nextTargets = shuffledTargets.slice(0, nextConfig.challengeCount)

    setConfig(nextConfig)
    setTargets(nextTargets)
    setActiveChallengeIndex(0)
    setSummaries([])
    setTotalTimeMs(0)
    setElapsedTimeMs(0)
    setBits(buildEmptyBits(nextConfig.dotCount))
    setBatchStartedAt(Date.now())
    setScreen('play')
  }

  function playAgain() {
    setConfig(null)
    setTargets([])
    setActiveChallengeIndex(0)
    setSummaries([])
    setTotalTimeMs(0)
    setBatchStartedAt(null)
    setElapsedTimeMs(0)
    setBits(buildEmptyBits(draftConfig.dotCount))
    setScreen('start')
  }

  const challengeProgress = `${Math.min(activeChallengeIndex + 1, targets.length)} / ${targets.length}`
  const elapsedSeconds = (elapsedTimeMs / 1000).toFixed(1)
  const totalSeconds = (totalTimeMs / 1000).toFixed(1)

  return (
    <main className="app-shell">
      <section className="game-panel">
        {screen === 'start' ? (
          <section className="menu-surface" aria-label="Start page">
            <div className="menu-block">
              <h1>Binary Flip</h1>
              <p className="menu-copy">Set the challenge range, dot count, and batch size.</p>
            </div>

            <div className="form-grid">
              <label>
                <span>Lower bound</span>
                <input
                  type="number"
                  min={0}
                  max={maxRepresentable}
                  value={draftConfig.lowerBound}
                  onChange={(event) => updateDraftConfig('lowerBound', Number(event.target.value))}
                />
              </label>

              <label>
                <span>Upper bound</span>
                <input
                  type="number"
                  min={0}
                  max={maxRepresentable}
                  value={draftConfig.upperBound}
                  onChange={(event) => updateDraftConfig('upperBound', Number(event.target.value))}
                />
              </label>

              <label>
                <span>Dots</span>
                <input
                  type="number"
                  min={MIN_DOT_COUNT}
                  max={MAX_DOT_COUNT}
                  value={draftConfig.dotCount}
                  onChange={(event) => updateDraftConfig('dotCount', Number(event.target.value))}
                />
              </label>

              <label>
                <span>Challenges</span>
                <input
                  type="number"
                  min={MIN_CHALLENGE_COUNT}
                  max={MAX_CHALLENGE_COUNT}
                  value={draftConfig.challengeCount}
                  onChange={(event) =>
                    updateDraftConfig('challengeCount', Number(event.target.value))
                  }
                />
              </label>
            </div>

            <div className="validation-row" aria-live="polite">
              {validationMessage ?? `Range fits ${draftConfig.dotCount} dots.`}
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={startGame}
              disabled={Boolean(validationMessage)}
            >
              Start
            </button>
          </section>
        ) : null}

        {screen === 'play' ? (
          <section className="play-surface" aria-label="Binary dots">
            <div className="play-main">
              <div className="progress-label">Challenge {challengeProgress}</div>

              <div className="bit-row">
                {visibleIndices.map((index) => (
                  <div className="bit-tile" key={index}>
                    <span className="bit-label">{2 ** index}</span>
                    <button
                      type="button"
                      className={`dot-button ${bits[index] ? 'is-on' : ''}`}
                      aria-pressed={bits[index]}
                      aria-label={`Toggle bit ${index} worth ${2 ** index}`}
                      onClick={() => toggleBit(index)}
                    />
                  </div>
                ))}
              </div>

              <section className="status-grid" aria-label="Round status">
                <div className="sum-card">
                  <span className="value-label">Current</span>
                  <div className="sum-value">{currentSum}</div>
                </div>

                <div className="target-card">
                  <span className="value-label">Target</span>
                  <div className="target-value">{currentTarget}</div>
                </div>
              </section>
            </div>

            <div className="timer-footer">Time {elapsedSeconds}s</div>
          </section>
        ) : null}

        {screen === 'end' ? (
          <section className="menu-surface" aria-label="End page">
            <div className="menu-block">
              <h1>Summary</h1>
              <p className="menu-copy">Total time: {totalSeconds}s</p>
            </div>

            <div className="summary-list" role="list" aria-label="Challenge summary">
              {summaries.map((summary, index) => (
                <div className="summary-row" key={`${summary.target}-${index}`} role="listitem">
                  <span>#{index + 1}</span>
                  <span>{summary.target}</span>
                  <span>{summary.representation}</span>
                </div>
              ))}
            </div>

            <button type="button" className="primary-button" onClick={playAgain}>
              Play again
            </button>
          </section>
        ) : null}
      </section>
    </main>
  )
}

function getValidationMessage(config: GameConfig) {
  if (!Number.isInteger(config.dotCount) || config.dotCount < MIN_DOT_COUNT) {
    return `Dots must be at least ${MIN_DOT_COUNT}.`
  }

  if (config.dotCount > MAX_DOT_COUNT) {
    return `Dots cannot exceed ${MAX_DOT_COUNT}.`
  }

  if (!Number.isInteger(config.lowerBound) || config.lowerBound < 0) {
    return 'Lower bound must be 0 or greater.'
  }

  if (!Number.isInteger(config.upperBound) || config.upperBound < 0) {
    return 'Upper bound must be 0 or greater.'
  }

  if (config.lowerBound > config.upperBound) {
    return 'Lower bound must be less than or equal to upper bound.'
  }

  const maxRepresentable = getMaxRepresentable(config.dotCount)

  if (config.upperBound > maxRepresentable) {
    return `Upper bound must fit in ${config.dotCount} dots. Max is ${maxRepresentable}.`
  }

  if (!Number.isInteger(config.challengeCount) || config.challengeCount < MIN_CHALLENGE_COUNT) {
    return `Challenges must be at least ${MIN_CHALLENGE_COUNT}.`
  }

  if (config.challengeCount > MAX_CHALLENGE_COUNT) {
    return `Challenges cannot exceed ${MAX_CHALLENGE_COUNT}.`
  }

  const eligibleTargets = getEligibleTargets(config.lowerBound, config.upperBound)

  if (eligibleTargets.length === 0) {
    return 'Range must include at least one number that is not a power of 2.'
  }

  if (config.challengeCount > eligibleTargets.length) {
    return `Challenges exceed available unique non-power-of-2 numbers in range. Max is ${eligibleTargets.length}.`
  }

  return null
}

export default App
