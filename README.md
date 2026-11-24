# Custom Character — Jujutsu Kaisen

Pequeno jogo de criação de personagens de Jujutsu Kaisen. React + TypeScript + Vite e CSS puro, sem backend, login, fontes remotas ou APIs externas.

## Executar localmente

Requer Node.js 22.18+ ou 24+ e npm.

```sh
npm install
npm run dev
```

Abra o endereço mostrado pelo Vite (normalmente http://127.0.0.1:5173).

```sh
npm test
npm run build
npm run preview
```

O build estático fica em `dist/`. O preview serve esse build localmente.

## O que está disponível

- Capítulo 1 — Origem: Natureza e, para humanos, Linhagem.
- Capítulo 2 — Condições especiais: somente humanos, após Linhagem.
- Capítulo 3 — Atributos Físicos: Força física, Velocidade e Resistência para todas as naturezas.
- Capítulo 4 — Reserva: energia amaldiçoada ou rolloluca, conforme a natureza.
- Capítulo 5 — Técnicas: presença (humanos 80/20; espíritos 90/10) e, quando elegível, técnica específica. Percentuais de gameplay.
- Capítulo 6 — Controle, output e proficiência: precisão do fluxo, liberação instantânea e uso da técnica, com resumo contextual na ficha.
- Capítulo 7 — Recursos avançados: recuperação compatível com a natureza, defesa ant domínio e equipamento, sem sistema de combate.
- Sorteio ponderado, segmentos proporcionais e parada no centro do resultado.
- Uma rolagem por atributo, revelação, progressão e ficha parcial. Etapas com uma única opção compatível registram a consequência automaticamente, sem consumir aleatoriedade; a revelação aguarda Continuar.
- Salvamento automático em `localStorage` (`jjk-spinner:v1`, formato v3). Um giro é registrado antes da animação; recarregar revela o mesmo resultado. Partidas v1/v2 preservam os resultados: humanos sem atributos físicos passam pela nova roleta de nascimento; quando já havia atributos físicos, a condição fica explicitamente **não registrada**, sem sorteio retroativo. Fichas antigas concluídas retomam na reserva.
- Ao encerrar, uma nova criação apaga todos os resultados anteriores.
- Layout responsivo, teclado, anúncio do resultado e preferência por movimento reduzido.
- Modo de teste somente em `npm run dev`, desligado por padrão: libera **Tentar novamente** no resultado e nos detalhes da ficha. Repetir apaga essa etapa e as seguintes. O build de produção bloqueia retry, mesmo com a flag manipulada.

Se o navegador bloquear o armazenamento, a criação continua em memória até a página ser fechada ou recarregada. O salvamento é local à origem/endereço usado para abrir o site.

## Dados e expansão

Edite `src/data/wheels.ts` para alterar resultados, descrições, cores e pesos. Os pesos são normalizados automaticamente; não precisam somar 100. A legenda e os segmentos usam a mesma distribuição do sorteio.

Natureza: Humano 45, Espírito amaldiçoado 30, Cadáver amaldiçoado independente 17, Simuriano 8.

Linhagem: Sem clã conhecido 40, Gojo 15, Zen’in 18, Kamo 17, Inumaki 10. Força: 21/19/18/17/15/10; Velocidade: 26/23/20/18/13; Resistência: 26/22/20/18/14, na ordem das opções do catálogo.

`chapters` define os títulos dos capítulos. Cada roleta aponta para um `chapterId`, contém suas opções e pode ter `availableWhen: { stepId, optionId }`. Cada resultado mantém identificador, nome, descrição, rótulo, peso e cor. Referências físicas em `src/data/references.ts` acrescentam versão, feitos com contexto e fontes e limites da comparação. A ordem do catálogo determina o fluxo e a validação de partidas.

Humanos passam por Linhagem e Condição especial antes dos atributos físicos; outras naturezas pulam essas duas roletas. Etapas com mais de uma opção exigem giro manual, revelação e Continuar. Segmentos menores que 10% usam marcadores numéricos maiores, correspondentes à legenda, sem alterar sua área. Alterações incompatíveis nos identificadores exigem uma migração explícita do salvamento.

`src/data/special.ts` contém as opções de condições (65/15/10/10) e reserva (15/25/25/20/15). `src/lib/conditions.ts` centraliza as compatibilidades. As referências físicas sorteadas são preservadas; nas restrições, uma **capacidade efetiva qualitativa** prevalece explicitamente sobre a comparação, sem somar poderes. Parcial usa Maki do Intercâmbio como referência limitada; completa determina físico extraordinário e energia ausente; Kokichi determina corpo debilitado, sem confundir alcance/output com estoque. Para a parcial, a única reserva compatível é Muito baixa, registrada automaticamente. Saves antigos nessa etapa mantêm o resultado ou entram na revelação automática se ainda não o tinham.

A escala de reserva é uma abstração comum de gameplay, com explicação específica para humanos, espíritos, corpos artificiais e rolloluca simuriana. Não representa equivalência biológica ou quantitativa entre naturezas. O termo rolloluca segue o briefing; detalhes de sua fisiologia não foram inferidos de wikis ou de capítulos indisponíveis. Yuta contextualiza grandes reservas no cap. 140, sem conceder Rika ou técnica. Os links para catálogos oficiais são referências de leitura, não transcrições desses capítulos.

O [PR #1 de rebalanceamento](https://github.com/DiogoJP202/Custom-Character/pull/1) já está incorporado à `main`. Seus pesos e IDs foram preservados.

### Técnicas

`src/data/techniques.ts` contém 11 opções humanas e três de espíritos, com funcionamento, personagem/fase, uso inicial, condições e feitos com indicação de fonte oficial. `eligibleTechniques` em `src/lib/conditions.ts` filtra natureza, linhagem e exigência de energia própria. Os mesmos pesos filtrados alimentam sorteio, segmentos e legenda; os pesos relativos não precisam somar 100.

Gojo habilita Ilimitado; Zen’in, Dez Sombras/Projeção; Kamo, Sangue; Inumaki, Fala. As seis opções humanas restantes não exigem linhagem. Construção não é bloqueada por Zen’in; o exemplo de Yorozu não é usado para conceder suas aplicações avançadas. Cópia por Yuta e as constituições de Choso/Naoya não universalizam as respectivas heranças. Ilimitado não concede Seis Olhos ou aplicações plenas. Restrição completa pula o capítulo; parcial/energia muito baixa mantêm a técnica como capacidade existente, sem garantir energia para utilizá-la. Kokichi não recebe Marionetes automaticamente nem tem seu corpo reparado.

Cadáveres independentes e simurianos pulam as duas roletas; a ficha explica a constituição artificial ou a ausência de catálogo simuriano, sem declarar incapacidade canônica. Não há distribuição de técnicas humanas para essas naturezas. Nenhum núcleo extra de Panda é concedido.

Partidas v3 concluídas retomam nas novas etapas elegíveis, mantendo o formato e os resultados anteriores. Saves v1/v2 continuam sendo validados pelo catálogo histórico de Origem/Físico e migrados. As regras de retry de desenvolvimento apagam a técnica ao repetir sua etapa ou a presença.

Foram consultados os perfis e as sinopses oficiais do anime. As sinopses confirmam o contexto das cenas, mas não detalham todas as condições de ativação: os episódios indicados são as referências de leitura. Cópia fica fora até representar aquisição/armazenamento sem conceder Rika; Dagon, até separar suas invocações demonstradas em domínio (episódio 39) de uma aplicação inicial sem domínio. Modulo continua sem catálogo de habilidades por falta de fundamentação suficiente. Jogo/Hanami usam rótulos descritivos, sem afirmar nomes oficiais não confirmados.

Referências de leitura das técnicas: episódios 1 (Cães Divinos), 7 (Gojo/Jogo), 10 (Nanami/Mahito), 16 (Mechamaru), 17 (Construção), 18 (Sangue), 19 (Fala/Hanami), 20 (Boogie Woogie), 24 (Boneco de Palha), 38 (Projeção) e JJK 0, capítulo 4/filme (Geto). Os links correspondentes ficam nos resultados. Não há reprodução de imagens ou textos desses materiais.

### Controle, output e proficiência

`src/data/mastery.ts` mantém os três catálogos e exemplos oficiais: controle e output usam 15/25/30/20/10; proficiência, 20/25/25/20/10. Reserva, controle e output não aumentam uns aos outros. O resumo deriva das combinações, sem pontos ou cálculos de dano. `practicedUse` em cada técnica descreve sua exploração além do uso inicial, mantendo os requisitos e os recursos ausentes.

Na restrição completa, as três etapas são ignoradas e a ficha registra ausência de energia própria. Na parcial, o controle é precisão potencial, o output Muito baixo é automático e a proficiência efetiva fica entre Iniciante e Básica. Na restrição corporal, output é filtrado para Alto/Extraordinário (pesos relativos 20/10), preservando alcance favorecido e corpo debilitado. Pisos e tetos são adaptações explícitas do jogo. Sem técnica inata, somente proficiência é ignorada. Nenhuma dessas regras concede Marionetes, Seis Olhos ou um repertório completo.

Espíritos usam explicações de controle/output próprias de sua natureza. Cadáveres e simurianos mantêm suas reservas e recebem avisos de catálogo ainda insuficiente para as três capacidades, sem presumir fisiologia humana ou incapacidade canônica; a ficha simuriana usa rolloluca. Fichas v3 concluídas de humanos/espíritos retomam em Controle sem novos resultados atribuídos silenciosamente. A chave e o formato do save continuam os mesmos.

Referências: [Yuji e Todo, episódio 16](https://jujutsukaisen.jp/episodes/16.php); [output de Ryu, perfil oficial](https://jujutsukaisen.jp/character/) e [Sendai, episódio 59](https://jujutsukaisen.jp/episodes/59.php); [alcance/output de Kokichi, perfil oficial](https://jujutsukaisen.jp/character/category2.php). São exemplos de conceitos, sem equivalência entre personagens e níveis da escala. Os feitos e limites de cada técnica continuam associados às fontes anteriores.

### Recursos avançados

`src/data/advanced.ts` guarda os resultados e as referências; `src/lib/advanced.ts` trata as regras específicas, chamadas por `conditions.ts`. O fluxo e o formato v3 continuam usando o catálogo existente. Fichas antigas concluídas retomam no primeiro recurso compatível, sem perder resultados; consequências determinísticas são reveladas antes de Continuar.

Humanos elegíveis sorteiam RCT em 65/22/10/3: nenhuma, própria limitada, própria avançada ou cura de terceiros. O repertório sorteado permanece mesmo quando controle, estoque ou output reduzem a execução efetiva. RCT não concede Reversão de Técnica Amaldiçoada, ressurreição, cura universal ou remoção da condição de Kokichi. A restrição completa ignora recursos dependentes de energia própria; na parcial, RCT e defesa ficam em nenhuma, automaticamente, como regra conservadora de gameplay para a energia residual.

Defesas humanas: nenhuma 60, Domínio Simples 23, Cesto de Vime Oco 12, Emoção da Flor Cadente 5. Flor Cadente exige Gojo/Zen’in/Kamo; as opções são filtradas antes da normalização. Domínio Simples inclui formação após a liberação da transmissão no cap. 269, usando uma configuração inicial fixa como a de Miwa. Cesto exige selo para ativar/sustentar; Flor Cadente reage ao contato sem criar uma barreira. Nenhuma defesa garante vitória. Aprendizado não é concedido por controle excepcional sozinho.

Espíritos têm sua própria distribuição de recomposição (20/60/20), sem receber RCT humana. Cadáveres recebem registro de reparação específica; simurianos, ausência de cura especial atribuída, sem supor fisiologia humana. Defesas humanas não são distribuídas indiscriminadamente. Todas as naturezas chegam à roleta física de equipamento, com requisitos de corpo e empunhadura explícitos.

Equipamento: nenhum 20, convencional 20, ferramenta comum 30, categoria elevada 20, Nuvem Brincalhona 5, Lança Invertida do Céu 3, Katana Divisora de Almas 2. Comum/elevada são faixas do jogo, sem atribuir grau oficial ou técnica inventada a itens genéricos. Os três artefatos nomeados representam posse hipotética do original em cenários independentes de fã, nunca fabricação de réplicas ou afirmação de disponibilidade na cronologia oficial. Energia imbuída não aumenta a energia do portador. O efeito pleno da Katana fica bloqueado porque a percepção exigida ainda não é registrada; força, restrição ou controle não a concedem automaticamente.

Fontes de leitura: perfis oficiais de Shoko (RCT/terceiros), episódios 19/39 (ferramentas e Hanami/Toji), 27/28 (Lança e RCT de Gojo), 38 (Ui Ui e Naobito), 58 (Reggie); mangá, capítulos 108, 171, 198, 266 e 269. As sinopses oficiais verificam o contexto das cenas, sem detalhar toda a mecânica. Os links ficam nos resultados. Não foram atribuídos cura universal não humana, percepção de almas, cápsulas de Mechamaru, treinamento de armas ou outras propriedades sem requisitos representados.

`src/lib/wheel.ts` concentra a geometria e o sorteio. `src/lib/game.ts` controla estados e persistência. Os componentes `Wheel`, `ResultReveal` e `CharacterSheet` apresentam o jogo; `App` conecta as interações.

Os detalhes de qualquer resultado podem ser reabertos pela ficha, sem novo sorteio. A revelação resume a capacidade prática e um feito; os contextos, fontes e limites ficam numa seção expansível. A composição editorial é original, sem artes oficiais ou hotlink. Barlow Condensed e IBM Plex Sans são servidas localmente; suas licenças OFL estão em `public/fonts/`.

### Expansão de Domínio

O capítulo 8 usa `src/data/domains.ts` e `src/lib/domains.ts`. Humanos com energia e espíritos sorteiam formação em barreiras (25/35/25/15), separada de controle e defesas ant domínio. A restrição parcial permite conhecimento, mas bloqueia uma expansão efetiva; a completa pula as duas etapas. Cadáveres e simurianos mantêm os recursos anteriores, sem extrapolar barreiras humanas para suas naturezas.

Só Dez Sombras, Transfiguração Ociosa e Chamas de Jogo habilitam a roleta 65/35 de expansão. O resultado positivo já identifica sua única manifestação documentada, sem um segundo giro garantido. Jardim da Sombra Quimérica permanece incompleto, depende de suporte espacial compatível e não recebe acerto garantido, todos os shikigamis ou Mahoraga. Autoencarnação da Perfeição e Caixão da Montanha de Ferro preservam suas manifestações completas; recursos insuficientes tornam a execução não confiável, sem inventar versões incompletas. Os limites de uso são interpretações conservadoras do jogo, não limiares oficiais de energia.

Não são atribuídos Vazio Infinito sem modelar Seis Olhos, domínio de Yorozu à Construção inicial de Mai, domínio do espírito Naoya à Projeção humana ou domínio de Kenjaku como capacidade universal de Geto. Hanami e as demais técnicas não recebem expansões com propriedades insuficientemente documentadas. Essa ausência é uma limitação do catálogo. Fontes: [episódio 7](https://jujutsukaisen.jp/episodes/07.php), [13](https://jujutsukaisen.jp/episodes/13.php), [23](https://jujutsukaisen.jp/episodes/23.php), [58](https://jujutsukaisen.jp/episodes/58.php); mangá, capítulos 15–16, 29–30, 58 e 170–172. As sinopses verificam o contexto; os capítulos/cenas indicados são a referência para os detalhes.

Saves v3 concluídos retomam no primeiro estágio novo elegível, sem sorteios na restauração; os IDs e pesos anteriores continuam intactos. O workflow `.github/workflows/ci.yml` executa instalação, testes e build em Node 24 nos pushes e pull requests.

### Ficha final

Ao concluir os oito capítulos disponíveis, a criação vira um dossiê com identidade derivada, capacidades efetivas, estilo de combate, pontos fortes e limites. `src/lib/character-profile.ts` é uma interpretação pura dos resultados; reutiliza os resumos e critérios existentes de cura/domínio, sem novos sorteios, classes oficiais ou alterações de poderes. A ficha completa e suas fontes continuam consultáveis. Uma confirmação protege a substituição do único save. Chave, formato e resultados salvos permanecem iguais; nenhuma roleta foi adicionada nesta fase.

### Galeria local

“Meus personagens” guarda até 30 fichas concluídas em `jjk-character-gallery:v1`, separadas da criação ativa em `jjk-spinner:v1`. O registro contém UUID, nome normalizado (até 60 caracteres), data do salvamento e snapshot v3; descrições continuam derivadas. Resultados idênticos são reconhecidos como a mesma ficha para evitar duplicatas, inclusive após recarregar. Renomear e excluir não alteram os resultados ou a partida ativa. Fichas arquivadas não oferecem retry, mesmo em desenvolvimento.

O registro v1 fixa seu limite histórico em `domain-expansion`; sua validação reutiliza o parser de jogo sem retomar etapas futuras. Um novo catálogo de arquivamento deverá versionar esse limite, preservando a leitura de v1. JSON ou registros inválidos não são sobrescritos: as fichas legíveis permanecem disponíveis e alterações ficam bloqueadas. Escritas falhas não são confirmadas. As mutações releem a coleção e a interface acompanha eventos `storage`, mas localStorage não oferece transações entre abas. Os dados pertencem somente a este navegador, sem sincronização em nuvem.

### Exportação visual

“Exportar PNG” está disponível na ficha concluída e nas fichas da galeria. Gera um dossiê de 1200 × 2160 px, com identidade, capacidades e interpretações resumidas do perfil existente, sem novos sorteios ou alterações no armazenamento. `html-to-image` é carregado somente ao exportar; as fontes locais são incorporadas. A geração tem feedback, limite de tempo e verificação de conteúdo para evitar cortes. O link “Baixar PNG novamente” permanece disponível se o navegador não iniciar o download; a gravação final depende das permissões do navegador. A renderização pode variar entre navegadores e fontes de substituição usadas em nomes com caracteres não latinos.

### Ritmo e revelações

O ritmo Padrão (2,2 s) ou Rápido (0,8 s) fica em `jjk-spinner-preferences:v1`, separado da partida; movimento reduzido elimina a animação. As revelações resumem a capacidade e sua principal consequência, com explicações completas em “Entender habilidade/resultado”. A ficha em criação recolhe os capítulos anteriores. Quatro clipes oficiais opcionais usam o player do YouTube após interação, sem interferir na progressão ou no PNG. A pesquisa, condições de incorporação e candidatos descartados estão em [docs/media-research.md](docs/media-research.md).

## Referências e limites de cânone

Este é um projeto de fãs. **Comparações de desempenho, probabilidades e combinações são abstrações do jogo, não classificações oficiais.** Referências físicas não concedem técnicas, armas, regeneração ou a natureza do personagem citado. Megumi, Panda, Maki, Todo, Yuji e Hanami são considerados no arco do Intercâmbio; Toji, em Shibuya. “Sem clã conhecido” descreve a ausência de vínculo estabelecido pelo jogo, não uma classificação oficial.

- [Referência da experiência: Making a Custom JJK Character, Reddit](https://www.reddit.com/r/CTsandbox/comments/1nz8ysn/making_a_custom_jjk_character/). Usada como inspiração para a interação; o conteúdo fanmade não foi incorporado.
- [Personagens — site oficial do anime](https://jujutsukaisen.jp/character/index_1st.php): descrições de Panda, Yaga, Toge Inumaki e personagens das famílias do jujutsu.
- Referências físicas: [episódio 16](https://jujutsukaisen.jp/episodes/16.php) (Panda/Mechamaru e Todo/Yuji), [episódio 17](https://jujutsukaisen.jp/episodes/17.php) (Maki/Miwa), [episódio 19](https://jujutsukaisen.jp/episodes/19.php) e [episódio 20](https://jujutsukaisen.jp/episodes/20.php) (combate a Hanami). As comparações entre eles são interpretação de gameplay, sem ranking canônico ou valores numéricos de desempenho.
- Toji: [personagem oficial](https://jujutsukaisen.jp/character/index_2nd.php), [episódio 39](https://jujutsukaisen.jp/episodes/39.php) (Dagon) e [episódio 40](https://jujutsukaisen.jp/episodes/40.php) (Megumi).
- [Jujutsu Kaisen — Shonen Jump oficial](https://www.shonenjump.com/j/rensai/jujutsu/): universo original de Gege Akutami. As descrições de maldições e linhagens foram mantidas curtas e sem promessas de habilidades hereditárias.
- Jujutsu Kaisen, mangá e volume 0: contexto dos cadáveres amaldiçoados, das três grandes famílias e da linhagem Inumaki. As descrições não reproduzem texto do mangá.
- [Jujutsu Kaisen Modulo — VIZ oficial](https://www.viz.com/shonenjump/chapters/jujutsu-kaisen-modulo).
- [Vídeo oficial da MANGA Plus / Shueisha sobre Modulo](https://www.youtube.com/watch?v=KRN3hWYJJlg): apresentação dos Simurians, chamados de “Simurianos” neste projeto conforme o briefing. Não é uma afirmação sobre a grafia de uma edição brasileira específica.

Os links são apenas referências documentais; o jogo não faz requisições a esses serviços.
