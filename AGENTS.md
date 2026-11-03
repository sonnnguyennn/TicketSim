# Agent handoff

Read `TicketSim_UX_Learning_Redesign_Spec.md` at the project root before changing the learning flow. Its opening **Current state and pickup guide** is the current implementation record; later proposal sections preserve the design intent and may describe historical code.

Keep the 112 original tickets and existing user progress. The Guided/Practice/Stateful fixture terminals may return only authored JSON fixture output; they must never execute commands, SSH, VirtualBox, or fabricate output for an unmatched command. The separately authorized Real Lab browser terminal uses an authenticated, fixed-target guest SSH PTY, never a Windows host shell. Edit `scripts/guided-content.mjs` for Guided content, then run `npm run prepare-data`; generated files in `src/data/` and `public/` are not the authoring source.

Verify changes with `npm test -- --run` and `npm run build`. Check the current project state before assuming this directory has Git history.
