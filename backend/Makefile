GIT_SHA := $(shell git rev-parse --short=7 HEAD)
PROJECT_ID=mistokens
REGION=us-central1
SERVICE_ACCOUNT=mistokens-backend@mistokens.iam.gserviceaccount.com
setup:
	@echo "[setup] Running setup commands..."
	@npm install

clean: 
	@echo "[clean] Cleaning project..."
	@rm -rf dist
	@rm -rf build

build: clean
	@echo "[build] Building setup commands..."
	@npm run build

test:
	@echo "[test] Running tests..."
	@NODE_ENV=test npm test

test-dev: 
	@echo "[test] Running tests..."
	@NODE_ENV=test npm run-script test:dev

check: build
	@echo "[check] Checking project..."
	@npm run linter
	@npm run prune
	@npx ts-unused-exports tsconfig.json
	@npm run knip

validate-app-name:
	@if [ -z "$(APP_NAME)" ]; then \
		echo "Error: The APP_NAME variable is not set."; \
		exit 1; \
	fi
	@if [ ! -d "src/cmd/$(APP_NAME)" ]; then \
		echo "Error: Application '$(APP_NAME)' does not exist in 'src/cmd/'"; \
		exit 1; \
	fi

validate-cronjob:
	@if [ -z "$(SCHEDULE)" ]; then \
		echo "Error: The SCHEDULE variable is not set."; \
		exit 1; \
	fi

validate-github-username:
	@if [ -z "$(shell git config user.github)" ]; then \
		echo "Error: The GITHUB_USERNAME variable is not set. Please configure it with 'git config user.github <username>'."; \
		exit 1; \
	fi

dev: validate-app-name build
	@echo "[run-dev $(APP_NAME)] running service in dev mode..."
	@export $$(cat src/cmd/$(APP_NAME)/.env) && node_modules/.bin/ts-node -r tsconfig-paths/register src/cmd/$(APP_NAME)/index.ts

debug: validate-app-name build
	@echo "[run-debug $(APP_NAME)] setting up environment for debug mode..."

docker: validate-app-name validate-github-username build
	@echo "[docker $(APP_NAME)] running docker in dev mode..."
	$(eval GITHUB_USERNAME := $(shell git config user.github))
	$(eval DEPLOY_APP_NAME := development-$(APP_NAME)-$(GITHUB_USERNAME))
	@docker build --build-arg APP_NAME=$(APP_NAME) -t $(DEPLOY_APP_NAME):$(GIT_SHA) -f src/cmd/$(APP_NAME)/Dockerfile .
	@docker run --rm --env-file src/cmd/$(APP_NAME)/.env -p 8080:8080 $(DEPLOY_APP_NAME):$(GIT_SHA)
	
deploy: validate-app-name validate-github-username build
	@echo "[deploy-dev $(APP_NAME)] deploying service in dev mode..."
	$(eval GITHUB_USERNAME := $(shell git config user.github))
	$(eval DEPLOY_APP_NAME := development-$(APP_NAME)-$(GITHUB_USERNAME))
	@docker buildx build --platform linux/amd64,linux/arm64 --build-arg APP_NAME=$(APP_NAME) -t gcr.io/$(PROJECT_ID)/$(DEPLOY_APP_NAME):$(GIT_SHA) -f src/cmd/$(APP_NAME)/Dockerfile . --push
	@gcloud secrets versions add $(DEPLOY_APP_NAME) --data-file=src/cmd/$(APP_NAME)/.env || gcloud secrets create $(DEPLOY_APP_NAME) --data-file=src/cmd/$(APP_NAME)/.env
	@gcloud run deploy $(DEPLOY_APP_NAME) \
		--image gcr.io/$(PROJECT_ID)/$(DEPLOY_APP_NAME):$(GIT_SHA) \
		--region $(REGION) \
		--set-env-vars "$$(gcloud secrets versions access latest --secret $(DEPLOY_APP_NAME) | grep -v GOOGLE_APPLICATION_CREDENTIALS | tr '\n' ',')" \
		--service-account $(SERVICE_ACCOUNT) \
		--allow-unauthenticated \
		--memory 4Gi \
		--cpu 2

