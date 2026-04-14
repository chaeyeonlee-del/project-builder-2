import { AnimatePresence, motion } from "framer-motion"
import { CornerDownLeft, Sparkles, X } from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { cn } from "./lib/utils"

const starterMessages = [
  {
    role: "assistant",
    text: "내 이름부터 정해줄래?",
  },
]

const abilityMessages = [
  "모르는 걸 짧게 풀어줄 수 있어.",
  "긴 글이나 문제는 핵심만 접어서 보여줄게.",
  "그냥 말 걸어도 받아줄게.",
]

function App() {
  const [mode, setMode] = useState("onboarding")
  const [step, setStep] = useState("characterName")
  const [characterName, setCharacterName] = useState("")
  const [userName, setUserName] = useState("")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState(starterMessages)
  const [isThinking, setIsThinking] = useState(false)
  const stackRef = useRef(null)

  useEffect(() => {
    stackRef.current?.scrollTo({
      top: stackRef.current.scrollHeight,
      behavior: "smooth",
    })
  }, [messages, isThinking])

  useEffect(() => {
    function handleShortcut(event) {
      if (event.metaKey && event.shiftKey && event.key.toLowerCase() === "t") {
        event.preventDefault()
        openChat()
      }
    }

    window.addEventListener("keydown", handleShortcut)
    return () => window.removeEventListener("keydown", handleShortcut)
  }, [])

  function openChat() {
    setMode("chat")
    setMessages((current) =>
      current.length
        ? current
        : [{ role: "assistant", text: `${characterName || "나"} 여기 있어. 뭐든 말해줘.` }],
    )
  }

  function closeStack() {
    if (mode === "chat") {
      setMessages([{ role: "assistant", text: `${characterName || "나"} 필요하면 Command + Shift + T로 다시 불러줘.` }])
    }
    setMode("parked")
  }

  function submit() {
    const value = input.trim()
    if (!value || isThinking) return

    setInput("")

    if (mode === "parked") {
      setMode("chat")
    }

    if (mode === "onboarding" && step === "characterName") {
      setCharacterName(value)
      setMessages((current) => [
        ...current,
        { role: "user", text: value },
        { role: "assistant", text: `좋아. 나는 이제 ${value}. 너는 뭐라고 부르면 돼?` },
      ])
      setStep("userName")
      return
    }

    if (mode === "onboarding" && step === "userName") {
      setUserName(value)
      setMessages((current) => [...current, { role: "user", text: value }])
      setIsThinking(true)
      window.setTimeout(() => {
        setMessages((current) => [
          ...current,
          { role: "assistant", text: `${value}, 반가워. 내가 할 수 있는 걸 보여줄게.` },
          ...abilityMessages.map((text) => ({ role: "assistant", text })),
          { role: "assistant", text: "이제 조용히 옆에 있을게. 필요하면 Command + Shift + T를 눌러줘." },
        ])
        setMode("parked")
        setStep("done")
        setIsThinking(false)
      }, 640)
      return
    }

    setMessages((current) => [...current, { role: "user", text: value }])
    setIsThinking(true)
    window.setTimeout(() => {
      setMessages((current) => [
        ...current,
        {
          role: "assistant",
          text: getReply(value, characterName, userName),
        },
      ])
      setIsThinking(false)
    }, 680)
  }

  return (
    <main className="min-h-screen overflow-hidden bg-transparent text-foreground">
      <section className="relative min-h-screen">
        <DesktopMock />

        <div className="absolute bottom-8 right-8 h-[560px] w-[min(396px,calc(100vw-32px))]">
          <AnimatePresence>
            {mode !== "parked" && (
              <BubbleStack
                refEl={stackRef}
                messages={messages}
                isThinking={isThinking}
                input={input}
                setInput={setInput}
                submit={submit}
                close={closeStack}
                placeholder={getPlaceholder(mode, step)}
              />
            )}
          </AnimatePresence>

          {mode === "parked" && (
            <ParkedHint characterName={characterName} openChat={openChat} />
          )}

          <Character isThinking={isThinking} onClick={openChat} />
        </div>
      </section>
    </main>
  )
}

function getReply(input, characterName, userName) {
  if (input.includes("심심") || input.includes("안녕")) {
    return `${userName || "너"}가 부르면 ${characterName || "나"}는 바로 와. 질문 아니어도 괜찮아.`
  }

  if (input.includes("길게") || input.length > 20) {
    return "길게 말할 수 있지만 먼저 짧게 접어줄게. 지금 말한 건 원인, 해야 할 일, 확인할 기준으로 나눠보면 쉬워."
  }

  return "좋아. 그건 먼저 한 문장으로 정리하면 훨씬 편해져. 내가 짧게 같이 잡아줄게."
}

