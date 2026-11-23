# Video Studio

Reels / YouTube / таргет видеоларын монтаждауға арналған жоба.

| Құрал | Не үшін керек |
|---|---|
| FFmpeg | Видеоны кесу, біріктіру, зум, музыка қосу |
| Whisper | Сөйлеуді мәтінге айналдыру (субтитр, ыңылдау мен паузаларды табу) |
| Remotion | Анимациялар мен әдемі субтитрлер |
| yt-dlp | Интернеттен видео жүктеу |

Сынақ: `npx remotion render src/index.ts Test out/test.mp4`

## Стиль базалары

- `style-base/asyl-ine/` — «Асыл ине» Stories стилі: `STYLE.md` (толық талдау), `style.json` (баптаулар), `frames/` (әр 0,5 с кадрлар).
- Компоненттер: `src/style/` (`Subtitles`, `Title`, `Stat`, `EndCard`).
- Демо: `npx remotion render src/index.ts AsylDemo out/asyl-demo.mp4`