deploy-video: validate-app-name validate-github-username build
	@echo "[deploy-video $(APP_NAME)] deploying video processing service..."
	$(eval GITHUB_USERNAME := $(shell git config user.github))
	$(eval DEPLOY_APP_NAME := video-processing-$(APP_NAME)-$(GITHUB_USERNAME))
	@docker buildx build --platform linux/amd64,linux/arm64 --build-arg APP_NAME=$(APP_NAME) -t gcr.io/$(PROJECT_ID)/$(DEPLOY_APP_NAME):$(GIT_SHA) -f src/cmd/$(APP_NAME)/Dockerfile . --push
	@gcloud secrets versions add $(DEPLOY_APP_NAME) --data-file=src/cmd/$(APP_NAME)/.env || gcloud secrets create $(DEPLOY_APP_NAME) --data-file=src/cmd/$(APP_NAME)/.env
	@gcloud run deploy $(DEPLOY_APP_NAME) \
		--image gcr.io/$(PROJECT_ID)/$(DEPLOY_APP_NAME):$(GIT_SHA) \
		--region $(REGION) \
		--update-env-vars "$$(gcloud secrets versions access latest --secret $(DEPLOY_APP_NAME) | tr '\n' ',')" \
		--service-account $(SERVICE_ACCOUNT) \
		--allow-unauthenticated \
		--memory 16Gi \
		--cpu 8 \
		--timeout 3600 \
		--max-instances 10 \
		--min-instances 1

deploy-job: validate-app-name validate-github-username
	@echo "[deploy-job $(APP_NAME)] deploying job..."
	$(eval GITHUB_USERNAME := $(shell git config user.github))
	$(eval DEPLOY_APP_NAME := development-$(APP_NAME)-$(GITHUB_USERNAME))
	@cp /home/oydual3/.gcp-keys/mistokens-backend.json ./temp-gcp-key.json
	@docker buildx build --platform linux/amd64 \
		--build-arg APP_NAME=$(APP_NAME) \
		--build-arg GCP_KEY_PATH=$(TEMP_KEY_PATH) \
		-t gcr.io/$(PROJECT_ID)/$(DEPLOY_APP_NAME):$(GIT_SHA) \
		-f src/cmd/$(APP_NAME)/Dockerfile . --push
	@rm ./temp-gcp-key.json
	@gcloud secrets versions add $(DEPLOY_APP_NAME) --data-file=src/cmd/$(APP_NAME)/.env || gcloud secrets create $(DEPLOY_APP_NAME) --data-file=src/cmd/$(APP_NAME)/.env
	@gcloud run jobs deploy $(DEPLOY_APP_NAME) \
		--image gcr.io/$(PROJECT_ID)/$(DEPLOY_APP_NAME):$(GIT_SHA) \
		--region $(REGION) \
		--set-env-vars "$$(gcloud secrets versions access latest --secret $(DEPLOY_APP_NAME) | tr '\n' ',')" \
		--service-account $(SERVICE_ACCOUNT) \
		--memory 1Gi \
		--cpu 1 \
		--task-timeout=60m

