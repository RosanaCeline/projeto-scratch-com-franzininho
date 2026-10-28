# Projeto Scratch – Jogo de grade e missões

Jogo educativo em Scratch: o aluno recebe uma missão ligada ao conteúdo da disciplina, descobre a célula-alvo no mapa, monta uma sequência de movimentos (cima, baixo, esquerda, direita) e só depois a executa. O jogo exercita o conteúdo da disciplina e o pensamento computacional (decomposição, padrões, abstração e algoritmo).

## Estrutura do repositório

```
nome-do-repositorio/
├── README.md
├── sprint-1/
│   └── jogo-grade.sb3
├── sprint-2/
│   └── jogo-grade.sb3
├── sprint-3/
    └── jogo-grade.sb3
```

- Cada pasta `sprint-N` guarda o `jogo-grade.sb3` como ele ficou no fim daquela sprint.
- O arquivo tem sempre o mesmo nome. O que muda é a pasta.
- O `.sb3` já contém scripts, imagens e sons, e é o único arquivo do projeto Scratch que vai para o repositório.

## Como trabalhar com Git e Scratch

O Git guarda o histórico do `.sb3`, mas não mostra o que mudou dentro dele nem junta edições de duas pessoas. Por isso, **só uma pessoa edita o `.sb3` por vez**.

1. **Antes de começar:** rode `git pull` para pegar a versão mais recente e avise no grupo que você vai editar.
2. **Abrir:** no Scratch, vá em Arquivo > Carregar do seu computador e escolha `sprint-N/jogo-grade.sb3` (N é a sprint atual).
3. **Editar:** faça a sua parte.
4. **Salvar:** Arquivo > Salvar no seu computador. Copie o arquivo baixado por cima de `sprint-N/jogo-grade.sb3`, mantendo o mesmo nome.
5. **Enviar:**
   ```
   git add .
   git commit -m "descreva o que mudou"
   git push
   ```
6. **Depois:** avise no grupo que terminou, para a próxima pessoa poder editar.

## Início de uma nova sprint

1. A integradora cria a pasta `sprint-N`.
2. Copia para ela o `jogo-grade.sb3` da sprint anterior.
3. Faz commit e push, e avisa no grupo.
4. Durante a sprint, só a pasta atual é editada. As anteriores ficam só para consulta.

Para voltar a uma versão antiga, use as pastas das sprints ou o histórico de commits do GitHub.

## Trabalho em equipe

Como o `.sb3` não pode ser editado por duas pessoas ao mesmo tempo, o trabalho é dividido por partes e uma pessoa junta tudo:

- Cada integrante trabalha em um `.sb3` próprio de teste, fora do repositório, e exporta o que ficou pronto (clique direito no sprite > Exportar gera um `.sprite3`).
- Mapas (cenários) também podem ser exportados e enviados como arquivo ou imagem.
- A **integradora** abre o `jogo-grade.sb3` da sprint e importa o que as outras fizeram: Escolher um sprite > Enviar sprite, e Escolher um cenário > Enviar cenário.
- Depois ela faz commit do `.sb3` atualizado e avisa no grupo.
- O regulamento pede dados do cenário separados da lógica. Quanto mais ficar nas listas e nos dados (posição inicial, obstáculos, rótulos das células, missões), menos conflito a equipe tem.

## Regras de convivência

- Nunca edite o `.sb3` sem ter avisado no grupo e feito `git pull`.
- Se duas pessoas editaram ao mesmo tempo, o Git vai dar conflito. Escolham uma das versões e refaçam à mão o que ficou de fora da outra.
- Mensagens de commit curtas e claras, dizendo o que mudou (ex.: "adiciona tela de conclusão").
- Experimentos e testes pessoais não vão para o repositório.
- Nomes de pastas e arquivos em minúsculas, sem acentos e sem espaços (use hífen).

## Configurações do jogo

Valores iniciais, editáveis pelo professor sem mexer nos scripts:

- Acertos para concluir o desafio: 5
- Limite de comandos na sequência: 20
- Intervalo de execução: cerca de 0,5 s por comando

## Estrutura inicial no Scratch

- **Variáveis:** coluna, linha, fase (planejar ou executar), missão atual, acertos, tentativas
- **Listas:** sequência de comandos, textos das missões, alvos (coluna e linha), obstáculos
- **Mensagens:** iniciar rodada, executar, acerto, erro, bloqueio, conclusão
- **Blocos próprios:** mover (com a direção) e avaliar