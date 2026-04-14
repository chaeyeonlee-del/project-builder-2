import { AnimatePresence, motion } from "framer-motion"
import { CornerDownLeft, Sparkles, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "./lib/utils"

const abilities = [
  "궁금한 걸 짧게 정리해주기",
  "긴 글이나 문제를 핵심만 요약하기",
  "막혔을 때 다음 행동을 같이 고르기",
]

function App() {
  const [isOpen, setIsOpen] = useState(true)
  const [step, setStep] = useState("askCharacterName")
  const [characterName, setCharacterName] = useState("")
  const [userName, setUserName] = useState("")
  const [question, setQuestion] = useState("")
  const [messages, setMessages] = useState([])
  const [isThinking, setIsThinking] = useState(false)
  const monologueTimer = useRef(null)

  const isReady = step === "ready" || step === "chat"

  useEffect(() => {
    function handleShortcut(event) {
      if (event.metaKey && event.shiftKey && event.key.toLowerCase() === "t" && isReady) {
        event.preventDefault()
        openChat()
      }
    }

    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [isReady])

  function submitCharacterName() {
    const trimmed = characterName.trim()
    if (!trimmed) return
    setCharacterName(trimmed)
    setStep("askUserName")
  }

  function submitUserName() {
    const trimmed = userName.trim()
    if (!trimmed || isThinking) return

    setIsThinking(true)
    window.setTimeout(() => {
      setUserName(trimmed)
      setStep("abilities")
      setIsThinking(false)
    }, 520)
  }

  function finishOnboarding() {
    setStep("ready")
    setIsOpen(false)
  }

  function showProactiveNudge() {
    window.clearTimeout(monologueTimer.current)
    setStep("nudge")
    setQuestion("")
    setMessages([])
    setIsThinking(false)
    setIsOpen(true)
  }

  function showMonologue() {
    window.clearTimeout(monologueTimer.current)
    setStep("monologue")
    setQuestion("")
    setMessages([])
    setIsThinking(false)
    setIsOpen(true)

    monologueTimer.current = window.setTimeout(() => {
      setIsOpen(false)
      setStep("ready")
    }, 3200)
  }

  function openChat() {
    setStep("chat")
    setIsOpen(true)
  }

  function closeBubble() {
    setIsOpen(false)
    if (step === "chat" || step === "nudge") setStep("ready")
  }

  function askQuestion() {
    const trimmed = question.trim()
    if (!trimmed || isThinking) return

    setMessages((current) => [...current, { role: "user", text: trimmed }])
    setQuestion("")
    setIsThinking(true)

    window.setTimeout(() => {
      setMessages((current) => [...current, { role: "assistant", text: getAnswer(trimmed, characterName) }])
      setIsThinking(false)
    }, 640)
  }

  function replyToNudge() {
    const trimmed = question.trim()
    if (!trimmed || isThinking) return

    setMessages([
      { role: "assistant", text: "나 여기 있어. 말 걸고 싶으면 편하게 불러줘." },
      { role: "user", text: trimmed },
    ])
    setQuestion("")
    setStep("chat")
    setIsThinking(true)

    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        { role: "assistant", text: getAnswer(trimmed, characterName) },
      ])
      setIsThinking(false)
    }, 640)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-background text-foreground">
      <section className="relative min-h-screen">
        <DesktopMock />
        {step !== "askCharacterName" && step !== "askUserName" && (
          <div className="absolute bottom-8 left-8 z-50 flex gap-2">
            <button
              className="rounded-lg border border-border bg-white/85 px-3 py-2 text-xs font-medium text-muted-foreground shadow-hairline backdrop-blur-xl transition-colors hover:bg-white hover:text-foreground"
              onClick={showMonologue}
            >
              임시: 혼잣말
            </button>
            <button
              className="rounded-lg border border-border bg-white/85 px-3 py-2 text-xs font-medium text-muted-foreground shadow-hairline backdrop-blur-xl transition-colors hover:bg-white hover:text-foreground"
              onClick={showProactiveNudge}
            >
              임시: 먼저 말걸기
            </button>
          </div>
        )}

        <div className="absolute bottom-8 right-8 h-[432px] w-[min(392px,calc(100vw-32px))]">
          <AnimatePresence mode="popLayout">
            {isOpen && (
              <CompanionBubble
                step={step}
                characterName={characterName}
                setCharacterName={setCharacterName}
                userName={userName}
                setUserName={setUserName}
                question={question}
                setQuestion={setQuestion}
                messages={messages}
                isThinking={isThinking}
                submitCharacterName={submitCharacterName}
                submitUserName={submitUserName}
                finishOnboarding={finishOnboarding}
                openChat={openChat}
                askQuestion={askQuestion}
                replyToNudge={replyToNudge}
                close={closeBubble}
              />
            )}
          </AnimatePresence>

          <Character
            isThinking={isThinking}
            onClick={() => {
              if (isReady) openChat()
              else if (step === "nudge") showProactiveNudge()
              else setIsOpen(true)
            }}
          />
        </div>
      </section>
    </main>
  )
}

