install:
	yarn install --frozen-lockfile
codegen:
	npx graphql-codegen -c ./bin/graphql-codegen.ts
format:
	npx prettier --write "src/**/*.ts"
format-check:
	npx prettier --check "src/**/*.ts"
lint:
	npx eslint "src/**/*"
lint-fix:
	npx eslint "src/**/*" --fix
lint-err:
	npx eslint "src/**/*" --quiet
typecheck:
	npx tsc --noEmit
test:
	npx jest
build:
	npx tsc --project tsconfig.json
start:
	make server
server:
	npx ts-node-dev --no-notify --respawn --trace-warnings --inspect -r tsconfig-paths/register src/server.ts
clients:
	npx ts-node-dev --no-notify --respawn --trace-warnings --inspect -r tsconfig-paths/register src/clients.ts
start-prod:
	NODE_PATH=dist/ NODE_ENV=production node ./dist/src/start.js
