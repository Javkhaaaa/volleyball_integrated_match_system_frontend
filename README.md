# volleyball-stats-frontend

React 18 + Ant Design + Redux Toolkit + Vite. Mikasa-инспирэйшэн авсан
хүрэн-цэнхэр + шар брэндтэй, tablet-first интерфэйс.

## Шаардлагатай хувилбарууд

- Node 20+, yarn
- Backend асаалттай (`http://localhost:4000`) — proxy энэ рүү чиглэнэ.

## Setup

```bash
yarn install
yarn dev          # http://localhost:3000
```

Production build:

```bash
yarn build && yarn preview
```

## Файлын зохион байгуулалт

```
src/
  main.jsx               # Entry: AntD ConfigProvider + Redux + Router
  App.jsx                # Layout, navigation, role-protected routes
  api/
    index.js             # axios клиент + REST API helpers
    socket.js            # socket.io клиент + match:subscribe wrapper
  store/index.js         # Redux: auth slice
  theme/mikasa.js        # AntD theme tokens (Mikasa blue/yellow/white)
  global.css             # Court grid, scoreboard banner styling
  components/
    LiveScoreboard.jsx   # Том оноо + сетийн дүн + серв тэмдэглэгээ
    CourtAndBench.jsx    # 6-position lineup grid + bench, sub mode
    EventButtons.jsx     # Tablet-first том action товчнууд (2-step)
    ActionLog.jsx        # NCAA-style play-by-play хэвшил
  pages/
    LoginPage.jsx
    AdminUsersPage.jsx       # Хэрэглэгч + role оноох
    TournamentsPage.jsx
    TeamsPage.jsx            # + Drawer-аар тоглогч CRUD
    MatchesListPage.jsx
    MatchScoreboardPage.jsx  # Үзэгчийн нийтийн scoreboard (login шаардахгүй)
    StatEntryPage.jsx        # Статистикчийн court entry хуудас
```

## Хэрэглэгчийн урсгал

| Хэрэглэгч | Юу хийдэг |
|-----------|-----------|
| Үзэгч (нэвтрээгүй) | Scoreboard, play-by-play live харах |
| ADMIN | Бүх CRUD + хэрэглэгч + role оноох |
| STATISTICIAN | Тоглолт эхлүүлэх, event бүртгэх, sub хийх, step-back |
| COACH | Багийн тоглогч CRUD, scoreboard харах (v1) |
| UNASSIGNED | Үзэгчтэй ижил түвшин (admin өргөмжлөлгүй) |

## Mikasa theme

Theme token-ууд `src/theme/mikasa.js`-д тогтоосон:

- `colorPrimary`: `#1A3E8C` — Mikasa MVA200 цэнхэр
- `colorWarning`: `#FFD000` — Mikasa MVA200 шар
- Header: dark blue, accent text шар

`fivb.com`-ын layout-ыг суурь болгож, гэхдээ AntD-ийн layout pattern-аар
тохируулсан. Logo нь conic-gradient ашиглан Mikasa бөмбөгийн давтамжтай тойрог.

## Stat entry хуудасны хэв маяг

NCAA LiveStats-тай аль болох ойртуулсан:

1. **Court grid** — 2 баг тус бүр 6 байрлалаар (P1..P6) том карт-ууд
2. **Bench list** — талбайн доор нөөц тоглогчдын jersey number-ууд
3. **Action buttons** — баруун багана дээр ATTACK/BLOCK/SERVE/RECEPTION/SET/DIG/BHE гэсэн 7 том товч; сонгосны дараа результ (KILL/ERROR/...)
4. **Action Log** — баруун доор play-by-play лог (буцаагаар; терминаль үйлдэл шар-аар онцолно)
5. **Step Back** — сүүлийн event-ийг хүчингүй болгох
6. **Substitution mode** — Switch-ийг идэвхжүүлээд талбайн тоглогч + bench тоглогчоор swap

## Backend-той интеграц

- REST: `vite.config.js`-ийн proxy `/api → :4000`
- Socket.IO: `/socket.io` proxy дээр WebSocket; клиент `match:subscribe` дээр өөрийн матчид нэгдэнэ; backend-аас `scoreboard:update` event ирмэгц UI шинэчилнэ.
