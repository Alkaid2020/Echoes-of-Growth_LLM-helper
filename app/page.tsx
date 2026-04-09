'use client'

import { useState, useRef, useEffect } from 'react'
import { GoogleGenerativeAI } from '@google/generative-ai'

// ─── Types ────────────────────────────────────────────────────────────────────

type AppPhase = 'setup' | 'form' | 'generating' | 'result'

interface UserInputs {
  disappointment: string // 倾诉
  pastMemory: string     // 追溯
  innerVoice: string     // 深处（选填）
}

// ─── AI Prompt ────────────────────────────────────────────────────────────────

const SYSTEM_PROMPT = `You are "Echoes of Growth," a profound and gentle presence.

The user has shared three things with you:
1. A current disappointment or setback they are experiencing
2. A past moment when they felt truly capable and alive
3. Something they have never said aloud — their inner voice (may be empty)

Your task is to write this person a letter:
- Open with one or two sentences that honestly and tenderly acknowledge their disappointment — neither minimizing it nor overdramatizing it
- Draw a deep, specific connection between their past moment of strength and their current struggle
- Reveal a perspective: the version of them that once felt powerful has never truly disappeared — it has only been temporarily weighed down
- Reframe disappointment: you feel it because you care; disappointment is not proof of failure, it is an echo of growth
- Close with one sentence that belongs only to this person — a sentence with weight, like a seed planted

Tone: reflective, warm, quietly poetic — like a handwritten letter.
Length: 150–200 words.
Write in flowing paragraphs. No headers, no bullet points, no emoji.`

// ─── Component ────────────────────────────────────────────────────────────────

export default function Page() {
  const [phase, setPhase] = useState<AppPhase>('setup')
  const [apiKey, setApiKey] = useState('')
  const [apiKeyInput, setApiKeyInput] = useState('')
  const [apiKeyError, setApiKeyError] = useState('')

  const [inputs, setInputs] = useState<UserInputs>({
    disappointment: '',
    pastMemory: '',
    innerVoice: '',
  })
  const [formError, setFormError] = useState('')

  const [result, setResult] = useState('')
  const [genError, setGenError] = useState('')

  // Load saved key
  useEffect(() => {
    const saved = localStorage.getItem('echoes_gemini_key')
    if (saved) { setApiKey(saved); setApiKeyInput(saved) }
  }, [])

  // ── Save API key ────────────────────────────────────────────────────────────
  const handleSaveKey = () => {
    const trimmed = apiKeyInput.trim()
    if (!trimmed.startsWith('AIza')) {
      setApiKeyError('Invalid format — your key should start with "AIza"')
      return
    }
    localStorage.setItem('echoes_gemini_key', trimmed)
    setApiKey(trimmed)
    setApiKeyError('')
    setPhase('form')
  }

  // ── Submit form → call Gemini ───────────────────────────────────────────────
  const handleSubmit = async () => {
    if (!inputs.disappointment.trim()) {
      setFormError('Please share what is disappointing you right now')
      return
    }
    if (!inputs.pastMemory.trim()) {
      setFormError('Please recall a past moment when you felt strong')
      return
    }
    setFormError('')
    setGenError('')
    setPhase('generating')

    const userMessage = `[Current Disappointment]
${inputs.disappointment.trim()}

[A Past Moment of Strength]
${inputs.pastMemory.trim()}

[Inner Voice]
${inputs.innerVoice.trim() || '(not provided)'}`

    try {
      const genAI = new GoogleGenerativeAI(apiKey)
      const model = genAI.getGenerativeModel({
        model: 'gemini-2.5-flash',
        systemInstruction: SYSTEM_PROMPT,
      })
      const chat = model.startChat({ history: [] })
      const res = await chat.sendMessage(userMessage)
      const text = res.response.text().trim()
      setResult(text)
      setPhase('result')
    } catch (e: unknown) {
      const raw = e instanceof Error ? e.message : String(e)
      console.error('[Gemini error]', raw)

      let msg: string
      if (raw.includes('API_KEY_INVALID') || raw.includes('API key not valid')) {
        msg = 'Invalid API key — please go back to settings and re-enter it.'
      } else if (raw.includes('RESOURCE_EXHAUSTED') || raw.includes('quota')) {
        msg = 'API quota exhausted — please try again later or use a different key.'
      } else if (raw.includes('MODEL_NOT_FOUND') || raw.includes('not found')) {
        msg = `Model unavailable: ${raw}`
      } else {
        msg = `Error: ${raw}`
      }

      setGenError(msg)
      setPhase('generating')
    }
  }

  // ── Restart ─────────────────────────────────────────────────────────────────
  const handleRestart = () => {
    setInputs({ disappointment: '', pastMemory: '', innerVoice: '' })
    setResult('')
    setGenError('')
    setFormError('')
    setPhase('form')
  }

  // ─── Render ──────────────────────────────────────────────────────────────────

  if (phase === 'setup') {
    return (
      <SetupScreen
        apiKeyInput={apiKeyInput}
        setApiKeyInput={setApiKeyInput}
        error={apiKeyError}
        onSave={handleSaveKey}
      />
    )
  }

  if (phase === 'form') {
    return (
      <FormScreen
        inputs={inputs}
        setInputs={setInputs}
        error={formError}
        onSubmit={handleSubmit}
        onSettings={() => setPhase('setup')}
      />
    )
  }

  if (phase === 'generating') {
    return (
      <GeneratingScreen
        error={genError}
        onRetry={handleSubmit}
        onBack={() => setPhase('form')}
      />
    )
  }

  // result
  return (
    <ResultScreen
      result={result}
      onRestart={handleRestart}
      onSettings={() => setPhase('setup')}
    />
  )
}

