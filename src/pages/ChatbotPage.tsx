import { AxiosError } from 'axios'
import { useEffect, useMemo, useState } from 'react'
import { listSectors } from '../lib/whatsapp'
import { useAuthStore } from '../store/authStore'
import type { Sector } from '../types/whatsapp'

type MenuOption = {
  id: string
  title: string
  reply: string
}

const defaultSectors: Sector[] = [
  { id: 1, name: 'Comercial', slug: 'comercial' },
  { id: 2, name: 'Suporte', slug: 'suporte' },
  { id: 3, name: 'Financeiro', slug: 'financeiro' },
]

const createMenuOption = (title = '', reply = ''): MenuOption => ({
  id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
  title,
  reply,
})

const initialMenuOptions = [
  createMenuOption('Conhecer planos', 'Perfeito. Vou te mostrar os planos atuais e tirar suas duvidas.'),
  createMenuOption('Suporte tecnico', 'Certo. Vou coletar seu contexto antes de encaminhar para o suporte.'),
  createMenuOption('Falar com financeiro', 'Tudo bem. Vou direcionar sua solicitacao para o time financeiro.'),
]

const getErrorMessage = (error: unknown) => {
  if (error instanceof AxiosError) {
    const data = error.response?.data as { message?: string } | undefined
    return data?.message ?? 'Nao foi possivel carregar os setores.'
  }

  return error instanceof Error ? error.message : 'Nao foi possivel carregar os setores.'
}

const buildMenuMessage = (options: MenuOption[]) =>
  options
    .map((option, index) => `${index + 1}. ${option.title.trim() || `Opcao ${index + 1}`}`)
    .join('\n')

