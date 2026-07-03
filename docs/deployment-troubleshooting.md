# Deployment Troubleshooting

This project deploys to Vercel under the `xinbaopedia` scope. Keep deployment credentials in environment variables and keep CLI-generated local state out of Git.

## Production deploy

Set `VERCEL_TOKEN` in the shell environment, then run the deployment wrapper:

```sh
export VERCEL_TOKEN=...
node scripts/deploy-production.mjs
```

The wrapper does not accept tokens as command-line arguments. It reads `VERCEL_TOKEN` from the environment, redacts the token from wrapper error messages, runs `vercel link --yes --project xinbaopedia --scope xinbaopedia`, then runs `vercel deploy --prod --yes --scope xinbaopedia`. The Vercel CLI requires `--token` internally for non-interactive CI-style authentication, so callers should use only the environment-variable wrapper entry point.

## Clean CLI-generated local files

The Vercel CLI and npm can create local files that must not be committed:

```sh
rm -rf .vercel .vercel-auth-* .npm-cache
rm -f .env.local
```

If other local environment files were created for testing, remove them or keep them untracked:

```sh
rm -f .env .env.development.local .env.production.local
```

Run the publish-set check before staging or publishing:

```sh
node scripts/verify-publish-set.mjs
```

## TLS warning

Do not deploy with `NODE_TLS_REJECT_UNAUTHORIZED=0`. That setting disables TLS certificate verification and can hide real network or proxy problems. The deployment wrapper removes it from the child process environment by default.

If a shell prints this warning, reset the environment and retry:

```sh
unset NODE_TLS_REJECT_UNAUTHORIZED
unset http_proxy https_proxy HTTP_PROXY HTTPS_PROXY all_proxy ALL_PROXY
node scripts/deploy-production.mjs
```

Use direct Vercel access by default. Only introduce a proxy after confirming a real network problem and approving that proxy path for the specific deployment.