// ─── SetupScreen ──────────────────────────────────────────────────────────────

function SetupScreen({
  apiKeyInput,
  setApiKeyInput,
  error,
  onSave,
}: {
  apiKeyInput: string
  setApiKeyInput: (v: string) => void
  error: string
  onSave: () => void
}) {
  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#080c14' }}>
      <div className="w-full max-w-sm fade-up">
        <div className="mb-8 text-center">
          <LogoGlyph />
          <div className="text-2xl text-slate-300 font-light tracking-wide mb-1 mt-6">Echoes of Growth</div>
          <div className="text-slate-600 text-sm">a letter from your past self</div>
        </div>

        <div className="rounded-2xl border p-6 space-y-4" style={{ background: '#0d1220', borderColor: '#1e2d40' }}>
          <div>
            <label className="block text-slate-400 text-xs mb-2 tracking-widest uppercase">
              Gemini API Key
            </label>
            <input
              type="password"
              value={apiKeyInput}
              onChange={(e) => setApiKeyInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSave()}
              placeholder="AIza..."
              className="w-full bg-[#080c14] border border-[#1e2d40] rounded-xl px-4 py-3 text-slate-300 text-sm placeholder-slate-700 focus:border-slate-500 transition-colors"
            />
            {error && (
              <p className="flex items-center gap-1.5 text-red-400 text-xs mt-2">
                <span>⚠</span> {error}
              </p>
            )}
          </div>

          <p className="text-slate-600 text-xs leading-relaxed">
            Your key is stored only in this browser and never sent to any server. Get a free key at{' '}
            <a
              href="https://aistudio.google.com/app/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-slate-400 underline"
            >
              Google AI Studio →
            </a>
          </p>

          <button
            onClick={onSave}
            className="w-full py-3 rounded-xl text-sm transition-all duration-200 text-slate-200 hover:bg-[#2a3f55]"
            style={{ background: '#1e2d40' }}
          >
            Begin
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── FormScreen ───────────────────────────────────────────────────────────────

const FIELDS: {
  key: keyof UserInputs
  tag: string
  label: string
  placeholder: string
  required: boolean
  accent: string
}[] = [
  {
    key: 'disappointment',
    tag: 'Express',
    label: 'What is disappointing you right now?',
    placeholder: 'No need to organize your thoughts — just let it out…',
    required: true,
    accent: '#4a7fa5',
  },
  {
    key: 'pastMemory',
    tag: 'Recall',
    label: 'Think of a moment from the past when you felt truly capable.',
    placeholder: 'A childhood memory, a person who believed in you, something you accomplished alone…',
    required: true,
    accent: '#3d6b8f',
  },
  {
    key: 'innerVoice',
    tag: 'Within',
    label: 'Is there something you have never said to anyone?',
    placeholder: 'Optional. Maybe something you only say to yourself, or something long buried…',
    required: false,
    accent: '#2e7d6e',
  },
]

function FormScreen({
  inputs,
  setInputs,
  error,
  onSubmit,
  onSettings,
}: {
  inputs: UserInputs
  setInputs: React.Dispatch<React.SetStateAction<UserInputs>>
  error: string
  onSubmit: () => void
  onSettings: () => void
}) {
  const textareaRefs = useRef<(HTMLTextAreaElement | null)[]>([])

  const handleChange = (key: keyof UserInputs, val: string, idx: number) => {
    setInputs((prev) => ({ ...prev, [key]: val }))
    const el = textareaRefs.current[idx]
    if (el) {
      el.style.height = 'auto'
      el.style.height = Math.min(el.scrollHeight, 200) + 'px'
    }
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080c14' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d40]">
        <div className="flex items-center gap-2">
          <span className="text-slate-500 text-xs tracking-widest uppercase">Echoes of Growth</span>
        </div>
        <button onClick={onSettings} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
          Settings
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-4 py-8 max-w-xl mx-auto w-full">
        <div className="text-center mb-10 fade-up">
          <h1 className="text-xl text-slate-200 font-light mb-2">Before we begin</h1>
          <p className="text-slate-500 text-sm">Three questions to help me understand you</p>
        </div>

        <div className="space-y-6">
          {FIELDS.map((field, i) => (
            <div key={field.key} className="fade-up" style={{ animationDelay: `${i * 80}ms` }}>
              <div className="flex items-center gap-2 mb-3">
                <span
                  className="text-xs px-2 py-0.5 rounded-full border"
                  style={{
                    color: field.accent,
                    borderColor: field.accent + '40',
                    background: field.accent + '10',
                  }}
                >
                  {field.tag}
                </span>
                {!field.required && (
                  <span className="text-slate-700 text-xs">optional</span>
                )}
              </div>

              <label className="block text-slate-300 text-sm font-light mb-2 leading-relaxed">
                {field.label}
              </label>

              <div
                className="rounded-2xl border transition-all duration-200"
                style={{
                  background: '#0d1220',
                  borderColor: inputs[field.key] ? field.accent + '40' : '#1e2d40',
                }}
              >
                <textarea
                  ref={(el) => { textareaRefs.current[i] = el }}
                  rows={3}
                  value={inputs[field.key]}
                  onChange={(e) => handleChange(field.key, e.target.value, i)}
                  placeholder={field.placeholder}
                  className="w-full bg-transparent text-slate-300 placeholder-slate-700 text-sm leading-relaxed px-4 py-3"
                  style={{ minHeight: '80px', maxHeight: '200px' }}
                />
              </div>
            </div>
          ))}
        </div>

        {/* Error */}
        {error && (
          <div
            className="mt-6 flex items-start gap-2 px-4 py-3 rounded-xl border text-sm fade-up"
            style={{ background: '#1a0f0f', borderColor: '#7f1d1d60', color: '#fca5a5' }}
          >
            <span className="mt-0.5 flex-shrink-0">⚠</span>
            <span>{error}</span>
          </div>
        )}

        {/* Submit */}
        <div className="mt-8 mb-4">
          <button
            onClick={onSubmit}
            className="group w-full py-3.5 rounded-2xl text-sm text-slate-200 transition-all duration-300 flex items-center justify-center gap-2"
            style={{ background: '#1e2d40', border: '1px solid #2a3f55' }}
          >
            <span>Generate my echo</span>
            <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
          </button>
          <p className="text-center text-slate-700 text-xs mt-3">AI will weave your three answers into a letter written just for you</p>
        </div>
      </div>
    </div>
  )
}

// ─── GeneratingScreen ─────────────────────────────────────────────────────────

function GeneratingScreen({
  error,
  onRetry,
  onBack,
}: {
  error: string
  onRetry: () => void
  onBack: () => void
}) {
  const [dots, setDots] = useState(0)

  useEffect(() => {
    if (error) return
    const t = setInterval(() => setDots((d) => (d + 1) % 4), 500)
    return () => clearInterval(t)
  }, [error])

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#080c14' }}>
        <div className="w-full max-w-sm fade-up text-center">
          <div
            className="w-12 h-12 rounded-full border flex items-center justify-center mx-auto mb-5"
            style={{ borderColor: '#7f1d1d60', background: '#1a0f0f' }}
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#f87171" strokeWidth="1.5">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
          </div>

          <h2 className="text-slate-300 text-lg font-light mb-2">Something went wrong</h2>
          <p className="text-slate-500 text-sm mb-6 leading-relaxed">{error}</p>

          <div className="flex flex-col gap-3">
            <button
              onClick={onRetry}
              className="w-full py-3 rounded-xl text-sm text-slate-200 transition-all"
              style={{ background: '#1e2d40' }}
            >
              Try again
            </button>
            <button
              onClick={onBack}
              className="w-full py-3 rounded-xl text-sm text-slate-500 hover:text-slate-400 transition-all"
            >
              Go back and edit
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-6" style={{ background: '#080c14' }}>
      <div className="text-center fade-up">
        <div className="flex justify-center mb-6">
          <GeneratingGlyph />
        </div>
        <p className="text-slate-400 text-sm">
          Listening, connecting{'.'.repeat(dots)}
        </p>
        <p className="text-slate-700 text-xs mt-2">Just a moment</p>
      </div>
    </div>
  )
}

