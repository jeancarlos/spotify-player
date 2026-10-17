# Security policy

## Supported versions

Only the latest deploy of `main` (https://vinyla.jeansouza.dev) is supported.

## Reporting a vulnerability

Please do not open a public issue. Use GitHub's private reporting instead:
https://github.com/jeancarlos/vinyla-player-demo/security/advisories/new

You should get a first answer within a week. If the report is confirmed, a fix goes through the normal flow (develop, CI, main) and the advisory is published once it is deployed.

## Scope

The app is a static site with no accounts and no backend. It talks to the Deezer, Wikipedia and LRCLIB APIs from the browser, and keeps favorites and recent plays in `localStorage`. Reports about those third-party services themselves should go to their owners.