deploy-cronjob: validate-cronjob validate-app-name validate-github-username build
	@echo "[deploy-cronjob $(APP_NAME)] Iniciando despliegue del cronjob..."
	$(eval GITHUB_USERNAME := $(shell git config user.github))
	$(eval DEPLOY_APP_NAME := development-$(APP_NAME)-$(GITHUB_USERNAME))
	$(eval TEMP_KEY_PATH := ./temp-gcp-key-$(GITHUB_USERNAME).json)
	
	@echo "[deploy-cronjob $(APP_NAME)] Copiando archivo de clave GCP..."
	@cp /home/oydual3/.gcp-keys/mistokens-backend.json $(TEMP_KEY_PATH)
	
	@echo "[deploy-cronjob $(APP_NAME)] Construyendo imagen Docker..."
	@docker build --platform linux/amd64 \
		--build-arg APP_NAME=$(APP_NAME) \
		--build-arg GCP_KEY_PATH=$(TEMP_KEY_PATH) \
		-t gcr.io/$(PROJECT_ID)/$(DEPLOY_APP_NAME):$(GIT_SHA) \
		-f src/cmd/$(APP_NAME)/Dockerfile .
	
	@echo "[deploy-cronjob $(APP_NAME)] Subiendo imagen Docker..."
	@docker push gcr.io/$(PROJECT_ID)/$(DEPLOY_APP_NAME):$(GIT_SHA)
	
	@echo "[deploy-cronjob $(APP_NAME)] Configurando secretos..."
	@gcloud secrets versions add $(DEPLOY_APP_NAME) --data-file=src/cmd/$(APP_NAME)/.env || gcloud secrets create $(DEPLOY_APP_NAME) --data-file=src/cmd/$(APP_NAME)/.env
	
	@echo "[deploy-cronjob $(APP_NAME)] Desplegando trabajo en Cloud Run..."
	@gcloud run jobs deploy $(DEPLOY_APP_NAME) \
		--image gcr.io/$(PROJECT_ID)/$(DEPLOY_APP_NAME):$(GIT_SHA) \
		--region $(REGION) \
		--set-env-vars "$$(gcloud secrets versions access latest --secret $(DEPLOY_APP_NAME) | grep -v GOOGLE_APPLICATION_CREDENTIALS | tr '\n' ',')" \
		--service-account $(SERVICE_ACCOUNT) \
		--memory 4Gi \
		--cpu 2 \
		--task-timeout=60m
	
	@echo "[deploy-cronjob $(APP_NAME)] Configurando el cronjob..."
	@gcloud scheduler jobs update http $(DEPLOY_APP_NAME) \
		--schedule "$(SCHEDULE)" \
		--http-method POST \
		--uri "https://$(REGION)-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$(PROJECT_ID)/jobs/$(DEPLOY_APP_NAME):run" \
		--oauth-service-account-email $(SERVICE_ACCOUNT) \
		--location $(REGION) || \
	gcloud scheduler jobs create http $(DEPLOY_APP_NAME) \
		--schedule "$(SCHEDULE)" \
		--http-method POST \
		--uri "https://$(REGION)-run.googleapis.com/apis/run.googleapis.com/v1/namespaces/$(PROJECT_ID)/jobs/$(DEPLOY_APP_NAME):run" \
		--oauth-service-account-email $(SERVICE_ACCOUNT) \
		--location $(REGION)

	@echo "[deploy-cronjob $(APP_NAME)] Despliegue del cronjob completado."
	@echo "[deploy-cronjob $(APP_NAME)] IMPORTANTE: Recuerda eliminar manualmente el archivo $(TEMP_KEY_PATH) cuando hayas terminado de depurar."

destroy: validate-app-name validate-github-username
	@echo "[destroy $(APP_NAME)] destroying cronjob and deployment..."
	$(eval GITHUB_USERNAME := $(shell git config user.github))
	$(eval DEPLOY_APP_NAME := development-$(APP_NAME)-$(GITHUB_USERNAME))
	@gcloud scheduler jobs delete $(DEPLOY_APP_NAME) --quiet || true
	@gcloud run jobs delete $(DEPLOY_APP_NAME) --region $(REGION) --quiet || true
	@gcloud run services delete $(DEPLOY_APP_NAME) --region $(REGION) --quiet || true

set-envs: validate-app-name
	@if [ -z "$(ENVIRONMENT)" ]; then \
	echo "Error: The ENVIRONMENT variable is not set."; \
	exit 1; \
	fi
	@if [ "$(ENVIRONMENT)" != "production" ] && [ "$(ENVIRONMENT)" != "staging" ]; then \
		echo "Error: The ENVIRONMENT variable must be either 'production' or 'staging'."; \
		exit 1; \
	fi
	@gcloud secrets versions add $(ENVIRONMENT)-$(APP_NAME) --data-file=src/cmd/$(APP_NAME)/.env || gcloud secrets create $(ENVIRONMENT)-$(APP_NAME) --data-file=src/cmd/$(APP_NAME)/.env

.PHONY: setup build clean test test-dev check validate dev deploy deploy-cronjob destroy set-envs