// ─── ResultScreen ─────────────────────────────────────────────────────────────

function ResultScreen({
  result,
  onRestart,
  onSettings,
}: {
  result: string
  onRestart: () => void
  onSettings: () => void
}) {
  const paragraphs = result.split('\n').filter((p) => p.trim())

  return (
    <div className="min-h-screen flex flex-col" style={{ background: '#080c14' }}>
      {/* Header */}
      <header className="flex items-center justify-between px-6 py-4 border-b border-[#1e2d40]">
        <span className="text-slate-500 text-xs tracking-widest uppercase">Echoes of Growth</span>
        <button onClick={onSettings} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
          Settings
        </button>
      </header>

      {/* Result */}
      <div className="flex-1 overflow-y-auto px-4 py-10 max-w-xl mx-auto w-full">
        {/* Badge */}
        <div className="flex items-center gap-2 mb-8 fade-up">
          <div
            className="w-1 h-8 rounded-full"
            style={{ background: 'linear-gradient(to bottom, #4a7fa5, #2e7d6e)' }}
          />
          <div>
            <p className="text-slate-400 text-xs tracking-widest uppercase">Reframe</p>
            <p className="text-slate-600 text-xs">an AI perspective</p>
          </div>
        </div>

        {/* Letter */}
        <div className="space-y-4 fade-up">
          {paragraphs.map((para, i) => (
            <p
              key={i}
              className="text-slate-300 text-sm leading-8 font-light"
              style={{ animationDelay: `${i * 60}ms` }}
            >
              {para}
            </p>
          ))}
        </div>

        {/* Divider */}
        <div className="my-10 flex items-center gap-3">
          <div className="flex-1 h-px" style={{ background: '#1e2d40' }} />
          <div className="w-1 h-1 rounded-full" style={{ background: '#2a3f55' }} />
          <div className="flex-1 h-px" style={{ background: '#1e2d40' }} />
        </div>

        {/* Actions */}
        <div className="space-y-3 mb-8">
          <button
            onClick={onRestart}
            className="w-full py-3 rounded-xl text-sm text-slate-400 border border-[#1e2d40] hover:border-slate-600 hover:text-slate-300 transition-all"
            style={{ background: '#0d1220' }}
          >
            Start over
          </button>
        </div>

        <p className="text-center text-slate-700 text-xs">Carry this with you as you move forward</p>
      </div>
    </div>
  )
}

