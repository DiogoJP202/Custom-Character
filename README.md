# Jujutsu — Character Spinner

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
- Sorteio ponderado, segmentos proporcionais e parada no centro do resultado.
- Uma rolagem por atributo, revelação, progressão e ficha parcial.
- Salvamento automático da criação atual em `localStorage` (`jjk-spinner:v1`). Um giro é registrado antes da animação; recarregar não sorteia outro resultado.
- Ao encerrar, uma nova criação apaga todos os resultados anteriores.
- Layout responsivo, teclado, anúncio do resultado e preferência por movimento reduzido.

Se o navegador bloquear o armazenamento, a criação continua em memória até a página ser fechada ou recarregada. O salvamento é local à origem/endereço usado para abrir o site.

## Dados e expansão

Edite `src/data/wheels.ts` para alterar resultados, descrições, cores e pesos. Os pesos são normalizados automaticamente; não precisam somar 100. A legenda e os segmentos usam a mesma distribuição do sorteio.

Natureza: Humano 70, Espírito amaldiçoado 20, Cadáver amaldiçoado independente 8, Simuriano 2.

Linhagem: Sem clã conhecido 70, Gojo 5, Zen’in 10, Kamo 10, Inumaki 5.

Cada etapa tem `id`, `name`, `title`, `titleAccent`, `description`, `options` e uma condição opcional `availableWhen: { stepId, optionId }`. Cada resultado tem `id`, `name`, `shortLabel`, `description`, `weight` e `color`. A condição atual compara um resultado anterior; não existe um motor genérico de regras.

O fluxo atual cobre apenas Origem. Novos resultados e etapas simples cabem na configuração; ao criar capítulos ou novos fluxos terminais, atualize também os títulos e a validação de persistência em `src/lib/game.ts`. Se os identificadores ou a estrutura salva deixarem de ser compatíveis, altere a versão da chave de armazenamento.

`src/lib/wheel.ts` concentra a geometria e o sorteio. `src/lib/game.ts` controla estados e persistência. Os componentes `Wheel`, `ResultReveal` e `CharacterSheet` apresentam o jogo; `App` conecta as interações.

## Referências e limites de cânone

Este é um projeto de fãs. **As probabilidades e a combinação de origens são decisões de gameplay, não regras ou frequências oficiais.** O personagem criado é original; nenhuma linhagem concede automaticamente técnicas ou habilidades. “Sem clã conhecido” descreve a ausência de vínculo estabelecido pelo jogo, não uma classificação oficial da obra. Os próximos passos das naturezas não humanas não foram inventados.

- [Referência da experiência: Making a Custom JJK Character, Reddit](https://www.reddit.com/r/CTsandbox/comments/1nz8ysn/making_a_custom_jjk_character/). Usada como inspiração para a interação; o conteúdo fanmade não foi incorporado.
- [Personagens — site oficial do anime](https://jujutsukaisen.jp/character/index_1st.php): descrições de Panda, Yaga, Toge Inumaki e personagens das famílias do jujutsu.
- [Jujutsu Kaisen — Shonen Jump oficial](https://www.shonenjump.com/j/rensai/jujutsu/): universo original de Gege Akutami. As descrições de maldições e linhagens foram mantidas curtas e sem promessas de habilidades hereditárias.
- Jujutsu Kaisen, mangá e volume 0: contexto dos cadáveres amaldiçoados, das três grandes famílias e da linhagem Inumaki. As descrições não reproduzem texto do mangá.
- [Jujutsu Kaisen Modulo — VIZ oficial](https://www.viz.com/shonenjump/chapters/jujutsu-kaisen-modulo).
- [Vídeo oficial da MANGA Plus / Shueisha sobre Modulo](https://www.youtube.com/watch?v=KRN3hWYJJlg): apresentação dos Simurians, chamados de “Simurianos” neste projeto conforme o briefing. Não é uma afirmação sobre a grafia de uma edição brasileira específica.

Os links são apenas referências documentais; o jogo não faz requisições a esses serviços.
