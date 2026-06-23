# Binary Flip

Binary Flip is a React + TypeScript game built with Vite and Bun. Players flip a line of binary dots to match target numbers using powers of two, then review a batch summary at the end.

## What it does

- Start page for configuring the game
- Lets you set the lower bound, upper bound, number of dots, and number of challenges
- Validates that the chosen range fits the selected dot count and challenge batch
- Generates unique challenge numbers that are not powers of 2
- Play screen shows the current sum, target number, and a live timer
- End screen shows a summary for each challenge and the total time spent

## How to run

Install dependencies and start the app:

```bash
bun install
bun run dev
```

Build for production:

```bash
bun run build
```

Preview the production build:

```bash
bun run preview
```

## Project scripts

- `bun run dev` - start the Vite development server
- `bun run build` - type-check and create a production build
- `bun run lint` - run ESLint
- `bun run preview` - preview the production build locally

## Game rules

- The rightmost dot is index 0 and is worth 1
- Each dot to the left doubles in value: 2, 4, 8, and so on
- A target is solved when the lit dots sum to the target number
- Targets are unique within a batch and never equal a power of 2