export function ChatbotPage() {
  const currentCompany = useAuthStore((state) => state.currentCompany)
  const [isBotEnabled, setIsBotEnabled] = useState(true)
  const [welcomeMessage, setWelcomeMessage] = useState(
    'Ola. Sou o assistente inicial da operacao e vou te ajudar a chegar no setor certo.',
  )
  const [menuOptions, setMenuOptions] = useState<MenuOption[]>(initialMenuOptions)
  const [keywords, setKeywords] = useState(['boleto', 'segunda via', 'orcamento', 'humano'])
  const [keywordInput, setKeywordInput] = useState('')
  const [isTransferEnabled, setIsTransferEnabled] = useState(true)
  const [isOutsideHoursEnabled, setIsOutsideHoursEnabled] = useState(true)
  const [outsideHoursMessage, setOutsideHoursMessage] = useState(
    'Estamos fora do horario de atendimento. Deixe sua mensagem que responderemos no proximo periodo util.',
  )
  const [sectors, setSectors] = useState<Sector[]>(defaultSectors)
  const [selectedSectorId, setSelectedSectorId] = useState(String(defaultSectors[1]?.id ?? 1))
  const [activePreviewId, setActivePreviewId] = useState(initialMenuOptions[0]?.id ?? '')
  const [sectorError, setSectorError] = useState<string | null>(null)

  useEffect(() => {
    if (!currentCompany?.id) {
      return
    }

    let isMounted = true

    const loadSectors = async () => {
      try {
        const loadedSectors = await listSectors()

        if (!isMounted || loadedSectors.length === 0) {
          return
        }

        setSectors(loadedSectors)
        setSelectedSectorId((currentSectorId) => {
          if (loadedSectors.some((sector) => String(sector.id) === currentSectorId)) {
            return currentSectorId
          }

          return String(loadedSectors[0].id)
        })
      } catch (error) {
        if (!isMounted) {
          return
        }

        setSectorError(getErrorMessage(error))
      }
    }

    void loadSectors()

    return () => {
      isMounted = false
    }
  }, [currentCompany?.id])

  const selectedSector =
    sectors.find((sector) => String(sector.id) === selectedSectorId) ?? sectors[0] ?? null

  const activePreviewOption =
    menuOptions.find((option) => option.id === activePreviewId) ?? menuOptions[0] ?? null

  const menuMessage = useMemo(() => buildMenuMessage(menuOptions), [menuOptions])

  const filledOptions = useMemo(
    () => menuOptions.filter((option) => option.title.trim() || option.reply.trim()),
    [menuOptions],
  )

  const completion = useMemo(() => {
    let score = 0

    if (isBotEnabled) {
      score += 25
    }

    if (welcomeMessage.trim()) {
      score += 20
    }

    if (filledOptions.length > 0) {
      score += 25
    }

    if (keywords.length > 0) {
      score += 15
    }

    if (isTransferEnabled && selectedSector) {
      score += 10
    }

    if (isOutsideHoursEnabled && outsideHoursMessage.trim()) {
      score += 5
    }

    return score
  }, [
    filledOptions.length,
    isBotEnabled,
    isOutsideHoursEnabled,
    isTransferEnabled,
    keywords.length,
    outsideHoursMessage,
    selectedSector,
    welcomeMessage,
  ])

  const handleMenuChange =
    (optionId: string, field: keyof Omit<MenuOption, 'id'>) =>
    (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      const nextValue = event.target.value

      setMenuOptions((currentOptions) =>
        currentOptions.map((option) =>
          option.id === optionId ? { ...option, [field]: nextValue } : option,
        ),
      )
    }

  const handleAddMenuOption = () => {
    const nextOption = createMenuOption()
    setMenuOptions((currentOptions) => [...currentOptions, nextOption])
    setActivePreviewId(nextOption.id)
  }

  const handleRemoveMenuOption = (optionId: string) => {
    setMenuOptions((currentOptions) =>
      currentOptions.filter((option) => option.id !== optionId),
    )
  }

  const handleAddKeywords = () => {
    const parsedKeywords = keywordInput
      .split(',')
      .map((keyword) => keyword.trim())
      .filter(Boolean)

    if (parsedKeywords.length === 0) {
      return
    }

    setKeywords((currentKeywords) => {
      const existingKeywords = new Set(
        currentKeywords.map((keyword) => keyword.toLowerCase()),
      )

      return [
        ...currentKeywords,
        ...parsedKeywords.filter((keyword) => !existingKeywords.has(keyword.toLowerCase())),
      ]
    })
    setKeywordInput('')
  }

  const handleKeywordKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== 'Enter') {
      return
    }

    event.preventDefault()
    handleAddKeywords()
  }

  const handleRemoveKeyword = (keywordToRemove: string) => {
    setKeywords((currentKeywords) =>
      currentKeywords.filter((keyword) => keyword !== keywordToRemove),
    )
  }

  const previewMenuLabel =
    activePreviewOption?.title.trim() ||
    (activePreviewOption
      ? `Opcao ${menuOptions.findIndex((option) => option.id === activePreviewOption.id) + 1}`
      : 'Opcao 1')

  return (
    <div className="space-y-5">
      <section className="grid gap-5 xl:grid-cols-[1.08fr_0.92fr]">
        <article className="overflow-hidden rounded-[1.9rem] border border-white/80 bg-[linear-gradient(135deg,#081f33_0%,#0d4f45_58%,#35c98b_170%)] p-6 text-white shadow-[0_24px_80px_rgba(15,23,42,0.16)]">
          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-100">
            Chatbot simples
          </p>
          <h2 className="mt-4 max-w-3xl text-3xl font-semibold leading-tight">
            Configure a entrada automatica do WhatsApp com menu numerico,
            palavras-chave e transferencia para o setor certo.
          </h2>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-cyan-50/88">
            A proposta desta tela e permitir uma automacao inicial objetiva:
            receber o contato, apresentar opcoes, detectar termos-chave e
            escalar para atendimento humano quando necessario.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <div className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-medium">
              Empresa: {currentCompany?.name ?? 'Workspace padrao'}
            </div>
            <div className="rounded-full border border-white/14 bg-white/8 px-4 py-2 text-sm font-medium">
              Setor de destino: {selectedSector?.name ?? 'Nao definido'}
            </div>
          </div>
        </article>

        <article className="rounded-[1.9rem] border border-slate-200 bg-white p-6 shadow-[0_20px_60px_rgba(15,23,42,0.08)]">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold text-slate-950">
                Resumo da configuracao
              </p>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                O preview muda em tempo real conforme o fluxo e ajustado.
              </p>
            </div>

            <div
              className={[
                'rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em]',
                isBotEnabled
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-slate-100 text-slate-500',
              ].join(' ')}
            >
              {isBotEnabled ? 'Ativo' : 'Inativo'}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {[
              {
                label: 'Prontidao',
                value: `${completion}%`,
                detail: 'Com base nos blocos preenchidos',
                tone: 'text-slate-950',
              },
              {
                label: 'Opcoes no menu',
                value: String(menuOptions.length),
                detail: 'Escolhas numericas disponiveis',
                tone: 'text-cyan-700',
              },
              {
                label: 'Palavras-chave',
                value: String(keywords.length),
                detail: 'Atalhos de identificacao rapida',
                tone: 'text-emerald-700',
              },
              {
                label: 'Encaminhamento',
                value: isTransferEnabled ? selectedSector?.name ?? 'Ativo' : 'Desligado',
                detail: 'Destino humano do fluxo',
                tone: 'text-slate-700',
              },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <p className="text-sm text-slate-500">{item.label}</p>
                <p className={`mt-3 text-2xl font-semibold ${item.tone}`}>{item.value}</p>
                <p className="mt-2 text-sm text-slate-500">{item.detail}</p>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="grid gap-5 xl:grid-cols-[1.02fr_0.98fr]">
        <div className="space-y-5">
          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  Controle do bot
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                  Ativacao e mensagem inicial
                </h3>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isBotEnabled}
                onClick={() => setIsBotEnabled((currentValue) => !currentValue)}
                className={[
                  'relative inline-flex h-11 w-20 items-center rounded-full px-1 transition',
                  isBotEnabled ? 'bg-emerald-500' : 'bg-slate-300',
                ].join(' ')}
              >
                <span
                  className={[
                    'inline-block h-9 w-9 rounded-full bg-white shadow-[0_10px_20px_rgba(15,23,42,0.18)] transition',
                    isBotEnabled ? 'translate-x-9' : 'translate-x-0',
                  ].join(' ')}
                />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <div className="rounded-[1.25rem] border border-slate-200 bg-slate-50 px-4 py-4">
                <p className="text-sm font-semibold text-slate-950">
                  Bot {isBotEnabled ? 'ligado' : 'desligado'}
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Quando desligado, a operacao pode seguir direto para atendimento
                  humano ou apenas exibir o fluxo em modo de configuracao.
                </p>
              </div>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Mensagem de boas-vindas
                </span>
                <textarea
                  rows={4}
                  value={welcomeMessage}
                  onChange={(event) => setWelcomeMessage(event.target.value)}
                  className="mt-2 w-full resize-none rounded-[1.2rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-300 focus:bg-white"
                  placeholder="Escreva a saudacao inicial do bot."
                />
              </label>
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  Menu numerico
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                  Estruture as opcoes do fluxo
                </h3>
              </div>

              <button
                type="button"
                onClick={handleAddMenuOption}
                className="rounded-[1rem] border border-cyan-200 bg-cyan-50 px-4 py-2 text-sm font-semibold text-cyan-800 transition hover:border-cyan-300 hover:bg-cyan-100"
              >
                Adicionar opcao
              </button>
            </div>

            <div className="mt-6 space-y-4">
              {menuOptions.map((option, index) => (
                <article
                  key={option.id}
                  className="rounded-[1.4rem] border border-slate-200 bg-[linear-gradient(180deg,#ffffff,#f7fbfb)] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <span className="grid h-11 w-11 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                        {index + 1}
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-950">
                          Opcao {index + 1}
                        </p>
                        <button
                          type="button"
                          onClick={() => setActivePreviewId(option.id)}
                          className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-cyan-700"
                        >
                          Usar no preview
                        </button>
                      </div>
                    </div>

                    {menuOptions.length > 1 ? (
                      <button
                        type="button"
                        onClick={() => handleRemoveMenuOption(option.id)}
                        className="rounded-[0.95rem] border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:border-rose-300 hover:bg-rose-100"
                      >
                        Remover
                      </button>
                    ) : null}
                  </div>

                  <div className="mt-4 grid gap-4">
                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Titulo da opcao
                      </span>
                      <input
                        value={option.title}
                        onChange={handleMenuChange(option.id, 'title')}
                        className="mt-2 w-full rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-300 focus:bg-white"
                        placeholder="Ex.: Quero falar com vendas"
                      />
                    </label>

                    <label className="block">
                      <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                        Resposta automatica
                      </span>
                      <textarea
                        rows={3}
                        value={option.reply}
                        onChange={handleMenuChange(option.id, 'reply')}
                        className="mt-2 w-full resize-none rounded-[1.1rem] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-300 focus:bg-white"
                        placeholder="Mensagem enviada quando o cliente escolhe esta opcao."
                      />
                    </label>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
              Regras complementares
            </p>
            <h3 className="mt-3 text-2xl font-semibold text-slate-950">
              Encaminhamento, palavras-chave e fora do horario
            </h3>

            <div className="mt-6 space-y-5">
              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Encaminhar para setor
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Defina se o bot pode transferir o atendimento para um time
                      humano apos a triagem inicial.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setIsTransferEnabled((currentValue) => !currentValue)}
                    className={[
                      'rounded-full px-4 py-2 text-sm font-semibold transition',
                      isTransferEnabled
                        ? 'bg-emerald-100 text-emerald-700'
                        : 'bg-slate-200 text-slate-600',
                    ].join(' ')}
                  >
                    {isTransferEnabled ? 'Ativado' : 'Desativado'}
                  </button>
                </div>

                <label className="mt-4 block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Setor de destino
                  </span>
                  <select
                    value={selectedSectorId}
                    onChange={(event) => setSelectedSectorId(event.target.value)}
                    disabled={!isTransferEnabled}
                    className="mt-2 w-full rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-100"
                  >
                    {sectors.map((sector) => (
                      <option key={sector.id} value={sector.id}>
                        {sector.name}
                      </option>
                    ))}
                  </select>
                </label>

                {sectorError ? (
                  <p className="mt-3 text-sm text-amber-700">{sectorError}</p>
                ) : null}
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <p className="text-sm font-semibold text-slate-950">Palavras-chave</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  Use termos para acelerar o roteamento, mesmo quando o cliente nao
                  escolhe um numero do menu.
                </p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={keywordInput}
                    onChange={(event) => setKeywordInput(event.target.value)}
                    onKeyDown={handleKeywordKeyDown}
                    className="min-w-0 flex-1 rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-300"
                    placeholder="Digite palavras separadas por virgula"
                  />
                  <button
                    type="button"
                    onClick={handleAddKeywords}
                    className="rounded-[1rem] bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                  >
                    Adicionar
                  </button>
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {keywords.map((keyword) => (
                    <button
                      key={keyword}
                      type="button"
                      onClick={() => handleRemoveKeyword(keyword)}
                      className="rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-800 transition hover:border-emerald-300 hover:bg-emerald-100"
                    >
                      {keyword} x
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-950">
                      Mensagem fora do horario
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      Defina uma resposta especifica para momentos em que nao houver
                      atendimento humano disponivel.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() =>
                      setIsOutsideHoursEnabled((currentValue) => !currentValue)
                    }
                    className={[
                      'rounded-full px-4 py-2 text-sm font-semibold transition',
                      isOutsideHoursEnabled
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-slate-200 text-slate-600',
                    ].join(' ')}
                  >
                    {isOutsideHoursEnabled ? 'Ativada' : 'Desativada'}
                  </button>
                </div>

                <label className="mt-4 block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                    Resposta automatica
                  </span>
                  <textarea
                    rows={3}
                    value={outsideHoursMessage}
                    onChange={(event) => setOutsideHoursMessage(event.target.value)}
                    disabled={!isOutsideHoursEnabled}
                    className="mt-2 w-full resize-none rounded-[1.1rem] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-950 outline-none transition focus:border-cyan-300 disabled:cursor-not-allowed disabled:bg-slate-100"
                    placeholder="Mensagem para atendimento fora do expediente."
                  />
                </label>
              </div>
            </div>
          </section>
        </div>

        <div className="space-y-5">
          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-cyan-700">
                  Preview do fluxo
                </p>
                <h3 className="mt-3 text-2xl font-semibold text-slate-950">
                  Simulacao da conversa
                </h3>
              </div>

              <div className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600">
                Fluxo simples
              </div>
            </div>

            <div className="mt-6 rounded-[2rem] bg-[linear-gradient(180deg,#0f172a_0%,#111827_100%)] p-4">
              <div className="mx-auto max-w-[380px] rounded-[2rem] border border-white/10 bg-[#efeae2] p-4 shadow-[0_24px_70px_rgba(15,23,42,0.32)]">
                <div className="flex items-center justify-between rounded-[1.3rem] bg-[#075e54] px-4 py-3 text-white">
                  <div>
                    <p className="text-sm font-semibold">Fluxo inicial</p>
                    <p className="text-xs text-emerald-100">
                      {isBotEnabled ? 'Bot online' : 'Bot offline'}
                    </p>
                  </div>
                  <div className="rounded-full bg-white/12 px-3 py-1 text-xs font-semibold uppercase tracking-[0.16em]">
                    WA
                  </div>
                </div>

                <div className="mt-4 space-y-3">
                  <div className="max-w-[86%] rounded-[1.25rem] rounded-tl-sm bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                    {isBotEnabled
                      ? welcomeMessage.trim() || 'Adicione uma mensagem de boas-vindas.'
                      : 'Bot desativado. O contato segue para atendimento manual.'}
                  </div>

                  {isBotEnabled ? (
                    <div className="max-w-[88%] rounded-[1.25rem] rounded-tl-sm bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)] whitespace-pre-line">
                      {menuMessage || 'Adicione opcoes ao menu numerico.'}
                    </div>
                  ) : null}

                  {activePreviewOption && isBotEnabled ? (
                    <>
                      <div className="ml-auto max-w-[72%] rounded-[1.25rem] rounded-tr-sm bg-[#d9fdd3] px-4 py-3 text-sm font-medium text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.06)]">
                        {menuOptions.findIndex((option) => option.id === activePreviewOption.id) + 1}
                        . {previewMenuLabel}
                      </div>

                      <div className="max-w-[86%] rounded-[1.25rem] rounded-tl-sm bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-[0_10px_30px_rgba(15,23,42,0.08)]">
                        {activePreviewOption.reply.trim() ||
                          'Defina a resposta automatica desta opcao.'}
                      </div>
                    </>
                  ) : null}

                  {isTransferEnabled && selectedSector ? (
                    <div className="rounded-[1.2rem] border border-dashed border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
                      Encaminhar para setor: <strong>{selectedSector.name}</strong>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              {menuOptions.map((option, index) => (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => setActivePreviewId(option.id)}
                  className={[
                    'rounded-full border px-3 py-2 text-sm font-medium transition',
                    option.id === activePreviewOption?.id
                      ? 'border-cyan-300 bg-cyan-50 text-cyan-800'
                      : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300',
                  ].join(' ')}
                >
                  {index + 1}. {option.title.trim() || `Opcao ${index + 1}`}
                </button>
              ))}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-slate-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold text-slate-950">Mapa do fluxo</p>
            <div className="mt-5 space-y-3">
              {[
                {
                  step: '01',
                  title: 'Entrada do contato',
                  description: isBotEnabled
                    ? 'O bot responde com a mensagem de boas-vindas.'
                    : 'A automacao esta desligada e o atendimento pode seguir manualmente.',
                },
                {
                  step: '02',
                  title: 'Menu numerico',
                  description:
                    filledOptions.length > 0
                      ? `${filledOptions.length} opcao(oes) configurada(s) para triagem inicial.`
                      : 'Nenhuma opcao preenchida no momento.',
                },
                {
                  step: '03',
                  title: 'Palavras-chave',
                  description:
                    keywords.length > 0
                      ? `Termos monitorados: ${keywords.join(', ')}.`
                      : 'Nenhuma palavra-chave cadastrada.',
                },
                {
                  step: '04',
                  title: 'Encaminhamento',
                  description:
                    isTransferEnabled && selectedSector
                      ? `Transferencia prevista para ${selectedSector.name}.`
                      : 'Sem transferencia automatica para setor.',
                },
                {
                  step: '05',
                  title: 'Fora do horario',
                  description: isOutsideHoursEnabled
                    ? outsideHoursMessage.trim() || 'Defina a mensagem de contingencia.'
                    : 'Resposta fora do horario desativada.',
                },
              ].map((item) => (
                <article
                  key={item.step}
                  className="rounded-[1.35rem] border border-slate-200 bg-slate-50 px-4 py-4"
                >
                  <div className="flex items-start gap-4">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-slate-950 text-sm font-semibold text-white">
                      {item.step}
                    </span>
                    <div>
                      <p className="font-semibold text-slate-950">{item.title}</p>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </section>

          <section className="rounded-[1.8rem] border border-slate-200 bg-[linear-gradient(135deg,#ffffff,#f2fbf9)] p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
            <p className="text-sm font-semibold text-slate-950">Radar rapido</p>
            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[1.25rem] border border-emerald-100 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Boas-vindas
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {welcomeMessage.trim() || 'Nao configurada.'}
                </p>
              </div>

              <div className="rounded-[1.25rem] border border-emerald-100 bg-white px-4 py-4">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
                  Fora do horario
                </p>
                <p className="mt-2 text-sm leading-6 text-slate-700">
                  {isOutsideHoursEnabled
                    ? outsideHoursMessage.trim() || 'Nao configurada.'
                    : 'Mensagem desativada.'}
                </p>
              </div>
            </div>
          </section>
        </div>
      </section>
    </div>
  )
}