function getPlaceholder(mode, step) {
  if (mode === "onboarding" && step === "characterName") return "캐릭터 이름"
  if (mode === "onboarding" && step === "userName") return "내 이름"
  return "말 걸기"
}

function DesktopMock() {
  return (
    <div className="absolute inset-0">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(15,23,42,0.045)_1px,transparent_1px),linear-gradient(to_bottom,rgba(15,23,42,0.045)_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="absolute left-8 top-8 h-9 w-32 rounded-lg border border-border bg-white/65 shadow-hairline backdrop-blur-xl" />
      <div className="absolute right-8 top-8 hidden h-9 w-48 rounded-lg border border-border bg-white/65 shadow-hairline backdrop-blur-xl sm:block" />
      <div className="absolute bottom-6 left-1/2 hidden h-14 w-[520px] -translate-x-1/2 rounded-lg border border-border bg-white/70 shadow-float backdrop-blur-xl md:block" />
    </div>
  )
}

function BubbleStack({ refEl, messages, isThinking, input, setInput, submit, close, placeholder }) {
  function handleKeyDown(event) {
    if (event.key === "Enter" && !event.nativeEvent.isComposing) {
      event.preventDefault()
      submit()
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 24, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 18, scale: 0.92 }}
      transition={{ type: "spring", stiffness: 380, damping: 28 }}
      className="absolute bottom-[128px] right-0 z-10 flex max-h-[420px] w-full flex-col items-end rounded-lg border border-white/45 bg-white/28 p-2 shadow-float backdrop-blur-xl"
    >
      <button
        className="mb-2 mr-1 rounded-md bg-white/45 p-1.5 text-muted-foreground backdrop-blur-xl transition-colors hover:bg-white/65 hover:text-foreground"
        onClick={close}
        aria-label="닫기"
      >
        <X className="h-4 w-4" />
      </button>

      <div ref={refEl} className="flex max-h-[340px] w-full flex-col gap-2 overflow-y-auto px-1 pb-2">
        <AnimatePresence initial={false}>
          {messages.map((message, index) => (
            <FloatingBubble key={`${message.role}-${index}-${message.text}`} message={message} />
          ))}
          {isThinking && <ThinkingBubble key="thinking" />}
        </AnimatePresence>
      </div>

      <motion.div
        layout
        className="relative mr-5 flex h-10 w-[min(336px,calc(100%-24px))] items-center gap-2 rounded-lg border border-white/55 bg-white/45 px-3 shadow-float backdrop-blur-2xl"
      >
        <input
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          placeholder={placeholder}
          autoFocus
        />
        <button
          className="rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-white/50 hover:text-foreground disabled:opacity-50"
          onClick={submit}
          disabled={isThinking}
          aria-label="보내기"
        >
          <CornerDownLeft className="h-4 w-4" />
        </button>
        <div className="absolute -bottom-2 right-9 h-4 w-4 rotate-45 border-b border-r border-white/55 bg-white/45 backdrop-blur-2xl" />
      </motion.div>
    </motion.div>
  )
}

function FloatingBubble({ message }) {
  const isUser = message.role === "user"

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 360, damping: 30 }}
      className={cn("flex", isUser ? "justify-end" : "justify-start")}
    >
      <div
        className={cn(
          "max-w-[86%] rounded-lg px-3 py-2 text-sm leading-6 shadow-hairline backdrop-blur-2xl",
          isUser
            ? "bg-primary/88 text-primary-foreground"
            : "border border-white/70 bg-white/70 text-foreground",
        )}
      >
        {message.text}
      </div>
    </motion.div>
  )
}

function ThinkingBubble() {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 8, scale: 0.94 }}
      className="flex justify-start"
    >
      <div className="flex items-center gap-2 rounded-lg border border-white/70 bg-white/70 px-3 py-2 shadow-hairline backdrop-blur-2xl">
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.2s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground [animation-delay:-0.1s]" />
        <span className="h-1.5 w-1.5 animate-bounce rounded-full bg-muted-foreground" />
      </div>
    </motion.div>
  )
}

function ParkedHint({ characterName, openChat }) {
  return (
    <motion.button
      initial={{ opacity: 0, y: 14, scale: 0.9 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.94 }}
      transition={{ type: "spring", stiffness: 360, damping: 28 }}
      className="absolute bottom-[140px] right-8 z-10 rounded-lg border border-white/55 bg-white/35 px-3 py-2 text-xs text-muted-foreground shadow-hairline backdrop-blur-2xl"
      onClick={openChat}
    >
      {characterName || "도우미"} 부르기: Command + Shift + T
    </motion.button>
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
