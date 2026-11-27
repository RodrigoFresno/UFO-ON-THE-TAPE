# THE TAPE — reconstrução web (iPhone / Safari / GitHub Pages)

Esta pasta contém uma reconstrução jogável para navegador baseada nos recursos extraídos do ZIP enviado. Ela **não usa câmera real**, não pede permissão de câmera e não é realidade aumentada. O jogador controla apenas uma câmera virtual; o UFO se move sozinho.

## Como testar no computador

1. Extraia a pasta do ZIP.
2. Abra um terminal dentro dela.
3. Execute `python -m http.server 8080`.
4. Abra `http://localhost:8080`.
5. Clique na fita para iniciar e mova o mouse sobre a tela para olhar ao redor. Arrastar com o mouse também funciona.

## Como testar no iPhone

1. Publique a pasta no GitHub Pages ou use outro endereço HTTPS.
2. Abra o endereço no Safari.
3. Toque na fita.
4. Toque em **ATIVAR GIROSCÓPIO** e autorize os sensores de movimento.
5. Segure o iPhone na posição em que deseja iniciar e aguarde a calibração inicial. Gire o aparelho para olhar para os lados e incline-o para olhar para cima/baixo.
6. Use `◎` para recentralizar.

O Safari/iOS exige HTTPS e uma ação explícita do usuário para solicitar `DeviceOrientationEvent` em versões compatíveis. Se o sensor não estiver disponível ou for negado, o jogo continua com controle por toque/arrasto.

## Como publicar no repositório GitHub Pages

Repositório: `https://github.com/rodrigofresno/UFO-ON-THE-TAPE`

1. Faça download/backup do conteúdo atual do repositório.
2. Extraia este ZIP.
3. Envie **o conteúdo de `the_tape_rebuild/`** para a raiz do repositório, incluindo `index.html`, `game.js`, `style.css`, `assets/`, `ASSET-INVENTORY.json` e `preservation/`.
4. Confirme em **Settings → Pages** que a publicação está configurada para a branch/pasta correta.
5. Aguarde o deploy e abra `https://rodrigofresno.github.io/UFO-ON-THE-TAPE/`.

Todos os caminhos web são relativos (`assets/...`), então o projeto funciona em uma subpasta do GitHub Pages, sem caminhos absolutos de raiz.

## O que foi identificado no ZIP

- 126 PNGs numerados.
- 10 WAVs, todos preservados no ZIP original e convertidos para MP3 para uso opcional no navegador.
- `images/118.png` (4500×3000): placa fotográfica completa com céu, nuvens, sol e linha urbana distante. É o fundo de gameplay mais evidente entre os recursos recuperados.
- `images/0.png` (4600×3100, RGBA): moldura/elemento de primeiro plano com grande área transparente, compatível visualmente com a moldura de janela/filmagem observada no vídeo.
- `images/82.png` (300×225, RGBA): imagem de fita com a inscrição “UFO on Tape”, usada na tela de entrada.
- `images/5.png` a `images/49.png`: sequência do mesmo UFO em dimensões progressivamente maiores (20×7 até 600×207), utilizada como progressão de escala/distância.
- `images/50.png`, `78.png`, `83.png` a `106.png`: silhuetas/variações borradas de objeto voador; mantidas no pacote e classificadas como candidatas de animação/variação, sem atribuição confirmada à lógica original.
- `images/7.png`, `10.png` a `13.png`: quadros de ruído/estática em 320×240.
- `images/119.png`: brilho circular radial, provável efeito de luz.
- `images/52.png`, `56.png`, `60.png`, `58.png`, `62.png`, `63.png` e vários arquivos pequenos: elementos de HUD, contorno, bateria e interface.
- `images/3.png`, `55.png`, `57.png`, `64.png` a `76.png`, `117.png`: recortes ambientais com transparência (árvores, postes, edifícios e estruturas). Estão preservados, mas suas posições originais no frame não foram recuperadas; por isso não são rearranjados arbitrariamente na cena.
- `images/107.png`, `109.png`, `110.png`, `111.png`, `112.png`, `80.png`: textos/créditos/ícones de interface.
- `stdrt.exe`, `mmfs2.dll`, `AdvDir.mfx`, `kcclock.mfx`, `kcstore.mfx` e `waveflt.sft`: runtime/extensões Clickteam, preservados, não necessários para a versão web.

## Comportamento implementado

- A placa fotográfica 118 é usada como cenário; a escala do enquadramento respira/varia ao longo do tempo e a câmera faz deriva suave. Assim, céu, nuvens, sol e cidade aumentam/diminuem e se deslocam juntos, em vez de o céu ficar visualmente congelado.
- A câmera virtual responde ao mouse no computador e aos sensores de orientação no iPhone.
- O UFO percorre uma trajetória automática independente do jogador. A sequência original 5–49 altera a dimensão do sprite conforme a distância simulada; a câmera altera o enquadramento relativo.
- Há vinheta, scanlines, ruído discreto e oscilação de câmera.
- A fita original recuperada é usada como botão de entrada.
- A moldura transparente 0 é aplicada em primeiro plano com opacidade reduzida.

## Limitações reais / o que não foi recuperado

O ZIP não contém `UOT.exe` nem o projeto-fonte editável do Clickteam. Contém runtime, extensões e recursos extraídos. O vídeo permite observar a experiência, mas não revela o código, a curva exata do UFO, os limites originais de câmera, a sequência exata de zoom, nem o arranjo dos objetos no frame.

Por isso, a movimentação automática do UFO, o ritmo de zoom/deriva do cenário, a calibração dos sensores e os efeitos analógicos desta versão são uma reconstrução funcional, não código original recuperado. A placa 118 é uma imagem completa; a variação visual do céu nesta versão é feita pela câmera virtual (zoom e pan), não por uma sequência comprovada de nuvens animadas. Os recortes ambientais transparentes foram preservados sem inventar suas posições.

Os dez WAVs têm nomes numéricos e a extração não documenta a função de cada um. Os MP3s são conversões para compatibilidade; a faixa 0 está conectada como áudio opcional de teste, não como trilha original confirmada. O projeto começa sem exigir áudio.

## Estrutura

```text
index.html
style.css
game.js
ASSET-INVENTORY.json
assets/
  images/             # 126 PNGs extraídos
  audio/              # MP3s convertidos dos WAVs
preservation/
  UOT-original.zip    # pacote original recebido, preservado integralmente
```


## Ajuste de movimento e zoom (novembro de 2026)

A versão atual sincroniza a escala do cenário e do UFO por uma curva de profundidade compartilhada. O UFO percorre a tela em ritmo mais rápido; a aproximação e o afastamento passam por suavização para evitar saltos de escala. O fundo 118 acompanha o mesmo zoom e também recebe deriva/paralaxe da câmera virtual, portanto não fica travado.

No iPhone, a câmera virtual combina eventos `deviceorientation` (orientação/giroscópio do navegador) com `devicemotion` (aceleração), compensa a rotação da tela e filtra os movimentos para reduzir tremulação sem criar atraso excessivo. O Safari exige HTTPS e autorização explícita quando solicitado.

A trajetória e os tempos são ajustes de reconstrução observacional, não parâmetros originais recuperados do executável Clickteam.
