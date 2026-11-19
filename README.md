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
- Sorteio ponderado, segmentos proporcionais e parada no centro do resultado.
- Uma rolagem por atributo, revelação, progressão e ficha parcial.
- Salvamento automático em `localStorage` (`jjk-spinner:v1`, formato v3). Um giro é registrado antes da animação; recarregar revela o mesmo resultado. Partidas v1/v2 preservam os resultados: humanos sem atributos físicos passam pela nova roleta de nascimento; quando já havia atributos físicos, a condição fica explicitamente **não registrada**, sem sorteio retroativo. Fichas antigas concluídas retomam na reserva.
- Ao encerrar, uma nova criação apaga todos os resultados anteriores.
- Layout responsivo, teclado, anúncio do resultado e preferência por movimento reduzido.
- Modo de teste somente em `npm run dev`, desligado por padrão: libera **Tentar novamente** no resultado e nos detalhes da ficha. Repetir apaga essa etapa e as seguintes. O build de produção bloqueia retry, mesmo com a flag manipulada.

Se o navegador bloquear o armazenamento, a criação continua em memória até a página ser fechada ou recarregada. O salvamento é local à origem/endereço usado para abrir o site.

## Dados e expansão

Edite `src/data/wheels.ts` para alterar resultados, descrições, cores e pesos. Os pesos são normalizados automaticamente; não precisam somar 100. A legenda e os segmentos usam a mesma distribuição do sorteio.

Natureza: Humano 70, Espírito amaldiçoado 20, Cadáver amaldiçoado independente 8, Simuriano 2.

Linhagem: Sem clã conhecido 70, Gojo 5, Zen’in 10, Kamo 10, Inumaki 5.

`chapters` define os títulos dos capítulos. Cada roleta aponta para um `chapterId`, contém suas opções e pode ter `availableWhen: { stepId, optionId }`. Cada resultado mantém identificador, nome, descrição, rótulo, peso e cor. Referências físicas em `src/data/references.ts` acrescentam versão, feitos com contexto e fontes e limites da comparação. A ordem do catálogo determina o fluxo e a validação de partidas.

Humanos passam por Linhagem e Condição especial antes dos atributos físicos; outras naturezas pulam essas duas roletas. Cada atributo exige giro manual, revelação e Continuar. Segmentos menores que 10% usam marcadores numéricos maiores, correspondentes à legenda, sem alterar sua área. Alterações incompatíveis nos identificadores exigem uma migração explícita do salvamento.

`src/data/special.ts` contém as novas opções (condições: 65/15/10/10; reserva: 15/25/25/20/15). `src/lib/conditions.ts` centraliza as compatibilidades. As referências físicas sorteadas são preservadas; nas restrições, uma **capacidade efetiva qualitativa** prevalece explicitamente sobre a comparação, sem somar poderes. Parcial usa Maki do Intercâmbio como referência limitada; completa determina físico extraordinário e energia ausente; Kokichi determina corpo debilitado, sem confundir alcance/output com estoque. Para a parcial, a única reserva compatível é Muito baixa (giro manual de 100%).

A escala de reserva é uma abstração comum de gameplay, com explicação específica para humanos, espíritos, corpos artificiais e rolloluca simuriana. Não representa equivalência biológica ou quantitativa entre naturezas. O termo rolloluca segue o briefing; detalhes de sua fisiologia não foram inferidos de wikis ou de capítulos indisponíveis. Yuta contextualiza grandes reservas no cap. 140, sem conceder Rika ou técnica. Os links para catálogos oficiais são referências de leitura, não transcrições desses capítulos.

O [PR #1 de rebalanceamento](https://github.com/DiogoJP202/Custom-Character/pull/1) estava aberto na última consulta bem-sucedida. Nesta entrega, a consulta remota e o fetch do Git falharam por problemas de certificado HTTPS; seu estado atual não pôde ser confirmado. Nenhum merge ou mudança nos pesos anteriores foi feito. Os testes continuam exercitando as distribuições propostas para garantir compatibilidade.

### Técnicas

`src/data/techniques.ts` contém 11 opções humanas e três de espíritos, com funcionamento, personagem/fase, uso inicial, condições e feitos com indicação de fonte oficial. `eligibleTechniques` em `src/lib/conditions.ts` filtra natureza, linhagem e exigência de energia própria. Os mesmos pesos filtrados alimentam sorteio, segmentos e legenda; os pesos relativos não precisam somar 100.

Gojo habilita Ilimitado; Zen’in, Dez Sombras/Projeção; Kamo, Sangue; Inumaki, Fala. As seis opções humanas restantes não exigem linhagem. Construção não é bloqueada por Zen’in; o exemplo de Yorozu não é usado para conceder suas aplicações avançadas. Cópia por Yuta e as constituições de Choso/Naoya não universalizam as respectivas heranças. Ilimitado não concede Seis Olhos ou aplicações plenas. Restrição completa pula o capítulo; parcial/energia muito baixa mantêm a técnica como capacidade existente, sem garantir energia para utilizá-la. Kokichi não recebe Marionetes automaticamente nem tem seu corpo reparado.

Cadáveres independentes e simurianos pulam as duas roletas; a ficha explica a constituição artificial ou a ausência de catálogo simuriano, sem declarar incapacidade canônica. Não há distribuição de técnicas humanas para essas naturezas. Nenhum núcleo extra de Panda é concedido.

Partidas v3 concluídas retomam nas novas etapas elegíveis, mantendo o formato e os resultados anteriores. Saves v1/v2 continuam sendo validados pelo catálogo histórico de Origem/Físico e migrados. As regras de retry de desenvolvimento apagam a técnica ao repetir sua etapa ou a presença.

**Limite de verificação desta entrega:** os acessos ao site oficial, VIZ, GitHub e busca falharam por certificado/transporte, inclusive no navegador. As fontes de episódios abaixo são indicações de leitura e as descrições são conservadoras; a conferência online atualizada permanece pendente. Cópia foi deixada fora até conferir suas condições de aquisição/armazenamento sem conceder Rika; Dagon, até separar invocações demonstradas em domínio de uma aplicação inicial sem domínio. Modulo continua sem catálogo de habilidades por falta de fundamentação suficiente. Jogo/Hanami usam rótulos descritivos, sem afirmar nomes oficiais não confirmados.

Referências de leitura das técnicas: episódios 1 (Cães Divinos), 7 (Gojo/Jogo), 10 (Nanami/Mahito), 16 (Mechamaru), 17 (Construção), 18 (Sangue), 19 (Fala/Hanami), 20 (Boogie Woogie), 24 (Boneco de Palha), 38 (Projeção) e JJK 0, capítulo 4/filme (Geto). Os links correspondentes ficam nos resultados. Não há reprodução de imagens ou textos desses materiais.

`src/lib/wheel.ts` concentra a geometria e o sorteio. `src/lib/game.ts` controla estados e persistência. Os componentes `Wheel`, `ResultReveal` e `CharacterSheet` apresentam o jogo; `App` conecta as interações.

Os detalhes de qualquer resultado podem ser reabertos pela ficha, sem novo sorteio. A revelação resume a capacidade prática e um feito; os contextos, fontes e limites ficam numa seção expansível. A composição editorial é original, sem artes oficiais ou hotlink. Barlow Condensed e IBM Plex Sans são servidas localmente; suas licenças OFL estão em `public/fonts/`.

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