// ─── Decorative SVGs ─────────────────────────────────────────────────────────

function LogoGlyph() {
  return (
    <svg width="40" height="40" viewBox="0 0 48 48" fill="none" className="mx-auto">
      <circle cx="24" cy="24" r="20" stroke="#1e2d40" strokeWidth="1" />
      <circle cx="24" cy="24" r="12" stroke="#2a3f55" strokeWidth="1" />
      <circle cx="24" cy="24" r="4" fill="#4a7fa5" opacity="0.6" />
      <line x1="24" y1="4" x2="24" y2="44" stroke="#1e2d40" strokeWidth="0.5" strokeDasharray="2 4" />
      <line x1="4" y1="24" x2="44" y2="24" stroke="#1e2d40" strokeWidth="0.5" strokeDasharray="2 4" />
    </svg>
  )
}

function GeneratingGlyph() {
  return (
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none">
      <circle cx="28" cy="28" r="24" stroke="#1e2d40" strokeWidth="1">
        <animateTransform attributeName="transform" type="rotate" from="0 28 28" to="360 28 28" dur="12s" repeatCount="indefinite" />
      </circle>
      <circle cx="28" cy="28" r="14" stroke="#2a3f55" strokeWidth="1" strokeDasharray="4 4">
        <animateTransform attributeName="transform" type="rotate" from="360 28 28" to="0 28 28" dur="8s" repeatCount="indefinite" />
      </circle>
      <circle cx="28" cy="28" r="5" fill="#4a7fa5" opacity="0.5">
        <animate attributeName="opacity" values="0.3;0.8;0.3" dur="2s" repeatCount="indefinite" />
        <animate attributeName="r" values="4;6;4" dur="2s" repeatCount="indefinite" />
      </circle>
    </svg>
  )
}
