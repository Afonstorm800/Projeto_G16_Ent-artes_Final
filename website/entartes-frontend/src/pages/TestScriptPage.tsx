import { useState } from "react";

interface Task { id: string; text: string }

const intro = `O Ent'Artes é uma plataforma online destinada a uma escola de artes performativas que oferece formação em vários estilos (ballet, jazz, dança contemporânea, hip hop, sapateado, entre outros). Permite gerir as aulas regulares, marcar coachings adicionais com professores, validar sessões realizadas, manter um marketplace comunitário de figurinos e acessórios, e produzir o relatório mensal para a contabilidade externa.

Cada conta de utilizador corresponde a um de três perfis: Direção, Professor ou Encarregado de Educação. Cada perfil vê apenas o que lhe diz respeito.

Nas tarefas abaixo é pedido para realizar um conjunto de ações na plataforma. As instruções não indicam onde clicar nem como navegar — o objetivo é avaliar se a aplicação é intuitiva. Não é necessário pedir ajuda; basta tentar.`;

const guides: Record<string, { label: string; tasks: Task[] }> = {
  ee: {
    label: "Guião A — Encarregado de Educação",
    tasks: [
      { id: "a1", text: "Entrar na plataforma com a conta de Encarregado e identificar o que está agendado para a semana atual." },
      { id: "a2", text: "Consultar as notificações recentes da escola." },
      { id: "a3", text: "Pedir um novo coaching para um educando, escolhendo professor, dia, hora e descrevendo o objetivo." },
      { id: "a4", text: "Verificar o estado de um pedido feito anteriormente." },
      { id: "a5", text: "Confirmar a realização de uma sessão dentro do prazo de 48 horas." },
      { id: "a6", text: "Adicionar um item ao marketplace, associá-lo a uma lista (ou criar uma nova) e anexar uma fotografia." },
      { id: "a7", text: "Pedir o aluguer de um item disponível no marketplace." },
      { id: "a8", text: "Consultar o horário regular dos educandos." },
    ],
  },
  prof: {
    label: "Guião B — Professor",
    tasks: [
      { id: "b1", text: "Entrar na plataforma com a conta de Professor e identificar o horário da semana." },
      { id: "b2", text: "Marcar três horários como disponíveis para coachings adicionais." },
      { id: "b3", text: "Aceitar ou rejeitar um pedido de coaching pendente." },
      { id: "b4", text: "Confirmar a realização de uma sessão já lecionada." },
    ],
  },
  dir: {
    label: "Guião C — Direção",
    tasks: [
      { id: "c1", text: "Entrar na plataforma com a conta de Direção e consultar o horário geral da escola." },
      { id: "c2", text: "Adicionar uma nova aula regular ao horário." },
      { id: "c3", text: "Aprovar ou desaprovar um pedido de coaching já aceite por um professor." },
      { id: "c4", text: "Validar uma sessão que tem dupla confirmação (Professor e Encarregado)." },
      { id: "c5", text: "Gerar o relatório mensal e exportar a folha Excel de um encarregado." },
      { id: "c6", text: "Aprovar um pedido de aluguer pendente no marketplace." },
    ],
  },
};

const TestScriptPage = () => {
  const [active, setActive] = useState<keyof typeof guides>("ee");
  const [done, setDone] = useState<Record<string, boolean>>({});
  const guide = guides[active];

  return (
    <div className="min-h-screen bg-background p-6 sm:p-10">
      <div className="max-w-3xl mx-auto space-y-8">
        <div>
          <h1 className="font-display text-4xl font-bold text-foreground">Testes de Funcionalidade</h1>
          <p className="text-sm text-muted-foreground mt-1">Ent'Artes · guião de demonstração</p>
        </div>

        <div className="bg-card rounded-lg border border-border shadow-card p-6 space-y-4">
          <h2 className="font-display text-lg font-semibold text-foreground">O sistema</h2>
          {intro.split("\n\n").map((p, i) => (
            <p key={i} className="text-sm text-foreground leading-relaxed">{p}</p>
          ))}
        </div>

        <div className="flex gap-1 bg-muted rounded-lg p-1 w-fit">
          {Object.entries(guides).map(([k, g]) => (
            <button
              key={k}
              onClick={() => setActive(k as keyof typeof guides)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                active === k ? "bg-card text-foreground shadow-card" : "text-muted-foreground"
              }`}
            >
              {g.label.split("—")[0].trim()}
            </button>
          ))}
        </div>

        <div className="bg-card rounded-lg border border-border shadow-card p-6">
          <h2 className="font-display text-xl font-semibold text-foreground mb-4">{guide.label}</h2>
          <ol className="space-y-3">
            {guide.tasks.map((t, i) => (
              <li key={t.id} className="flex items-start gap-3">
                <input
                  type="checkbox"
                  checked={!!done[t.id]}
                  onChange={() => setDone((d) => ({ ...d, [t.id]: !d[t.id] }))}
                  className="mt-1 h-4 w-4 rounded border-input"
                />
                <label className={`text-sm ${done[t.id] ? "line-through text-muted-foreground" : "text-foreground"}`}>
                  <span className="font-semibold mr-2">{i + 1}.</span>{t.text}
                </label>
              </li>
            ))}
          </ol>
        </div>

        <p className="text-xs text-muted-foreground text-center">
          No final, registar quais tarefas foram concluídas sem dificuldade e quais exigiram explicação.
        </p>
      </div>
    </div>
  );
};

export default TestScriptPage;