function getAnswer(question, characterName) {
  if (question.includes("길게") || question.length > 18) {
    return `${characterName}가 먼저 핵심만 잡아줄게. 지금 말한 걸 보면 중요한 건 원인, 지금 할 일, 확인할 기준이야. 하나씩 나누면 덜 복잡해져.`
  }

  if (question.includes("안녕") || question.includes("심심")) {
    return `응, 여기 있어. 잠깐 쉬어가도 되고, 그냥 ${characterName}한테 말 걸어도 돼.`
  }

  return "좋아. 짧게 보면, 지금 막힌 부분을 한 문장으로 다시 말해보면 훨씬 쉬워져. 내가 같이 정리해줄게."
}

function DesktopMock() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.05)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.05)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute left-8 top-8 h-9 w-32 rounded-lg border border-border bg-white/75 shadow-hairline backdrop-blur-xl" />
      <div className="absolute right-8 top-8 hidden h-9 w-48 rounded-lg border border-border bg-white/75 shadow-hairline backdrop-blur-xl sm:block" />
      <div className="absolute bottom-6 left-1/2 hidden h-14 w-[520px] -translate-x-1/2 rounded-lg border border-border bg-white/80 shadow-float backdrop-blur-xl md:block" />
    </div>
  )
}

function CompanionBubble({
  step,
  characterName,
  setCharacterName,
  userName,
  setUserName,
  question,
  setQuestion,
  messages,
  isThinking,
  submitCharacterName,
  submitUserName,
  finishOnboarding,
  openChat,
  askQuestion,
  replyToNudge,
  close,
}) {
  const title = {
    askCharacterName: "이름을 지어줘",
    askUserName: `${characterName}라고 부르면 돼?`,
    abilities: `${userName}, 반가워`,
    monologue: null,
    nudge: null,
    chat: null,
  }[step]

  return (
    <motion.div
      initial={{ opacity: 0, y: 18, scale: 0.78 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 14, scale: 0.86 }}
      transition={{ type: "spring", stiffness: 420, damping: 24, mass: 0.8 }}
      style={{ transformOrigin: "84% 100%" }}
      className="absolute bottom-[132px] right-0 z-10 w-[min(352px,calc(100vw-32px))] rounded-lg border border-white/70 bg-white/90 p-3 shadow-float backdrop-blur-2xl"
    >
      <div className="absolute -bottom-2 right-14 h-4 w-4 rotate-45 border-b border-r border-white/70 bg-white/90 backdrop-blur-2xl" />

      {title && (
        <div className="mb-3 flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-primary" />
            {title}
          </div>
          <button className="rounded-md p-1.5 text-muted-foreground hover:bg-secondary" onClick={close}>
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {!title && (
        <button
          className="absolute right-2 top-2 rounded-md p-1.5 text-muted-foreground hover:bg-secondary"
          onClick={close}
          aria-label="닫기"
        >
          <X className="h-4 w-4" />
        </button>
      )}

      <AnimatePresence mode="popLayout">
        {step === "askCharacterName" && (
          <NameInputStep
            key="character-name"
            body="먼저 내 이름을 정해줘. 앞으로 그 이름으로 네 옆에 있을게."
            value={characterName}
            setValue={setCharacterName}
            placeholder="캐릭터 이름"
            submit={submitCharacterName}
          />
        )}
        {step === "askUserName" && (
          <NameInputStep
            key="user-name"
            body={`좋아. 나는 ${characterName}. 너는 뭐라고 부르면 돼?`}
            value={userName}
            setValue={setUserName}
            placeholder="내 이름"
            submit={submitUserName}
            isThinking={isThinking}
          />
        )}
        {step === "abilities" && (
          <AbilitiesStep
            key="abilities"
            characterName={characterName}
            userName={userName}
            finishOnboarding={finishOnboarding}
          />
        )}
        {step === "monologue" && <MonologueStep key="monologue" />}
        {step === "nudge" && (
          <NudgeStep
            key="nudge"
            question={question}
            setQuestion={setQuestion}
            replyToNudge={replyToNudge}
          />
        )}
        {step === "chat" && (
          <ChatStep
            key="chat"
            question={question}
            setQuestion={setQuestion}
            messages={messages}
            isThinking={isThinking}
            askQuestion={askQuestion}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function NameInputStep({ body, value, setValue, placeholder, submit, isThinking = false }) {
  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <StepShell>
      <p className="text-sm leading-6 text-muted-foreground">{body}</p>
      <div className="mt-3 flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3">
        <input
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder={placeholder}
          autoFocus
        />
        <button
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
          onClick={submit}
          disabled={isThinking}
          aria-label="입력 보내기"
        >
          <CornerDownLeft className="h-4 w-4" />
        </button>
      </div>
      {isThinking && <TypingLine label="기억하는 중" />}
    </StepShell>
  )
}

function AbilitiesStep({ characterName, userName, finishOnboarding }) {
  return (
    <StepShell>
      <p className="text-sm leading-6 text-muted-foreground">
        좋아, {userName}. 나는 {characterName}. 바탕화면 한쪽에 있다가 네가 부르면 바로 도와줄게.
      </p>
      <div className="mt-3 space-y-2">
        {abilities.map((ability) => (
          <div key={ability} className="rounded-lg bg-secondary px-3 py-2 text-sm leading-6 text-secondary-foreground">
            {ability}
          </div>
        ))}
      </div>
      <div className="mt-3 rounded-lg border border-border bg-background px-3 py-2 text-xs leading-5 text-muted-foreground">
        필요할 때 <span className="font-semibold text-foreground">Command + Shift + T</span>를 누르면 말 걸 수 있어.
      </div>
      <button
        className="mt-3 h-9 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
        onClick={finishOnboarding}
      >
        시작하기
      </button>
    </StepShell>
  )
}

function MonologueStep() {
  return (
    <StepShell>
      <p className="text-sm leading-6 text-muted-foreground">
        오늘은 조금 천천히 가도 괜찮아. 막히면 불러줘.
      </p>
    </StepShell>
  )
}

function NudgeStep({ question, setQuestion, replyToNudge }) {
  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault()
      replyToNudge()
    }
  }

  return (
    <StepShell>
      <p className="pr-8 text-sm leading-6 text-muted-foreground">
        나 여기 있어. 말 걸고 싶으면 편하게 불러줘.
      </p>
      <div className="mt-3 flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="말 걸기"
          autoFocus
        />
        <button
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          onClick={replyToNudge}
          aria-label="답장 보내기"
        >
          <CornerDownLeft className="h-4 w-4" />
        </button>
      </div>
    </StepShell>
  )
}

function ChatStep({ question, setQuestion, messages, isThinking, askQuestion }) {
  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault()
      askQuestion()
    }
  }

  return (
    <StepShell>
      <AnimatePresence initial={false}>
        {(messages.length > 0 || isThinking) && (
          <motion.div
            initial={{ opacity: 0, y: 8, height: 0 }}
            animate={{ opacity: 1, y: 0, height: "auto" }}
            exit={{ opacity: 0, y: 8, height: 0 }}
            transition={{ type: "spring", stiffness: 320, damping: 28 }}
            className="mb-2 max-h-64 overflow-y-auto"
          >
            <div className="space-y-2 pr-1">
              {messages.slice(-5).map((message, index) => (
                <motion.div
                  key={`${message.role}-${index}-${message.text}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 360, damping: 30 }}
                  className={message.role === "user" ? "flex justify-end" : "flex justify-start"}
                >
                  <div
                    className={cn(
                      "rounded-lg px-3 py-2 text-sm leading-6",
                      message.role === "user"
                        ? "max-w-[82%] bg-primary text-primary-foreground"
                        : "max-w-[90%] bg-secondary text-secondary-foreground",
                    )}
                  >
                    {message.text}
                  </div>
                </motion.div>
              ))}
              {isThinking && <TypingLine />}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {messages.length === 0 && (
        <p className="mb-2 pr-8 text-sm leading-6 text-muted-foreground">
          그냥 말을 걸어도 좋아. 짧게 받아줄게.
        </p>
      )}

      <div className="flex h-10 items-center gap-2 rounded-lg border border-input bg-background px-3">
        <input
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder="말 걸기"
          autoFocus
        />
        <button
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
          onClick={askQuestion}
          disabled={isThinking}
          aria-label="질문 보내기"
        >
          <CornerDownLeft className="h-4 w-4" />
        </button>
      </div>
    </StepShell>
  )
}

function StepShell({ children }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, height: 0 }}
      animate={{ opacity: 1, y: 0, height: "auto" }}
      exit={{ opacity: 0, y: -8, height: 0 }}
      transition={{ type: "spring", stiffness: 320, damping: 28 }}
      className="overflow-hidden"
    >
      {children}
    </motion.div>
  )
}

function TypingLine({ label }) {
  return (
    <div className="mt-2 flex items-center gap-2 rounded-lg bg-secondary px-3 py-2 text-sm text-secondary-foreground">
      {label && <span className="text-xs text-muted-foreground">{label}</span>}
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
      <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
    </div>
  )
}

function Character({ isThinking, onClick }) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      className="absolute bottom-0 right-0 z-20 h-32 w-32 rounded-lg outline-none"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
      animate={isThinking ? { y: [0, -6, 0] } : { y: [0, -3, 0] }}
      transition={{ duration: isThinking ? 1.1 : 3.2, repeat: Infinity, ease: "easeInOut" }}
      aria-label="도우미 열기"
    >
      <img src="/character.png" alt="도우미 캐릭터" className="h-full w-full object-contain drop-shadow-2xl" />
    </motion.button>
  )
}

export default App
