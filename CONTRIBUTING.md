# Contributing

## Branches

- Work lands on `develop`. Open a pull request, or push directly if you are the maintainer.
- CI (`quality`, `audit`) runs on every push and pull request.
- When both pass on `develop`, CI fast-forwards `main` to the same commit and triggers the Pages deploy. Nobody pushes to `main` by hand.
- Dependabot opens its pull requests against `develop`. Non-major updates merge on their own once CI is green; major updates need a manual review.

## Before you push

```
yarn lint
yarn test
yarn build
```

Tests must keep coverage at 90% or above. Lighthouse CI (`Web Vitals` workflow) checks accessibility, SEO, LCP and CLS on the built site.
